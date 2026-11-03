const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, imports = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { exports, require: id => imports[id], console, setTimeout, clearTimeout, ...globals });
  return exports;
}
const { chooseQuestionOptions, questionOptionTarget } = load('src/utils/questionAutoAnswer.ts');
const profile = { major: 'Artificial Intelligence', skills: ['Python', 'LLM'], interests: ['Software'], intro: '' };
const q = { id: 'arbitrary', dimension: ['interests'], signals: ['INT1'], text: 'What interests you?', allow_multiple: true, max_selections: 2, options: [{id:'x',text:'Mechanical design'}, {id:'z',text:'Software and computing'}, {id:'k',text:'AI and data'}] };
assert.deepEqual(Array.from(chooseQuestionOptions(q, profile)).sort(), ['k','z']);
assert.equal(chooseQuestionOptions({...q,allow_multiple:false},profile).length,1);
assert.equal(chooseQuestionOptions({...q,max_selections:1},profile).length,1);
assert.equal(chooseQuestionOptions({...q,options:[{id:'u',text:'Not sure yet'},{id:'a',text:'Energy systems'}]}, {major:''})[0], 'u');
assert.equal(chooseQuestionOptions({...q,options:[]},profile).length,0);
const bank = JSON.parse(fs.readFileSync('../backend/questionaire/EngiPath_Reflection_Question_Bank_Final_v1.json','utf8')).question_bank;
for (const item of bank) {
  const question = {...item, text:item.text.en, options:item.options.map(o=>({...o,text:o.text.en}))};
  const ids=chooseQuestionOptions(question,profile);
  assert.ok(ids.every(id=>question.options.some(o=>o.id===id)));
  assert.ok(ids.length <= (question.allow_multiple ? Math.max(1,question.max_selections||1) : 1));
}
console.log(`PASS: selection rules and valid IDs/limits across ${bank.length} bank questions`);

// Exercise the actual hook with a small deterministic React scheduler and mocked API.
(async()=> {
  let slots=[], cursor=0, effects=[], dirty=true, result, timers=[], submits=0, summaryCalls=0;
  const depsEqual=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const react={
    useState(initial){const i=cursor++; if(!slots[i]) slots[i]={value:initial}; return [slots[i].value, v=>{slots[i].value=typeof v==='function'?v(slots[i].value):v;dirty=true;}];},
    useRef(initial){const i=cursor++; return slots[i] ||= {current:initial};},
    useCallback(fn,deps){const i=cursor++; if(!slots[i]||!depsEqual(slots[i].deps,deps)) slots[i]={value:fn,deps};return slots[i].value;},
    useEffect(fn,deps){const i=cursor++;if(!slots[i]||!depsEqual(slots[i].deps,deps)){const prev=slots[i];slots[i]={deps};effects.push(()=>{prev?.cleanup?.();slots[i].cleanup=fn();});}}
  };
  const noop=()=>{};
  const app={profile,studentId:'real-student',currentCycle:1,isAdminMode:true,currentStep:3,language:'en',isCalibratingCycle:false,isQuestionAutoPilotRunning:false,setCurrentStep:noop,setLiveCompetencyScores:noop,setDynamicAnswerCount:noop,setQuestionAutoPilotTarget:noop,cancelDemoAutoPilot(){app.isQuestionAutoPilotRunning=false;dirty=true;}};
  let rejectAnswer=false;
  const api={startQuestionnaire:async()=>({}),getNextQuestion:async()=>({question:q,is_complete:false,progress:{answered_count:2}}),getHeardSummary:async()=>{summaryCalls++;return {opening:'Real summary'};},submitQuestionnaireAnswer:async(sid,id,ids)=>{submits++;assert.equal(sid,'real-student');assert.equal(id,q.id);assert.ok(ids.length);if(rejectAnswer)throw Error('expected API failure');return {success:true,answered_count:3,is_complete:true,next_question:null};}};
  const {useDiagnostic}=load('src/hooks/useDiagnostic.ts',{'react':react,'../context/AppContext':{useApp:()=>app},'../services/api':{apiService:api},'../utils/mockData':{DIAGNOSTIC_QUESTIONS:[]},'../utils/questionAutoAnswer':{chooseQuestionOptions,questionOptionTarget},'../i18n/questionBankKo':{localizeQuestion:q=>q}}, {setTimeout:fn=>{const t={fn};timers.push(t);return t;},clearTimeout:t=>{timers=timers.filter(x=>x!==t);},console:{...console,error:noop}});
  async function flush(){for(let n=0;n<20;n++){if(dirty){dirty=false;cursor=0;result=useDiagnostic();const pending=effects;effects=[];pending.forEach(fn=>fn());}await Promise.resolve();}}
  async function tick(){const t=timers.shift();t?.fn();await flush();}
  await flush();assert.equal(result.answeredCount,2);
  app.isQuestionAutoPilotRunning=true;dirty=true;await flush();
  // Stopping during the scan removes the queued selection/submission timer.
  app.cancelDemoAutoPilot();await flush();assert.equal(timers.length,0);assert.equal(submits,0);
  app.isQuestionAutoPilotRunning=true;dirty=true;await flush();
  for(let i=0;i<5&&timers.length;i++)await tick();
  await flush();assert.equal(submits,1);assert.equal(summaryCalls,1);assert.equal(result.isComplete,true);assert.equal(app.isQuestionAutoPilotRunning,false);assert.equal(result.heardSummary.opening,'Real summary');
  console.log('PASS: resume after two manual answers, stop during scan, single submission, completion and real summary');
  // Reload another session, fail submission, then recover manually; duplicate calls are locked.
  app.currentCycle=2;dirty=true;await flush();rejectAnswer=true;
  app.isQuestionAutoPilotRunning=true;dirty=true;await flush();
  for(let i=0;i<5&&timers.length;i++)await tick();
  await flush();assert.equal(app.isQuestionAutoPilotRunning,false);assert.ok(result.questionError);
  rejectAnswer=false;const before=submits;await Promise.all([result.submitAnswer(),result.submitAnswer()]);await flush();assert.equal(submits,before+1);assert.equal(result.isComplete,true);
  console.log('PASS: API failure stops automation, manual recovery and duplicate submission lock');
  app.currentCycle=3;dirty=true;await flush();
  let release;api.submitQuestionnaireAnswer=()=>new Promise(resolve=>{release=resolve;});
  result.setSelectedOptionIds(['z']);await flush();const pending=result.submitAnswer();await flush();
  app.studentId='another-student';app.currentCycle=4;dirty=true;await flush();
  release({success:true,answered_count:99,is_complete:true,next_question:null});await pending;await flush();
  assert.equal(result.answeredCount,2);assert.equal(result.isComplete,false);
  console.log('PASS: old session response cannot overwrite the new session');
})().catch(err=>{console.error(err);process.exitCode=1;});
