/** Presentation-only translations of deterministic Engipath plan templates.
 *  Exact bilingual templates mirror backend/app/i18n_outputs.py. This module never
 *  changes saved tasks, completion flags, request payloads, or generated data.
 *  Free-form AI/user text is not guessed or machine-translated.
 */
import { contentLanguage } from './localeStore';

const PAIRS: Array<{ key: string; ko: string; en: string }> = [
  {
    "key": "plan_title",
    "ko": "{area} 역량을 활용하는 소규모 프로젝트 완성하기",
    "en": "Build one small project that exercises {area}"
  },
  {
    "key": "plan_why",
    "ko": "{area}은(는) {role} 직무에 필요하지만 현재 프로필에 직접적인 경험 근거가 부족합니다.",
    "en": "{area} is relevant to {role} but currently has limited direct evidence in your profile."
  },
  {
    "key": "plan_what",
    "ko": "{area}을(를) 실제로 활용할 수 있는 작은 프로젝트를 정해 완성하고 작업 과정을 기록하세요.",
    "en": "Choose a small real project where you apply {area}, finish it and document your work."
  },
  {
    "key": "plan_evidence",
    "ko": "프로젝트 요약 및 구체적인 결과물 1~2개",
    "en": "Short project write-up + 1–2 concrete outcomes"
  },
  {
    "key": "plan_reflection",
    "ko": "{area}을(를) 활용하면서 가장 흥미로웠던 부분은 무엇이고, 가장 어려웠던 결정은 무엇이었나요?",
    "en": "What did you most enjoy about {area}, and what was your hardest decision?"
  },
  {
    "key": "plan_deliver_label",
    "ko": "{area} 관련 결과물 1개 완성",
    "en": "Complete one {area} deliverable"
  },
  {
    "key": "plan_deliver_detail",
    "ko": "{area}을(를) 활용하는 작은 프로젝트나 실제 작업을 선택하고 완성한 뒤 결과를 기록하세요.",
    "en": "Choose and finish a small project using {area}, then document the result."
  },
  {
    "key": "plan_collect_label",
    "ko": "증빙 자료 1~2개 모으기",
    "en": "Collect 1–2 evidence artifacts"
  },
  {
    "key": "plan_collect_detail",
    "ko": "수행 내용을 보여주는 코드, 사진 또는 짧은 보고서를 정리하세요.",
    "en": "Keep code, photos or a write-up showing what you completed."
  },
  {
    "key": "plan_reflect_label",
    "ko": "짧은 회고 작성하기",
    "en": "Write a short reflection"
  },
  {
    "key": "plan_reflect_detail",
    "ko": "즐거웠던 점과 가장 어려웠던 의사결정을 짧게 정리하세요.",
    "en": "Write down what you enjoyed and the hardest decision you made."
  },
  {
    "key": "plan_milestone_title",
    "ko": "{area} 역량 심화",
    "en": "Strengthen {area}"
  },
  {
    "key": "plan_milestone_desc",
    "ko": "{area}을(를) 활용하는 프로젝트나 과정을 1개 이상 완료하고 성과를 기록하세요.",
    "en": "Complete a substantial project or course using {area} and document your results."
  },
  {
    "key": "plan_milestone_label",
    "ko": "{area} 프로젝트 또는 교육과정 완료",
    "en": "Finish a substantive {area} project or course"
  },
  {
    "key": "plan_milestone_detail",
    "ko": "{area} 관련 과정이나 자기주도 프로젝트를 계획부터 결과물까지 완료하세요.",
    "en": "Complete a course or self-directed project using {area} from start to finish."
  },
  {
    "key": "plan_publish_label",
    "ko": "결과 공유하기",
    "en": "Share outcomes"
  },
  {
    "key": "plan_publish_detail",
    "ko": "무엇을 만들고 배웠는지 GitHub, 블로그 또는 포트폴리오에 정리해 공유하세요.",
    "en": "Share what you built or learned in a repository, blog or portfolio."
  },
  {
    "key": "plan_vision",
    "ko": "{areas} 분야에서 실질적인 성과를 축적하고, 점차 독립적으로 수행할 수 있는 프로젝트의 범위를 넓혀가세요.",
    "en": "Build a portfolio of increasingly independent real-world work in {areas}."
  },
  {
    "key": "plan_target_area",
    "ko": "목표 분야",
    "en": "your target area"
  },
  {
    "key": "duration_short",
    "ko": "4~8주",
    "en": "4–8 weeks"
  },
  {
    "key": "duration_vision",
    "ko": "1~2년",
    "en": "1–2 years"
  },
  {
    "key": "duration_months",
    "ko": "{count}개월",
    "en": "{count} months"
  }
];

const MAJORS_KO_EN: Record<string, string> = {
  '컴퓨터공학': 'Computer Engineering',
  '컴퓨터공학과': 'Computer Engineering',
  '컴퓨터과학': 'Computer Science',
  '컴퓨터과학과': 'Computer Science',
  '소프트웨어공학': 'Software Engineering',
  '소프트웨어학과': 'Software Engineering',
  '기계공학': 'Mechanical Engineering',
  '기계공학과': 'Mechanical Engineering',
  '전자공학': 'Electronic Engineering',
  '전자공학과': 'Electronic Engineering',
  '전기공학': 'Electrical Engineering',
  '전기공학과': 'Electrical Engineering',
  '산업공학': 'Industrial Engineering',
  '산업공학과': 'Industrial Engineering',
  '화학공학': 'Chemical Engineering',
  '토목공학': 'Civil Engineering',
  '로봇공학': 'Robotics Engineering',
  '정보보안': 'Information Security',
  '인공지능': 'Artificial Intelligence',
  '데이터사이언스': 'Data Science',
};

export function localizeMajorForDisplay(major: string | null | undefined, language: string): string {
  const value = major || '';
  if (contentLanguage(language) !== 'en') return value;
  return MAJORS_KO_EN[value.trim()] || value;
}

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Matches a complete template only; never guesses a translation for arbitrary text.
function templateMatch(template: string, value: string): Record<string, string> | null {
  const paramNames: string[] = [];
  const token = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  let cursor = 0;
  let expression = '^';
  for (const match of template.matchAll(token)) {
    const offset = match.index ?? 0;
    expression += escapeRegex(template.slice(cursor, offset));
    expression += '(.+?)';
    paramNames.push(match[1]);
    cursor = offset + match[0].length;
  }
  expression += escapeRegex(template.slice(cursor)) + '$';
  const captures = new RegExp(expression).exec(value);
  if (!captures) return null;
  const result: Record<string, string> = {};
  for (let i = 0; i < paramNames.length; i++) result[paramNames[i]] = captures[i + 1];
  return result;
}

function formatTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, key: string) => values[key] || '');
}

export function localizeSavedPlanText(input: string | null | undefined, language: string): string {
  if (!input) return '';
  const target = contentLanguage(language);
  for (const pair of PAIRS) {
    const source = target === 'en' ? pair.ko : pair.en;
    const match = templateMatch(source, input);
    if (match) return formatTemplate(target === 'en' ? pair.en : pair.ko, match);
  }
  return input;
}
