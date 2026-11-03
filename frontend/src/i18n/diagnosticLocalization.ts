/**
 * Presentation-only Korean localization for deterministic questionnaire text.
 * The API payload, answer ids and other supported languages are not modified.
 * Gemini's arbitrary free-form text must be localized at the backend prompt layer.
 */
export function localizeDiagnosticBridge(text: string | null | undefined, language: string): string {
  if (!text || language !== 'ko') return text || '';
  const input = text.trim();
  const namePrefix = /^Hi (.+?)!\s*/.exec(input);
  const line = namePrefix ? input.slice(namePrefix[0].length) : input;
  const greeting = namePrefix ? `${namePrefix[1]}님, ` : '';

  const welcome = /^Welcome! Based on your journey in (.+?) with focus on (.+?) aiming for (.+?), let's look at your core curiosity and motivation:$/s.exec(line);
  if (welcome) {
    const goal = welcome[3].replace(/ engineering$/i, ' 관련 진로');
    return `${greeting}${welcome[1]} 분야에서 ${welcome[2]} 역량을 중심으로 ${goal}를 탐색하고 계시네요. 먼저 관심사와 동기를 살펴볼게요.`;
  }
  if (line === "I noticed your actual problem-solving choices reflect stronger engineering mastery than your initial self-view. Let's validate your true instincts:") {
    return `${greeting}실제 문제 해결 방식에서 스스로 평가한 것보다 높은 공학 역량이 나타났어요. 다음 상황으로 강점을 더 확인해 볼게요.`;
  }
  if (line === "You indicated high confidence here, yet earlier you chose a more exploratory or ad-hoc debugging step. Let's see how you handle this scenario under real constraints:") {
    return `${greeting}이 영역에 자신감을 보였지만 앞선 선택에서는 탐색적인 문제 해결 방식을 사용했어요. 실제 제약이 있는 상황에서는 어떻게 접근하는지 살펴볼게요.`;
  }
  const midpoint = /^Milestone Reached \(50% Calibrated\): We've established your foundation in (.+?)! For the second half, I've recalibrated our probes specifically for (.+?) to evaluate hands-on execution, cross-discipline teamwork, and project trade-offs:$/s.exec(line);
  if (midpoint) {
    return `진단 절반을 마쳤어요! ${midpoint[1]} 분야의 기본 역량을 살펴봤고, 이제 ${midpoint[2]} 직무와 관련된 실무 실행력·협업·의사결정을 확인할게요.`;
  }
  const notes = /^Got it — especially noting: "([\s\S]+)"\. Building directly on that experience:$/s.exec(line);
  if (notes) return `앞서 작성한 경험 “${notes[1]}”을 참고했어요. 이 경험을 바탕으로 다음 질문을 이어 갈게요.`;
  if (/^Makes sense — leaning toward '.+'\. Let's see how that translates into this next scenario:$/s.test(line)) {
    return '방금 선택한 답변을 바탕으로 다음 상황에서의 문제 해결 방식을 살펴볼게요.';
  }
  const next = /^Great reflection\. Moving forward into your next (.+?) capability dimension:$/s.exec(line);
  if (next) return `좋은 답변이에요. 이제 ${next[1]} 분야의 다음 역량을 살펴볼게요.`;
  // Do not invent a translation for arbitrary Gemini-generated narratives.
  return input;
}

const KO_DIMENSIONS: Record<string, string> = {
  interests_motivation: '관심사와 동기', interest_motivation: '관심사와 동기',
  interests: '관심사', motivation: '동기', technical_fundamentals: '전공 기초 역량',
  programming: '프로그래밍', prototyping: '시제품 제작', systems_thinking: '시스템적 사고',
  communication: '의사소통', learning_agility: '학습 적응력',
  problem_solving: '문제 해결', troubleshooting: '오류 분석 및 해결',
  debugging: '디버깅', teamwork: '팀워크', leadership: '주도성',
  self_awareness: '자기 이해', confidence: '자신감', execution: '실행력',
  learning: '학습', initiative: '주도성', autonomy: '자율성',
  collaboration: '협업', resilience: '회복탄력성',
};
export function localizeDiagnosticDimension(value: string, language: string): string {
  if (language !== 'ko') return value.replace(/_/g, ' ');
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return KO_DIMENSIONS[key] ?? value.replace(/_/g, ' ');
}
