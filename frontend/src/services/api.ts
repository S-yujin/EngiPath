import {
  UserProfile,
  ReflectionPortrait,
  ReflectionItem,
  ActionPlan,
  CompetencyScores
} from '../types';
import { MOCK_PORTRAIT } from '../utils/mockData';
import { getUiLanguage } from '../i18n/localeStore';

/**
 * Dev: /api → Vite proxy → FastAPI (local or DHub).
 * Static deployment: set VITE_API_BASE_URL to the HTTPS DHub address.
 * API keys never belong in this frontend environment.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL?.trim() || '/api').replace(/\/+$/, '');
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

async function fetchWithFallback<T>(url: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // DHub backend may read this to choose Gemini output language.
        // Request/response schemas and question IDs remain unchanged.
        'Accept-Language': getUiLanguage(),
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      // Keep the server's validation message visible for debugging.
      let detail = res.statusText;
      try {
        const payload = await res.json();
        if (payload?.detail) detail = typeof payload.detail === 'string' ? payload.detail : JSON.stringify(payload.detail);
      } catch { /* response is not JSON */ }
      throw new Error(`${res.status} ${detail} (${url})`);
    }
    return await res.json();
  } catch (err) {
    // Never disguise a failed DHub API call as a successful result.
    // The built-in demonstration can still be enabled intentionally.
    if (DEMO_MODE && fallbackData !== undefined) {
      console.warn(`[Engipath demo fallback] ${url}`, err);
      return fallbackData;
    }
    throw err;
  }
}

/** Step 1 payload: Minimum Viable Profile (matches backend StudentCreate). */
export interface OnboardingPayload {
  major?: string;
  year?: number;
  intro?: string;
  skills?: string[];
  interests?: string[];
  experiences?: Array<{
    type: string;
    title?: string;
    description?: string;
    tools_used?: string[];
    learned?: string[];
  }>;
}

/** Step 2 payload: a single curated career card (matches backend CareerCard). */
export interface CuratedCareer {
  onetsoc_code: string;
  title: string;
  description: string;
  alignment: 'Low' | 'Moderate' | 'Good' | 'High';
  reasons: string[];
  uncertainties?: string[];
}

/** Step 4: calibrated profile entry from the questionnaire intelligence layer. */
export interface CalibratedReflectionEntry {
  signal: string;
  label: string;
  reason_code: string;
  student_self_view: string | null;
  experience_strength: number | null;
  state_confidence: number;
}

export interface CalibratedProfile {
  student_id: string;
  reflection: {
    supported_strengths: CalibratedReflectionEntry[];
    possible_hidden_strengths: CalibratedReflectionEntry[];
    areas_to_validate: CalibratedReflectionEntry[];
    developing_picture: CalibratedReflectionEntry[];
    still_taking_shape: CalibratedReflectionEntry[];
  };
}

// Deterministic signal -> radar dimension mapping (PS1=Problem Framing, ...).
const SIGNAL_TO_COMPETENCY: Record<string, keyof CompetencyScores> = {
  PS1: 'systemsThinking',
  PS2: 'technicalFundamentals',
  LEARN1: 'learningAgility',
  LEARN2: 'learningAgility',
  EXEC1: 'prototyping',
  EXEC2: 'prototyping',
  COM1: 'communication',
  COM2: 'communication',
  MGMT1: 'systemsThinking',
  MGMT2: 'learningAgility'
};

const REASON_PHRASES: Record<string, string> = {
  insufficient_information: 'not enough observations yet',
  no_self_view_available: 'you have not stated a self-view yet',
  low_self_view_high_experience: 'you rate yourself lower than your answers show',
  high_self_view_high_experience: 'your self-view matches strong questionnaire evidence',
  high_self_view_low_experience: 'you rate yourself highly but the evidence is still thin',
  moderate_evidence_or_mixed: 'mixed or moderate evidence so far'
};

function mapCalibratedEntry(e: CalibratedReflectionEntry): ReflectionItem {
  const exp = e.experience_strength != null ? `${Math.round(e.experience_strength * 100)}%` : 'n/a';
  const conf = `${Math.round((e.state_confidence || 0) * 100)}%`;
  const korean = getUiLanguage() === 'ko';
  const selfView = e.student_self_view ?? (korean ? '미응답' : 'unstated');
  const reason = korean ? ({
    insufficient_information: '아직 관찰된 정보가 충분하지 않아요',
    no_self_view_available: '아직 본인의 평가가 제공되지 않았어요',
    low_self_view_high_experience: '스스로 평가한 것보다 실제 경험에서 강점이 보여요',
    high_self_view_high_experience: '본인의 평가와 진단 근거가 잘 일치해요',
    high_self_view_low_experience: '자신감은 높지만 근거를 조금 더 확인할 필요가 있어요',
    moderate_evidence_or_mixed: '지금까지의 근거가 혼재되어 있어요',
  } as Record<string, string>)[e.reason_code] ?? e.reason_code : REASON_PHRASES[e.reason_code] ?? e.reason_code;
  return {
    id: e.signal,
    label: e.label,
    evidence: korean
      ? `자가 평가: ${selfView} · 경험 근거 ${exp} · 분석 신뢰도 ${conf} — ${reason}`
      : `Self-view: ${selfView} · evidence ${exp} · model confidence ${conf} — ${reason}`, 
    competency: SIGNAL_TO_COMPETENCY[e.signal] ?? 'technicalFundamentals'
  };
}

function mapCalibratedToPortrait(profile: CalibratedProfile): ReflectionPortrait {
  const r = profile.reflection;
  const supported = r.supported_strengths.map(mapCalibratedEntry);
  const hidden = r.possible_hidden_strengths.map(mapCalibratedEntry);
  const validate = r.areas_to_validate.map(mapCalibratedEntry);
  const developing = r.developing_picture.map(mapCalibratedEntry);
  const shape = r.still_taking_shape.map(mapCalibratedEntry);

  return {
    supported_strengths: supported,
    possible_hidden_strengths: hidden,
    areas_to_validate: validate,
    developing_picture: developing,
    still_taking_shape: shape,
    summary_narration: getUiLanguage() === 'ko'
      ? '설문 답변과 경험을 바탕으로 정리한 나의 공학 역량 분석 결과예요.'
      : 'Here is your calibrated engineering reflection portrait based on your questionnaire responses.',
    strengths: supported,
    overlookedStrengths: hidden,
    areasToValidate: validate,
    developmentAreas: developing,
    insufficientInfo: shape
  };
}

/** Step 5 payload: backend action plan (planning_service contract, handoff §25). */
export interface BackendShortTermAction {
  title: string;
  why?: string;
  what_to_do?: string;
  duration?: string;
  suggested_evidence?: string;
  reflection_prompt?: string;
  minimum_requirements?: Array<{ label: string; detail?: string }>;
}

export interface BackendLongTermMilestone {
  timeframe?: string;
  title?: string;
  description?: string;
  minimum_requirements?: Array<{ label: string; detail?: string }>;
}

export interface BackendActionPlan {
  short_term_actions: BackendShortTermAction[];
  long_term_vision: {
    timeframe?: string;
    description?: string;
    milestones?: BackendLongTermMilestone[];
  };
}

function mapBackendActionPlan(plan: BackendActionPlan): ActionPlan {
  const shortTerm = plan.short_term_actions.map((a, i) => ({
    id: `sta-${i}`,
    title: a.title,
    // One-line summary only; concrete steps live in each requirement's
    // collapsible detail (why / suggested_evidence stay server-side).
    description: a.what_to_do || a.why || '',
    timeCommitment: a.duration || (getUiLanguage() === 'ko' ? '4~8주' : '4-8 weeks'),
    resourceLink: '',
    completed: false,
    saved: true,
    minimumRequirements: (a.minimum_requirements || [])
      .filter((r) => r.label)
      .map((r) => ({ label: r.label, detail: r.detail }))
  }));

  const vision = plan.long_term_vision || {};
  const milestones = (vision.milestones || [])
    .filter((m) => m.title)
    .map((m, i) => ({
      id: `ltm-${i}`,
      title: m.title as string,
      timeline: m.timeframe || (getUiLanguage() === 'ko' ? `${6 * (i + 1)}개월` : `${6 * (i + 1)} months`),
      notes: m.description,
      completed: false,
      minimumRequirements: (m.minimum_requirements || [])
        .filter((r) => r.label)
        .map((r) => ({ label: r.label, detail: r.detail }))
    }));
  const longTerm = milestones.length > 0
    ? milestones
    : vision.description
      ? [{
          id: 'ltv-0',
          title: getUiLanguage() === 'ko' ? '장기 진로 목표' : 'Long-Term Career Vision',
          timeline: vision.timeframe || (getUiLanguage() === 'ko' ? '1~2년' : '1-2 years'),
          notes: vision.description,
          completed: false
        }]
      : [];

  return {
    shortTerm,
    longTerm,
    visionDescription: vision.description || undefined,
    savedAt: new Date().toISOString().split('T')[0]
  };
}

export const apiService = {
  // Step 1: create student with Minimum Viable Profile
  async createStudent(payload: OnboardingPayload): Promise<{ student_id: string }> {
    return fetchWithFallback<{ student_id: string }>(
      '/students',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
  },

  // Step 1.5: "Start Comparison" — AI-generated radar chart baseline.
  async getBaseline(studentId: string): Promise<{ scores: import('../types').CompetencyScores }> {
    return fetchWithFallback<{ scores: import('../types').CompetencyScores }>(
      `/students/${studentId}/baseline`,
      { method: 'POST' }
    );
  },

  // Step 2: LLM-curated career cards from the student's profile
  async getCuratedCards(studentId: string): Promise<{ careers: CuratedCareer[] }> {
    return fetchWithFallback<{ careers: CuratedCareer[] }>(
      `/students/${studentId}/careers/cards`,
      {
        method: 'POST',
        body: JSON.stringify({ limit: 6 })
      }
    );
  },

  // Step 3: Interactive Questionnaire Engine (Vetted Question Bank & Signal State)
  async prewarmQuestionnaire(studentId: string, careerId?: string, careerTitle?: string): Promise<{ status: string }> {
    return fetchWithFallback<{ status: string }>(
      `/students/${studentId}/questionnaire/prewarm`,
      {
        method: 'POST',
        body: JSON.stringify({
          target_career_id: careerId || null,
          target_career_title: careerTitle || null
        })
      },
      { status: 'prewarmed' }
    );
  },

  async startQuestionnaire(studentId: string): Promise<import('../types').QuestionnaireStateResponse> {
    return fetchWithFallback<import('../types').QuestionnaireStateResponse>(
      `/students/${studentId}/questionnaire/start`,
      { method: 'POST' }
    );
  },

  async startNewReflectionCycle(
    studentId: string,
    payload?: { project_update?: string; focus_area?: string }
  ): Promise<{
    cycle_number: number;
    previous_scores?: Record<string, number>;
    status: string;
    calibration?: import('../types').CycleCalibrationData;
  }> {
    return fetchWithFallback<{
      cycle_number: number;
      previous_scores?: Record<string, number>;
      status: string;
      calibration?: import('../types').CycleCalibrationData;
    }>(
      `/students/${studentId}/questionnaire/new-cycle`,
      {
        method: 'POST',
        body: JSON.stringify({
          project_update: payload?.project_update || null,
          focus_area: payload?.focus_area || null,
        })
      },
      {
        cycle_number: 2,
        status: 'ready_for_questions',
        calibration: {
          synthesis_rationale: `Analyzing recent milestone (${payload?.project_update || 'hands-on project execution'}) to calibrate targeted Cycle diagnostic probes.`,
          target_dimension: payload?.focus_area || 'Systems Thinking & Architecture',
          selected_probes: [
            `${payload?.focus_area || 'Systems Thinking'} Core Scenarios`,
            'Architectural Trade-Offs & Debugging',
            'Real-World Production Delivery'
          ],
          initial_question_bridge: `Welcome! Building directly on your latest achievement (${payload?.project_update || 'recent project work'}), let's explore your core technical strategy:`,
          target_competency_gain: '+6 Competency Growth'
        }
      }
    );
  },

  async getNextQuestion(studentId: string): Promise<import('../types').QuestionnaireStateResponse> {
    return fetchWithFallback<import('../types').QuestionnaireStateResponse>(
      `/students/${studentId}/questionnaire/next`,
      { method: 'GET' }
    );
  },

  async submitQuestionnaireAnswer(
    studentId: string,
    questionId: string,
    selectedOptionIds: string[],
    notes?: string
  ): Promise<import('../types').QuestionnaireAnswerResponse> {
    return fetchWithFallback<import('../types').QuestionnaireAnswerResponse>(
      `/students/${studentId}/questionnaire/answer`,
      {
        method: 'POST',
        body: JSON.stringify({
          question_id: questionId,
          selected_option_ids: selectedOptionIds,
          notes: notes || null,
        })
      }
    );
  },

  async getHeardSummary(studentId: string): Promise<import('../types').HeardSummaryResponse> {
    return fetchWithFallback<import('../types').HeardSummaryResponse>(
      `/students/${studentId}/questionnaire/heard-summary`,
      { method: 'GET' }
    );
  },

  async confirmHeardSummary(
    studentId: string,
    response: 'yes' | 'mostly' | 'not_really',
    corrections?: any[]
  ): Promise<{ success: boolean; student_response: string }> {
    return fetchWithFallback<{ success: boolean; student_response: string }>(
      `/students/${studentId}/questionnaire/heard-summary/confirm`,
      {
        method: 'POST',
        body: JSON.stringify({ response, corrections })
      }
    );
  },

  async getCalibratedProfile(studentId: string): Promise<CalibratedProfile> {
    return fetchWithFallback<CalibratedProfile>(
      `/students/${studentId}/questionnaire/profile`,
      { method: 'GET' }
    );
  },

  // Step 4: Reflection Portrait from the calibrated questionnaire profile.
  async fetchCalibratedPortrait(studentId: string): Promise<ReflectionPortrait> {
    return this.getPortrait(studentId);
  },

  // Reflection / Growth Portrait (demo fallback: mock portrait)
  async getPortrait(studentId?: string): Promise<ReflectionPortrait> {
    const id = studentId || 'demo-student-001';
    return fetchWithFallback<ReflectionPortrait>(
      `/students/${id}/portrait`,
      { method: 'GET' },
      MOCK_PORTRAIT
    );
  },

  // Submit feedback on portrait item (Agree / Disagree / Add context)
  async submitPortraitFeedback(
    studentId: string,
    itemArea: string,
    feedbackType: 'agree' | 'disagree' | 'add_context',
    context?: string
  ): Promise<ReflectionPortrait> {
    return fetchWithFallback<ReflectionPortrait>(
      `/students/${studentId}/portrait/feedback`,
      {
        method: 'POST',
        body: JSON.stringify({
          item: itemArea,
          feedback_type: feedbackType,
          context: context || null,
        })
      },
      MOCK_PORTRAIT
    );
  },

  // Step 5: set target role, then generate the LLM action plan from the gap analysis
  async setTargetRole(studentId: string, onetsocCode: string): Promise<{ target_role_id: string }> {
    return fetchWithFallback<{ target_role_id: string }>(
      `/students/${studentId}/target-role`,
      {
        method: 'PUT',
        body: JSON.stringify({ onetsoc_code: onetsocCode })
      }
    );
  },

  async generateActionPlan(studentId: string, onetsocCode: string): Promise<ActionPlan> {
    await this.setTargetRole(studentId, onetsocCode);
    const plan = await fetchWithFallback<BackendActionPlan>(
      `/students/${studentId}/action-plan`,
      { method: 'POST' }
    );
    return mapBackendActionPlan(plan);
  },

  // Career-coach chatbot (Wan Wan). Only answers career / study questions;
  // anything else gets a guardrail refusal from the backend.
  async sendChatMessage(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    studentId?: string | null
  ): Promise<{ reply: string }> {
    return fetchWithFallback<{ reply: string }>(
      '/chat',
      {
        method: 'POST',
        body: JSON.stringify({
          message,
          student_id: studentId || undefined,
          history
        })
      },
      // Fallback so the UI still responds if the backend is offline.
      { reply: "I can only answer career related questions." }
    );
  }
};
