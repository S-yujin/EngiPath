import type { DynamicQuestion, UserProfile } from '../types';

const groups = [
  ['python', 'java', 'programming', 'software', 'computing', 'code', 'debug', 'algorithm'],
  ['ai', 'llm', 'data', 'machine', 'learning', 'model', 'agent'],
  ['robot', 'automation', 'control', 'sensor', 'embedded', 'electronics', 'hardware'],
  ['mechanical', 'cad', 'design', 'prototype', 'manufacturing'],
  ['research', 'experiment', 'analysis', 'science'],
  ['team', 'lead', 'communication', 'present', 'collaborate'],
];
const words = (text: string) => new Set(text.toLowerCase().match(/[\p{L}\p{N}+#]+/gu) || []);

// Rank the actual options by profile evidence, never by answer ID or question order.
// Uncertainty is preferred when the profile gives no supporting evidence.
export function chooseQuestionOptions(question: DynamicQuestion, profile: UserProfile): string[] {
  const evidence = words([profile.major, profile.intro, ...(profile.skills || []),
    ...(profile.interests || []), ...(profile.transcriptData?.courses.map(c => c.name) || [])].join(' '));
  const context = words([...question.dimension, ...question.signals, question.text].join(' '));
  const ranked = question.options.map((option, index) => {
    const tokens = words(option.text);
    let score = [...tokens].filter(t => t.length > 2 && evidence.has(t)).length * 3;
    for (const group of groups) {
      if (group.some(t => evidence.has(t)) && group.some(t => tokens.has(t))) {
        score += 4 + (group.some(t => context.has(t)) ? 2 : 0);
      }
    }
    const uncertain = /not sure|unsure|still exploring|little experience|not yet|none of|no experience/i.test(option.text);
    return { id: option.id, score, uncertain, index };
  }).sort((a, b) => b.score - a.score || Number(b.uncertain) - Number(a.uncertain) || a.index - b.index);
  const limit = question.allow_multiple ? Math.max(1, Math.floor(question.max_selections || 1)) : 1;
  const supported = ranked.filter(o => o.score > 0 && !o.uncertain);
  return (supported.length ? supported : ranked.slice(0, 1)).slice(0, limit).map(o => o.id);
}

export const questionOptionTarget = (questionId: string, optionId: string) =>
  `question-option-${encodeURIComponent(questionId)}-${encodeURIComponent(optionId)}`;
