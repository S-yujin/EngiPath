export interface DreamJob {
  id: string;
  title: string;
  icon: string;
  description: string;
  category?: string;
  tagline?: string;
  keyCompetencies?: string[];
  targetScores: CompetencyScores;
}

export interface CompetencyScores {
  technicalFundamentals: number;
  programming: number;
  prototyping: number;
  systemsThinking: number;
  communication: number;
  learningAgility: number;
}

export type ConfidenceRanking = 'Low' | 'Medium' | 'High';

export interface UserProfile {
  id: string;
  name: string;
  year: number; // 1 to 4+
  major: string;
  intro?: string;
  skills?: string[];
  interests?: string[];
  dreamJobId: string;
  currentScores: CompetencyScores;
  confidenceRanking: ConfidenceRanking;
  matchPercentage: number;
  transcriptUploaded?: boolean;
  transcriptData?: {
    courses: Array<{ code: string; name: string; grade: string; credits: number; competency: keyof CompetencyScores }>;
    gpa?: number;
  };
}

export interface DiagnosticQuestion {
  id: string;
  question: string;
  competency: keyof CompetencyScores;
  weight: number;
  format: 'slider' | 'multiple-choice' | 'open-ended';
  options?: string[];
  placeholder?: string;
  hint?: string;
  suggestedSnippets?: string[];
}

export type UserFeedbackState = 'agreed' | 'disagreed' | 'context-added' | 'none';

export interface ReflectionItem {
  id?: string;
  signal?: string;
  label: string;
  evidence?: string;
  explanation?: string;
  competency: keyof CompetencyScores;
  classification?: 'supported_strength' | 'possible_hidden_strength' | 'worth_validating' | 'developing_picture' | 'still_taking_shape';
  student_self_view?: string;
  experience_strength?: number;
  state_confidence?: number;
  reason_code?: string;
  supporting_sources?: string[];
  userFeedback?: UserFeedbackState;
  userContextNote?: string;
}

export interface ReflectionPortrait {
  cycle_number?: number;
  previous_scores?: Record<string, number>;
  score_deltas?: Record<string, number>;
  evolution_summary?: string;
  supported_strengths: ReflectionItem[];
  possible_hidden_strengths: ReflectionItem[];
  areas_to_validate: ReflectionItem[];
  developing_picture: ReflectionItem[];
  still_taking_shape: ReflectionItem[];
  summary_narration?: string;
  // Backwards compatibility aliases
  strengths?: ReflectionItem[];
  overlookedStrengths?: ReflectionItem[];
  areasToValidate?: ReflectionItem[];
  developmentAreas?: ReflectionItem[];
  insufficientInfo?: ReflectionItem[];
}

export interface MinimumRequirement {
  label: string;
  detail?: string;
  completed?: boolean;
}

export interface ShortTermAction {
  id: string;
  title: string;
  description: string;
  timeCommitment: string;
  resourceLink: string;
  provider?: string;
  completed?: boolean;
  saved?: boolean;
  minimumRequirements?: MinimumRequirement[];
}

export interface LongTermMilestone {
  id: string;
  title: string;
  timeline: string;
  completed?: boolean;
  notes?: string;
  minimumRequirements?: MinimumRequirement[];
}

export interface AccomplishedAction {
  cycle_number: number;
  title: string;
  why?: string;
  what_to_do?: string;
  completed_at?: string;
}

export interface ActionPlan {
  cycle_number?: number;
  accomplished_actions?: AccomplishedAction[];
  shortTerm: ShortTermAction[];
  longTerm: LongTermMilestone[];
  visionDescription?: string;
  customGoals?: string[];
  savedAt?: string;
}

export interface Evidence {
  id: string;
  type: 'certificate' | 'github' | 'grades' | 'project' | 'paper';
  title: string;
  link: string;
  submittedAt: Date | string;
  status: 'pending' | 'approved' | 'in-review';
  competencyBoost?: keyof CompetencyScores;
  notes?: string;
}

export interface DashboardData {
  confidenceScore: number;
  confidenceRanking: ConfidenceRanking;
  completedMilestones: number;
  totalMilestones: number;
  growthScore: number;
  baselineMatch?: number;
  evidenceSubmissions: Evidence[];
  mentorTip?: string;
}

export interface StepInfo {
  step: number;
  path: string;
  title: string;
  shortTitle: string;
  timeEstimate: string;
}

export interface DynamicQuestionOption {
  id: string;
  text: string;
}

export interface DynamicQuestion {
  id: string;
  text: string;
  instruction?: string | null;
  layer: 'core' | 'contextual' | 'adaptive';
  dimension: string[];
  signals: string[];
  allow_multiple: boolean;
  max_selections: number;
  options: DynamicQuestionOption[];
  hint?: string;
  conversational_bridge?: string;
  mentor_insight?: string;
  contradiction_alert?: boolean;
}

export interface QuestionnaireProgress {
  answered_count: number;
  phase: string;
}

export interface QuestionnaireStateResponse {
  question: DynamicQuestion | null;
  is_complete: boolean;
  completion_reason: string | null;
  progress: QuestionnaireProgress;
  live_scores: CompetencyScores;
}

export interface QuestionnaireAnswerResponse {
  success: boolean;
  question_id: string;
  answered_count: number;
  live_scores: CompetencyScores;
  is_midpoint?: boolean;
  midpoint_summary?: string | null;
  is_complete: boolean;
  completion_reason: string | null;
  next_question: DynamicQuestion | null;
}

export interface HeardSummaryResponse {
  opening: string;
  summary_bullets: string[];
  closing_prompt: string;
  response_options: string[];
}

export interface CycleCalibrationData {
  synthesis_rationale: string;
  target_dimension: string;
  selected_probes: string[];
  initial_question_bridge: string;
  target_competency_gain: string;
}
