import { CompetencyScores, ConfidenceRanking, DiagnosticQuestion, DreamJob } from '../types';
import { MAJOR_PRESETS } from './mockData';

export const COMPETENCY_LABELS: Record<keyof CompetencyScores, string> = {
  technicalFundamentals: 'Technical Fundamentals',
  programming: 'Programming & CS',
  prototyping: 'Physical Prototyping',
  systemsThinking: 'Systems Thinking',
  communication: 'Communication & Teamwork',
  learningAgility: 'Learning Agility',
};

export const COMPETENCY_COLORS: Record<keyof CompetencyScores, string> = {
  technicalFundamentals: '#1A2B4C',
  programming: '#4A90D9',
  prototyping: '#F5A623',
  systemsThinking: '#27AE60',
  communication: '#9B51E0',
  learningAgility: '#E67E22',
};

export function getDefaultScores(): CompetencyScores {
  return {
    technicalFundamentals: 50,
    programming: 40,
    prototyping: 45,
    systemsThinking: 50,
    communication: 50,
    learningAgility: 60,
  };
}

export function inferScoresFromProfile(
  year: number,
  major: string,
  transcriptCourses?: Array<{ competency: keyof CompetencyScores; grade: string }>
): CompetencyScores {
  // Find matching major preset or fallback
  const normalizedMajor = Object.keys(MAJOR_PRESETS).find(
    (k) => k.toLowerCase() === major.toLowerCase() || major.toLowerCase().includes(k.toLowerCase())
  );

  const preset = normalizedMajor ? MAJOR_PRESETS[normalizedMajor].defaultScores : getDefaultScores();
  const result: CompetencyScores = { ...preset };

  // Year factor (Year 1 to 4+)
  const yearMultiplier = 0.8 + (Math.min(4, Math.max(1, year)) - 1) * 0.1; // Year 1: 0.8, Year 2: 0.9, Year 3: 1.0, Year 4: 1.1

  (Object.keys(result) as Array<keyof CompetencyScores>).forEach((key) => {
    result[key] = Math.round(Math.min(95, Math.max(20, result[key] * yearMultiplier)));
  });

  // Transcript boost if courses provided
  if (transcriptCourses && transcriptCourses.length > 0) {
    transcriptCourses.forEach((c) => {
      const gradeMultiplier = c.grade.startsWith('A') ? 6 : c.grade.startsWith('B') ? 4 : 2;
      result[c.competency] = Math.min(98, result[c.competency] + gradeMultiplier);
    });
  }

  return result;
}

export function calculateMatchPercentage(
  current: CompetencyScores,
  target: CompetencyScores
): number {
  const keys = Object.keys(target) as Array<keyof CompetencyScores>;
  if (keys.length === 0) return 50;

  let totalRatio = 0;
  keys.forEach((key) => {
    const targetVal = target[key] || 75;
    const currentVal = current[key] || 0;
    // Ratio capped at 1.15 to avoid single overachievements skewing too hard
    const ratio = Math.min(1.15, currentVal / targetVal);
    totalRatio += ratio;
  });

  const percentage = Math.round((totalRatio / keys.length) * 100);
  return Math.min(100, Math.max(15, percentage));
}

export function getConfidenceRanking(matchPercent: number): ConfidenceRanking {
  if (matchPercent < 40) return 'Low';
  if (matchPercent <= 70) return 'Medium';
  return 'High';
}

export function getRankingColor(ranking: ConfidenceRanking): {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  badgeText: string;
} {
  switch (ranking) {
    case 'High':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-800',
      };
    case 'Medium':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-300',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
      };
    case 'Low':
    default:
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-300',
        badgeBg: 'bg-orange-100',
        badgeText: 'text-orange-800',
      };
  }
}

export function calculateDiagnosticUpdates(
  baselineScores: CompetencyScores,
  answers: Record<string, { value: number | string; text?: string }>,
  questions: DiagnosticQuestion[]
): { updatedScores: CompetencyScores; answeredCount: number } {
  const scores = { ...baselineScores };
  let count = 0;

  questions.forEach((q) => {
    const answer = answers[q.id];
    if (answer !== undefined && answer !== null && (answer.value !== '' || (answer.text && answer.text.trim().length > 0))) {
      count++;
      const comp = q.competency;
      let scoreBonus = 0;

      if (q.format === 'slider') {
        const val = typeof answer.value === 'number' ? answer.value : parseInt(answer.value as string, 10) || 3;
        // 1 -> -10, 2 -> -4, 3 -> +2, 4 -> +8, 5 -> +15
        scoreBonus = (val - 3) * 6 * q.weight * 3;
      } else if (q.format === 'multiple-choice') {
        const optionIndex = q.options ? q.options.indexOf(answer.value as string) : -1;
        if (optionIndex >= 0 && q.options) {
          const normalized = optionIndex / (q.options.length - 1); // 0 to 1
          scoreBonus = (normalized - 0.5) * 20 * q.weight * 3;
        }
      } else if (q.format === 'open-ended') {
        const textLen = (answer.text || '').trim().length;
        if (textLen > 40) {
          scoreBonus = 12 * q.weight * 2.5;
        } else if (textLen > 10) {
          scoreBonus = 6 * q.weight * 2.5;
        }
      }

      scores[comp] = Math.round(Math.min(98, Math.max(20, scores[comp] + scoreBonus)));
    }
  });

  return { updatedScores: scores, answeredCount: count };
}
