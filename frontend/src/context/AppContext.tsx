import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  UserProfile,
  DreamJob,
  ReflectionPortrait,
  ActionPlan,
  DashboardData,
  Evidence,
  CompetencyScores,
  ConfidenceRanking,
  UserFeedbackState,
  CycleCalibrationData
} from '../types';
import {
  DREAM_JOBS,
  DIAGNOSTIC_QUESTIONS,
  MOCK_PORTRAIT,
  MOCK_ACTION_PLAN,
  MOCK_DASHBOARD,
  DEMO_PROFILES,
  MAJOR_PRESETS
} from '../utils/mockData';
import {
  inferScoresFromProfile,
  calculateMatchPercentage,
  getConfidenceRanking,
  calculateDiagnosticUpdates
} from '../utils/scoring';
import { TRANSLATIONS, Language } from '../utils/translations';
import { setUiLanguage, contentLanguage } from '../i18n/localeStore';
import { apiService, CuratedCareer, OnboardingPayload } from '../services/api';
import { normalizeActionPlanCompletion, setItemCompleted, toggleRequirement } from '../utils/actionPlanCompletion';

export interface AppContextType {
  // Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;

  // Navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;

  // Step 1: Onboarding & Careers
  studentId: string | null;
  submitOnboarding: (payload?: any) => Promise<void>;
  onboardingStatus: 'idle' | 'loading' | 'done' | 'error';
  onboardingError: string | null;
  curatedCareers: DreamJob[];

  // "Start Comparison" — Step 1.5 (AI-generated baseline for the radar chart)
  baselineScores: CompetencyScores | null;
  startComparison: (payload?: any) => Promise<void>;
  compareStatus: 'idle' | 'loading' | 'done' | 'error';

  // Selected Career
  selectedJob: DreamJob | null;
  setSelectedJob: (job: DreamJob | null) => void;
  selectJobById: (id: string) => void;

  // User Profile
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  simulateTranscriptUpload: (sampleCourses?: any[]) => void;
  clearTranscript: () => void;

  // Diagnostic
  diagnosticAnswers: Record<string, { value: number | string; text?: string }>;
  setDiagnosticAnswer: (questionId: string, value: number | string, text?: string) => void;
  clearDiagnosticAnswers: () => void;
  diagnosticProgress: number;

  // Portrait (Step 4) & Multi-Cycle Evolution
  portrait: ReflectionPortrait;
  portraitStatus: 'mock' | 'generating' | 'live' | 'error';
  portraitError: string | null;
  generatePortrait: (force?: boolean) => Promise<void>;
  currentCycle: number;
  previousScores: CompetencyScores | null;
  scoreDeltas: Record<string, number> | null;
  evolutionSummary: string | null;
  isCalibratingCycle: boolean;
  cycleCalibration: CycleCalibrationData | null;
  startNewReflectionCycle: (projectUpdate?: string, focusArea?: string) => Promise<void>;
  setPortraitFeedback: (
    category: keyof ReflectionPortrait,
    itemIndex: number,
    feedback: UserFeedbackState,
    note?: string
  ) => void;

  // Action Plan (Step 5)
  actionPlan: ActionPlan;
  planStatus: 'mock' | 'generating' | 'live' | 'error';
  planError: string | null;
  generateActionPlan: (force?: boolean) => Promise<void>;
  toggleShortTermAction: (actionId: string) => void;
  toggleMinimumRequirement: (actionId: string, reqIndex: number) => void;
  toggleLongTermMilestone: (milestoneId: string) => void;
  toggleMilestoneRequirement: (milestoneId: string, reqIndex: number) => void;
  savePlan: () => void;
  isPlanSaved: boolean;
  setIsPlanSaved: (saved: boolean) => void;

  // Living Dashboard (Step 6)
  dashboardData: DashboardData;
  submitEvidence: (data: { type: Evidence['type']; title: string; link: string; notes?: string }) => void;

  // Calculated State
  currentScores: CompetencyScores;
  liveCompetencyScores: CompetencyScores | null;
  setLiveCompetencyScores: (scores: CompetencyScores | null) => void;
  dynamicAnswerCount: number;
  setDynamicAnswerCount: (count: number) => void;
  matchPercentage: number;
  confidenceRanking: ConfidenceRanking;
  confidenceScore: number;
  overallProgress: number;

  // Step Gatekeeping & Admin Testing Mode
  isAdminMode: boolean;
  toggleAdminMode: (prefill?: boolean) => void;
  skipToFuturePrefilled: (targetStep?: number) => void;
  isStepUnlocked: (step: number) => boolean;

  // Demo Controls & Live Auto-Pilot (Johnny - AI)
  loadDemoProfile: (demoId: string) => void;
  resetAll: () => void;
  isAutoPilotRunning: boolean;
  isQuestionAutoPilotRunning: boolean;
  startQuestionAutoPilot: () => void;
  setQuestionAutoPilotTarget: (id: string, speech: string) => void;
  autoPilotStep: string | null;
  autoPilotTargetId: string | null;
  autoPilotSpeech: string | null;
  runDemoAutoPilot: () => Promise<void>;
  cancelDemoAutoPilot: () => void;
}

const defaultInitialProfile: UserProfile = {
  id: 'student-demo',
  name: '',
  year: 1,
  major: '',
  intro: '',
  skills: [],
  interests: [],
  dreamJobId: 'robotics',
  currentScores: MAJOR_PRESETS['Mechanical Engineering'].defaultScores,
  confidenceRanking: 'Medium',
  matchPercentage: 58,
  transcriptUploaded: false,
  transcriptData: undefined
};

const STORAGE_KEY = 'ONETOOL_PERSISTED_STATE_V1'; // Retain existing user state through the Engipath rename.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

interface PersistedState {
  language?: Language;
  currentStep?: number;
  selectedJob?: DreamJob | null;
  studentId?: string | null;
  curatedCareers?: DreamJob[];
  onboardingStatus?: 'idle' | 'loading' | 'done' | 'error';
  baselineScores?: CompetencyScores | null;
  liveCompetencyScores?: CompetencyScores | null;
  dynamicAnswerCount?: number;
  compareStatus?: 'idle' | 'loading' | 'done' | 'error';
  profile?: UserProfile;
  diagnosticAnswers?: Record<string, { value: number | string; text?: string }>;
  portrait?: ReflectionPortrait;
  portraitStatus?: 'mock' | 'generating' | 'live' | 'error';
  portraitGeneratedFor?: string | null;
  currentCycle?: number;
  previousScores?: CompetencyScores | null;
  scoreDeltas?: Record<string, number> | null;
  evolutionSummary?: string | null;
  actionPlan?: ActionPlan;
  planStatus?: 'mock' | 'generating' | 'live' | 'error';
  planGeneratedFor?: string | null;
  dashboardData?: DashboardData;
  isAdminMode?: boolean;
  maxUnlockedStep?: number;
}

const loadPersistedState = (): PersistedState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load state from localStorage', err);
    return null;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialSaved = useMemo(() => loadPersistedState(), []);

  // v2 locale preference intentionally defaults to Korean even for users whose
  // old OneTool session had English implicitly stored in its assessment state.
  const [language, setLanguageState] = useState<Language>(() => {
    const preferred = localStorage.getItem('ENGIPATH_LOCALE_V2');
    return (preferred && ['ko', 'en', 'zh', 'es', 'fr', 'de'].includes(preferred)) ? preferred as Language : 'ko';
  });
  const setLanguage = (lang: Language) => {
    localStorage.setItem('ENGIPATH_LOCALE_V2', lang);
    setUiLanguage(lang);
    document.documentElement.lang = contentLanguage(lang);
    setLanguageState(lang);
  };
  // Localized static UI attributes update immediately with the selected language.
  setUiLanguage(language);
  const [currentStep, setCurrentStep] = useState<number>(() => initialSaved?.currentStep ?? 1);
  const [selectedJob, setSelectedJob] = useState<DreamJob | null>(() => initialSaved?.selectedJob || null);

  useEffect(() => {
    document.documentElement.lang = contentLanguage(language);
    document.title = language === 'ko' ? 'Engipath — AI 진로 탐색 및 성장 계획' : 'Engipath — Your Engineering Career Path';
  }, [language]);

  const t = useMemo(() => {
    return (key: string, defaultText: string = ''): string => {
      return TRANSLATIONS[contentLanguage(language)]?.[key] || TRANSLATIONS['en']?.[key] || defaultText || key;
    };
  }, [language]);

  // Step 1 → Step 2 flow state
  const [studentId, setStudentId] = useState<string | null>(() => initialSaved?.studentId || null);
  const [curatedCareers, setCuratedCareers] = useState<DreamJob[]>(() => initialSaved?.curatedCareers || []);
  const [onboardingStatus, setOnboardingStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(() => initialSaved?.onboardingStatus || 'idle');
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  // "Start Comparison" — AI-generated baseline for the radar chart (Step 1.5)
  const [baselineScores, setBaselineScores] = useState<CompetencyScores | null>(() => initialSaved?.baselineScores || null);
  const [liveCompetencyScores, setLiveCompetencyScores] = useState<CompetencyScores | null>(() => initialSaved?.liveCompetencyScores || null);
  const [dynamicAnswerCount, setDynamicAnswerCount] = useState<number>(() => initialSaved?.dynamicAnswerCount ?? 0);
  const [compareStatus, setCompareStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(() => initialSaved?.compareStatus || 'idle');

  const [profile, setProfile] = useState<UserProfile>(() => initialSaved?.profile || defaultInitialProfile);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, { value: number | string; text?: string }>>(() => initialSaved?.diagnosticAnswers || {});
  const [portrait, setPortrait] = useState<ReflectionPortrait>(() => initialSaved?.portrait || JSON.parse(JSON.stringify(MOCK_PORTRAIT)));
  const [portraitStatus, setPortraitStatus] = useState<'mock' | 'generating' | 'live' | 'error'>(() => initialSaved?.portraitStatus || 'mock');
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [portraitGeneratedFor, setPortraitGeneratedFor] = useState<string | null>(() => initialSaved?.portraitGeneratedFor || null);
  const [currentCycle, setCurrentCycle] = useState<number>(() => initialSaved?.currentCycle ?? 1);
  const [previousScores, setPreviousScores] = useState<CompetencyScores | null>(() => initialSaved?.previousScores || null);
  const [scoreDeltas, setScoreDeltas] = useState<Record<string, number> | null>(() => initialSaved?.scoreDeltas || null);
  const [evolutionSummary, setEvolutionSummary] = useState<string | null>(() => initialSaved?.evolutionSummary || null);
  const [isCalibratingCycle, setIsCalibratingCycle] = useState<boolean>(false);
  const [cycleCalibration, setCycleCalibration] = useState<CycleCalibrationData | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan>(() => normalizeActionPlanCompletion(initialSaved?.actionPlan || JSON.parse(JSON.stringify(MOCK_ACTION_PLAN))));
  const [isPlanSaved, setIsPlanSaved] = useState<boolean>(false);
  const [planStatus, setPlanStatus] = useState<'mock' | 'generating' | 'live' | 'error'>(() => initialSaved?.planStatus || 'mock');
  const [planError, setPlanError] = useState<string | null>(null);
  const [planGeneratedFor, setPlanGeneratedFor] = useState<string | null>(() => initialSaved?.planGeneratedFor || null);
  const [dashboardData, setDashboardData] = useState<DashboardData>(() => initialSaved?.dashboardData || JSON.parse(JSON.stringify(MOCK_DASHBOARD)));

  // Admin Testing Mode & Step Gatekeeping
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => initialSaved?.isAdminMode ?? false);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(() => initialSaved?.maxUnlockedStep ?? 1);

  // Demo Auto-Pilot State (Step 1 Johnny - AI)
  const cancelAutoPilotRef = useRef<boolean>(false);
  const [isQuestionAutoPilotRunning, setIsQuestionAutoPilotRunning] = useState(false);
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState<boolean>(false);
  const [autoPilotStep, setAutoPilotStep] = useState<string | null>(null);
  const [autoPilotTargetId, setAutoPilotTargetId] = useState<string | null>(null);
  const [autoPilotSpeech, setAutoPilotSpeech] = useState<string | null>(null);

  // Auto-Persist State to localStorage on change
  useEffect(() => {
    try {
      const stateToSave: PersistedState = {
        language,
        currentStep,
        selectedJob,
        studentId,
        curatedCareers,
        onboardingStatus,
        baselineScores,
        liveCompetencyScores,
        dynamicAnswerCount,
        compareStatus,
        profile,
        diagnosticAnswers,
        portrait,
        portraitStatus,
        portraitGeneratedFor,
        currentCycle,
        previousScores,
        scoreDeltas,
        evolutionSummary,
        actionPlan,
        planStatus,
        planGeneratedFor,
        dashboardData,
        isAdminMode,
        maxUnlockedStep
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save state to localStorage', e);
    }
  }, [
    language,
    currentStep,
    selectedJob,
    studentId,
    curatedCareers,
    onboardingStatus,
    baselineScores,
    liveCompetencyScores,
    dynamicAnswerCount,
    compareStatus,
    profile,
    diagnosticAnswers,
    portrait,
    portraitStatus,
    portraitGeneratedFor,
    currentCycle,
    previousScores,
    scoreDeltas,
    evolutionSummary,
    actionPlan,
    planStatus,
    planGeneratedFor,
    dashboardData,
    isAdminMode,
    maxUnlockedStep
  ]);

  useEffect(() => {
    if (currentStep > 0) {
      setMaxUnlockedStep((prev) => Math.max(prev, currentStep));
    }
  }, [currentStep]);

  const skipToFuturePrefilled = (targetStep: number = 6) => {
    setIsAdminMode(true);
    setMaxUnlockedStep(6);

    const demoJob = DREAM_JOBS.find((j) => j.id === 'robotics') || DREAM_JOBS[0];
    setSelectedJob(demoJob);

    setProfile({
      id: 'student-alex-rivera',
      name: 'Alex Rivera',
      year: 3,
      major: 'Mechanical Engineering',
      intro: 'Junior candidate specializing in autonomous robotics, embedded control, and modular system design.',
      skills: ['Python', 'C++', 'Git & CI/CD', 'ROS2', 'System Architecture', 'Algorithms', 'SolidWorks CAD', 'Rapid Prototyping'],
      interests: ['Autonomous Robotics', 'Mechatronics', 'Embedded Systems', 'Edge AI'],
      dreamJobId: 'robotics',
      currentScores: {
        technicalFundamentals: 84,
        programming: 82,
        prototyping: 78,
        systemsThinking: 80,
        communication: 74,
        learningAgility: 82
      },
      confidenceRanking: 'High',
      matchPercentage: 88,
      transcriptUploaded: true,
      transcriptData: {
        courses: [
          { code: 'ME 320', name: 'Dynamic Systems & Feedback Control', grade: 'A', credits: 4, competency: 'systemsThinking' },
          { code: 'CS 210', name: 'Data Structures & Algorithms', grade: 'A', credits: 4, competency: 'programming' },
          { code: 'ENGR 250', name: 'Design & Manufacturing / CAD Lab', grade: 'A-', credits: 3, competency: 'prototyping' },
          { code: 'ME 201', name: 'Thermodynamics & Solid Mechanics', grade: 'B+', credits: 3, competency: 'technicalFundamentals' },
          { code: 'CS 330', name: 'Embedded Microcontroller Firmware', grade: 'A', credits: 4, competency: 'programming' }
        ],
        gpa: 3.82
      }
    });

    setCuratedCareers(DREAM_JOBS);
    setOnboardingStatus('done');

    setDiagnosticAnswers({
      q1: { value: 4, text: 'Developed sensor data acquisition routines in Python with real-time plotting.' },
      q2: { value: 4, text: 'Systematically isolated motor jitter by testing PWM frequency and power rail ripple.' },
      q3: { value: 'Active Collaborator — coordinate cross-subsystems and code reviews', text: 'Led weekly chassis and electronics integration syncs.' },
      q4: { value: 'Proficient — regularly design, fabricate, and assemble custom parts', text: 'Designed custom 3D-printed brackets and laser-cut acrylic sensor mounts.' },
      q5: { value: 'I build a quick toy example on my own to break and understand it', text: 'Quickly learned ROS2 by creating a 2-wheel simulation model.' },
      q6: { value: 4, text: 'Analyzed tradeoffs between stepper vs BLDC motors for arm precision.' },
      q7: { value: 4, text: 'Created architecture block diagrams for multi-node CAN bus communication.' },
      q8: { value: 3, text: 'Drafted technical specifications and user manuals for the lab prototype.' }
    });

    setPortrait(JSON.parse(JSON.stringify(MOCK_PORTRAIT)));
    setPortraitStatus('live');
    setPortraitGeneratedFor('student-alex-rivera-robotics');

    setActionPlan(JSON.parse(JSON.stringify(MOCK_ACTION_PLAN)));
    setPlanStatus('live');
    setPlanGeneratedFor('student-alex-rivera-robotics');

    setDashboardData(JSON.parse(JSON.stringify(MOCK_DASHBOARD)));

    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAdminMode = (prefill: boolean = true) => {
    setIsAdminMode((prev) => {
      const next = !prev;
      if (next && prefill && currentStep !== 3) {
        if (curatedCareers.length === 0 || !profile.transcriptUploaded) {
          skipToFuturePrefilled(currentStep > 0 ? currentStep : 1);
        }
      }
      return next;
    });
  };

  const isStepUnlocked = React.useCallback(
    (step: number): boolean => {
      if (isAdminMode) return true;
      if (step <= 1) return true;
      if (step <= maxUnlockedStep) return true;

      const step1Done = onboardingStatus === 'done' || curatedCareers.length > 0;
      if (step === 2) return Boolean(step1Done);

      const step2Done = step1Done && maxUnlockedStep >= 3;
      if (step === 3) return Boolean(step2Done);

      const answeredCount = Object.keys(diagnosticAnswers).filter(
        (k) => diagnosticAnswers[k]?.value !== undefined && diagnosticAnswers[k]?.value !== ''
      ).length;
      const step3Done = step2Done && (answeredCount >= 5 || maxUnlockedStep >= 4);
      if (step === 4) return Boolean(step3Done);

      const hasPortraitData =
        (portrait.supported_strengths?.length ?? 0) > 0 ||
        (portrait.strengths?.length ?? 0) > 0;
      const step4Done = step3Done && (hasPortraitData || maxUnlockedStep >= 5);
      if (step === 5) return Boolean(step4Done);

      const step5Done = step4Done && (actionPlan.shortTerm?.length > 0 || maxUnlockedStep >= 6);
      if (step === 6) return Boolean(step5Done);

      return false;
    },
    [isAdminMode, maxUnlockedStep, profile.name, profile.major, curatedCareers.length, onboardingStatus, selectedJob, diagnosticAnswers, currentStep, portrait.supported_strengths?.length, portrait.strengths?.length, actionPlan.shortTerm?.length]
  );

  useEffect(() => {
    if (selectedJob && selectedJob.id !== profile.dreamJobId) {
      setProfile((prev) => ({
        ...prev,
        dreamJobId: selectedJob.id
      }));
    }
  }, [selectedJob?.id]);

  const initialCycle1Scores: CompetencyScores = useMemo(() => {
    return inferScoresFromProfile(
      profile.year || 2,
      profile.major || 'Mechanical Engineering',
      profile.transcriptData?.courses
    );
  }, [profile.year, profile.major, profile.transcriptData]);

  const currentScores: CompetencyScores = useMemo(() => {
    const base = initialCycle1Scores;
    const { updatedScores } = calculateDiagnosticUpdates(base, diagnosticAnswers, DIAGNOSTIC_QUESTIONS);

    if (currentCycle > 1) {
      const cycleBoost = currentCycle - 1;
      return {
        technicalFundamentals: Math.min(98, updatedScores.technicalFundamentals + cycleBoost * 4),
        programming: Math.min(98, updatedScores.programming + cycleBoost * 5),
        prototyping: Math.min(98, updatedScores.prototyping + cycleBoost * 6),
        systemsThinking: Math.min(98, updatedScores.systemsThinking + cycleBoost * 5),
        communication: Math.min(98, updatedScores.communication + cycleBoost * 3),
        learningAgility: Math.min(98, updatedScores.learningAgility + cycleBoost * 4)
      };
    }

    return updatedScores;
  }, [initialCycle1Scores, diagnosticAnswers, currentCycle]);

  const matchPercentage = useMemo(() => {
    if (!selectedJob) return 0;
    return calculateMatchPercentage(currentScores, selectedJob.targetScores);
  }, [currentScores, selectedJob]);

  const confidenceRanking = useMemo(() => {
    return getConfidenceRanking(matchPercentage);
  }, [matchPercentage]);

  const confidenceScore = useMemo(() => {
    const totalQ = DIAGNOSTIC_QUESTIONS.length;
    const answered = Object.keys(diagnosticAnswers).filter(
      (k) => diagnosticAnswers[k]?.value !== undefined && diagnosticAnswers[k]?.value !== ''
    ).length;
    return Math.min(99, Math.round((answered / totalQ) * 40 + (profile.transcriptUploaded ? 30 : 10) + 20));
  }, [diagnosticAnswers, profile.transcriptUploaded]);

  const diagnosticProgress = useMemo(() => {
    const totalQuestions = DIAGNOSTIC_QUESTIONS.length || 8;
    const answered = Object.keys(diagnosticAnswers).filter(
      (k) => diagnosticAnswers[k]?.value !== undefined && diagnosticAnswers[k]?.value !== ''
    ).length;
    return Math.min(100, Math.round((answered / totalQuestions) * 100));
  }, [diagnosticAnswers]);

  const overallProgress = useMemo(() => {
    if (currentStep === 0) return 0;

    let base = (currentStep - 1) * 16.66;
    let within = 0;

    if (currentStep === 1) {
      let fields = 0;
      if (profile.name) fields += 4;
      if (profile.major) fields += 4;
      if (profile.year) fields += 4;
      if (profile.transcriptUploaded) fields += 4.66;
      within = fields;
    } else if (currentStep === 2) {
      within = selectedJob ? 16.66 : 8;
    } else if (currentStep === 3) {
      within = (diagnosticProgress / 100) * 16.66;
    } else if (currentStep === 4) {
      within = 16.66;
    } else if (currentStep === 5) {
      const completedActions = actionPlan.shortTerm.filter((a) => a.completed).length;
      within = Math.min(16.6, completedActions * 4 + 8);
    } else if (currentStep === 6) {
      within = 16.66;
    }

    return Math.min(100, Math.round(base + within));
  }, [
    currentStep,
    profile.name,
    profile.major,
    profile.year,
    profile.transcriptUploaded,
    selectedJob,
    diagnosticProgress,
    actionPlan.shortTerm
  ]);

  const [maxProgressPercent, setMaxProgressPercent] = useState<number>(() =>
    initialSaved?.currentStep ? Math.min(100, initialSaved.currentStep * 16) : 0
  );
  useEffect(() => {
    if (overallProgress > maxProgressPercent) {
      setMaxProgressPercent(overallProgress);
    }
  }, [overallProgress, maxProgressPercent]);

  function mapCuratedCareerToDreamJob(c: CuratedCareer, idx: number): DreamJob {
    const defaultTargetScores: CompetencyScores = {
      technicalFundamentals: 85,
      programming: 80,
      prototyping: 80,
      systemsThinking: 85,
      communication: 75,
      learningAgility: 80
    };

    const titleLower = c.title.toLowerCase();
    if (titleLower.includes('software') || titleLower.includes('data') || titleLower.includes('ai') || titleLower.includes('computer')) {
      defaultTargetScores.programming = 92;
      defaultTargetScores.systemsThinking = 86;
    } else if (titleLower.includes('robot') || titleLower.includes('mechatron') || titleLower.includes('control')) {
      defaultTargetScores.prototyping = 88;
      defaultTargetScores.programming = 86;
      defaultTargetScores.systemsThinking = 90;
    } else if (titleLower.includes('mechanical') || titleLower.includes('automotive') || titleLower.includes('aerospace')) {
      defaultTargetScores.technicalFundamentals = 90;
      defaultTargetScores.prototyping = 85;
      defaultTargetScores.systemsThinking = 82;
    }

    const icons = ['🤖', '⚙️', '⚡', '🛰️', '🔬', '💻', '🔋', '🏎️'];
    const icon = icons[idx % icons.length];

    return {
      id: c.onetsoc_code || `career-${idx}`,
      title: c.title,
      icon,
      description: c.description,
      category: c.alignment ? `${c.alignment} Match Direction` : 'Engineering Direction',
      tagline: c.reasons && c.reasons.length > 0 ? c.reasons[0] : 'Personalized engineering career direction',
      keyCompetencies: c.reasons || ['Systems Thinking', 'Technical Fundamentals', 'Prototyping'],
      targetScores: defaultTargetScores
    };
  }

  const submitOnboarding = async (overridePayload?: any) => {
    setOnboardingStatus('loading');
    setOnboardingError(null);

    try {
      const payload = overridePayload || {
        major: profile.major,
        year: profile.year,
        intro: profile.intro,
        skills: profile.skills,
        interests: profile.interests,
        experiences: profile.transcriptData?.courses
          ? [
              {
                type: 'academic_project',
                title: 'Coursework',
                description: profile.transcriptData.courses.map((c) => `${c.name} (${c.grade})`).join(', '),
                tools_used: []
              }
            ]
          : []
      };

      const studentRes = await apiService.createStudent(payload);
      if (studentRes?.student_id) {
        setStudentId(studentRes.student_id);

        const cardsRes = await apiService.getCuratedCards(studentRes.student_id);
        if (cardsRes?.careers && cardsRes.careers.length > 0) {
          const mappedJobs = cardsRes.careers.map(mapCuratedCareerToDreamJob);
          setCuratedCareers(mappedJobs);
          if (mappedJobs.length > 0) {
            setSelectedJob(mappedJobs[0]);
          }
        } else {
          throw new Error('백엔드가 진로 추천 결과를 반환하지 않았습니다.');
        }
      } else {
        throw new Error('백엔드에서 학생 ID를 받지 못했습니다.');
      }
      setOnboardingStatus('done');
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Engipath onboarding failed:', err);
      if (DEMO_MODE) {
        setCuratedCareers(DREAM_JOBS);
        if (!selectedJob) setSelectedJob(DREAM_JOBS[0]);
        setOnboardingStatus('done');
        setCurrentStep(2);
      } else {
        setOnboardingError(err?.message || '서버 연결을 확인해 주세요.');
        setOnboardingStatus('error');
      }
    }
  };

  const startComparison = async (overridePayload?: any) => {
    setCompareStatus('loading');
    const majorName = profile.major || 'Mechanical Engineering';
    const preset = MAJOR_PRESETS[majorName] || MAJOR_PRESETS['Mechanical Engineering'];

    try {
      if (studentId) {
        const baseline = await apiService.getBaseline(studentId);
        if (baseline?.scores) {
          setBaselineScores(baseline.scores);
          setLiveCompetencyScores(baseline.scores);
        } else {
          setBaselineScores(preset.defaultScores);
          setLiveCompetencyScores(preset.defaultScores);
        }
      } else {
        setBaselineScores(preset.defaultScores);
        setLiveCompetencyScores(preset.defaultScores);
      }
    } catch (e) {
      console.error('Engipath baseline request failed:', e);
      if (!DEMO_MODE) {
        setCompareStatus('error');
        return;
      }
      setBaselineScores(preset.defaultScores);
      setLiveCompetencyScores(preset.defaultScores);
    }

    if (curatedCareers.length === 0 && DEMO_MODE) {
      setCuratedCareers(DREAM_JOBS);
      if (!selectedJob) setSelectedJob(DREAM_JOBS[0]);
    }
    setCompareStatus('done');
  };

  const generatePortrait = useCallback(async (force?: boolean) => {
    const targetKey = `${studentId || 'demo'}-cycle-${currentCycle}`;

    if (!force && portraitGeneratedFor === targetKey && portrait && (portrait.supported_strengths?.length || portrait.strengths?.length)) {
      if (portraitStatus !== 'live') setPortraitStatus('live');
      return;
    }

    setPortraitStatus('generating');
    setPortraitError(null);
    try {
      let effectiveStudentId = studentId;
      if (!effectiveStudentId) {
        try {
          const studentRes = await apiService.createStudent({
            major: profile.major || 'Artificial Intelligence',
            year: profile.year || 4,
            intro: profile.intro || '',
            skills: profile.skills && profile.skills.length > 0 ? profile.skills : ['Python', 'AI Agents', 'LLM']
          });
          if (studentRes && studentRes.student_id) {
            effectiveStudentId = studentRes.student_id;
            setStudentId(effectiveStudentId);
          }
        } catch (err) {
          console.warn('Auto-create student fallback for portrait:', err);
        }
      }

      const portraitRes = await apiService.getPortrait(effectiveStudentId || undefined);
      if (portraitRes && (portraitRes.supported_strengths?.length || portraitRes.strengths?.length)) {
        setPortrait(portraitRes);
        setPortraitStatus('live');
        setPortraitGeneratedFor(targetKey);
      } else {
        throw new Error('자기 탐색 결과가 비어 있습니다.');
      }
    } catch (e: any) {
      console.error('Engipath portrait request failed:', e);
      setPortraitError(e?.message || '자기 탐색 결과를 불러오지 못했습니다.');
      if (DEMO_MODE) {
        setPortrait(JSON.parse(JSON.stringify(MOCK_PORTRAIT)));
        setPortraitStatus('mock');
      } else {
        setPortraitStatus('error');
      }
    }
  }, [studentId, currentCycle, portraitGeneratedFor, portrait, portraitStatus, profile]);

  const startNewReflectionCycle = async (projectUpdate?: string, focusArea?: string) => {
    setPreviousScores({ ...currentScores });

    const updatedCycle = currentCycle + 1;
    setCurrentCycle(updatedCycle);

    const targetCareer = selectedJob?.title || 'Robotics Systems Engineer';
    const nextSummary = `Cycle ${updatedCycle} Reflection: Calibrated with recent milestone progress in ${
      focusArea || targetCareer
    }. Competencies in Prototyping & Systems Architecture demonstrated notable gains.`;

    setEvolutionSummary(nextSummary);

    const calculatedDeltas: Record<string, number> = {
      technicalFundamentals: 4,
      programming: 6,
      prototyping: 8,
      systemsThinking: 5,
      communication: 3,
      learningAgility: 4
    };
    setScoreDeltas(calculatedDeltas);

    // Reset diagnostic state for fresh questionnaire in new cycle
    setDiagnosticAnswers({});
    setDynamicAnswerCount(0);
    setPortraitGeneratedFor(null);
    setPlanGeneratedFor(null);

    // Enter AI Cycle Calibration Loading State and navigate to Step 3
    setIsCalibratingCycle(true);
    setMaxUnlockedStep((prev) => Math.max(prev, 3));
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const startTime = Date.now();
    try {
      if (studentId) {
        const res = await apiService.startNewReflectionCycle(studentId, {
          project_update: projectUpdate,
          focus_area: focusArea
        });
        if (res?.calibration) {
          setCycleCalibration(res.calibration);
        }
      } else {
        // Fallback local calibration
        setCycleCalibration({
          synthesis_rationale: `Analyzing recent milestone (${projectUpdate || 'hands-on project work'}) in relation to ${targetCareer}. Questions have been calibrated for ${focusArea || 'Systems Thinking'}.`,
          target_dimension: focusArea || 'Systems Thinking & Architecture',
          selected_probes: [
            `${focusArea || 'Systems Thinking'} Scenario Probes`,
            'Architectural Tradeoffs & Edge Cases',
            `${targetCareer} System Delivery`
          ],
          initial_question_bridge: `Welcome to Cycle ${updatedCycle}! Building directly on your latest achievement (${projectUpdate || 'recent milestone'}), let's explore your core technical strategy:`,
          target_competency_gain: '+6 Competency Growth'
        });
      }
    } catch (e) {
      console.warn('New cycle backend update note:', e);
    } finally {
      // Ensure the animated AI calibration loading page is visible for at least 2.8s for a cinematic experience
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2800 - elapsed);
      setTimeout(() => {
        setIsCalibratingCycle(false);
      }, remaining);
    }
  };

  const generateActionPlan = useCallback(async (force?: boolean) => {
    const jobCode = selectedJob?.id || '17-2199.08';
    const targetKey = `${studentId || 'demo'}-${jobCode}`;

    if (!force && (planGeneratedFor === targetKey || (studentId && planGeneratedFor === `demo-${jobCode}`)) && actionPlan && actionPlan.shortTerm && actionPlan.shortTerm.length > 0) {
      if (planGeneratedFor !== targetKey) setPlanGeneratedFor(targetKey);
      if (planStatus !== 'live') setPlanStatus('live');
      return;
    }

    setPlanStatus('generating');
    setPlanError(null);
    try {
      let effectiveStudentId = studentId;
      if (!effectiveStudentId) {
        try {
          const studentRes = await apiService.createStudent({
            major: profile.major || 'Mechanical Engineering',
            year: profile.year || 3,
            intro: profile.intro || '',
            skills: profile.skills && profile.skills.length > 0 ? profile.skills : ['Python', 'CAD', 'Problem Solving']
          });
          if (studentRes && studentRes.student_id) {
            effectiveStudentId = studentRes.student_id;
            setStudentId(effectiveStudentId);
          }
        } catch (err) {
          console.warn('Auto-create student fallback:', err);
        }
      }

      const planRes = await apiService.generateActionPlan(effectiveStudentId || 'demo-student-001', jobCode);
      if (planRes?.shortTerm && planRes.shortTerm.length > 0) {
        setActionPlan(normalizeActionPlanCompletion(planRes));
        setPlanStatus('live');
        setPlanGeneratedFor(`${effectiveStudentId || 'demo'}-${jobCode}`);
      } else {
        throw new Error('성장 계획에 실행 과제가 없습니다.');
      }
    } catch (e: any) {
      console.error('Engipath action plan request failed:', e);
      setPlanError(e?.message || '성장 계획 생성에 실패했습니다.');
      if (DEMO_MODE) {
        setActionPlan(JSON.parse(JSON.stringify(MOCK_ACTION_PLAN)));
        setPlanStatus('mock');
      } else {
        setPlanStatus('error');
      }
    }
  }, [studentId, profile, selectedJob, planGeneratedFor, actionPlan, planStatus]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      if (updates.major && MAJOR_PRESETS[updates.major]) {
        updated.currentScores = MAJOR_PRESETS[updates.major].defaultScores;
      }
      return updated;
    });
  };

  const simulateTranscriptUpload = (sampleCourses?: any[]) => {
    const majorName = profile.major || 'Mechanical Engineering';
    const preset = MAJOR_PRESETS[majorName] || MAJOR_PRESETS['Mechanical Engineering'];
    const coursesToUse = sampleCourses || preset.commonCourses;

    setProfile((prev) => ({
      ...prev,
      transcriptUploaded: true,
      transcriptData: {
        courses: coursesToUse,
        gpa: 3.82
      }
    }));
  };

  const clearTranscript = () => {
    setProfile((prev) => ({
      ...prev,
      transcriptUploaded: false,
      transcriptData: undefined
    }));
  };

  const selectJobById = (id: string) => {
    const all = curatedCareers.length > 0 ? curatedCareers : DREAM_JOBS;
    const job = all.find((j) => j.id === id);
    if (job) {
      setSelectedJob(job);
    }
  };

  const setDiagnosticAnswer = (questionId: string, value: number | string, text?: string) => {
    setDiagnosticAnswers((prev) => ({
      ...prev,
      [questionId]: { value, text }
    }));
  };

  const clearDiagnosticAnswers = () => {
    setDiagnosticAnswers({});
  };

  const setPortraitFeedback = (
    category: keyof ReflectionPortrait,
    itemIndex: number,
    feedback: UserFeedbackState,
    note?: string
  ) => {
    setPortrait((prev) => {
      const list = prev[category];
      if (!Array.isArray(list) || !list[itemIndex]) return prev;

      const updatedList = [...list];
      const target = { ...updatedList[itemIndex] };

      if (typeof target === 'object' && target !== null) {
        (target as any).user_feedback = feedback;
        if (note !== undefined) {
          (target as any).user_note = note;
        }
        updatedList[itemIndex] = target;
      }

      return {
        ...prev,
        [category]: updatedList
      };
    });
  };

  // Keep dashboard totals, parent completion and individual checkboxes in sync.
  const toggleShortTermAction = (actionId: string) => {
    setActionPlan((prev) => ({
      ...prev,
      shortTerm: prev.shortTerm.map((action) =>
        action.id === actionId ? setItemCompleted(action, !action.completed) : action
      )
    }));
  };

  const toggleMinimumRequirement = (actionId: string, reqIndex: number) => {
    setActionPlan((prev) => ({
      ...prev,
      shortTerm: prev.shortTerm.map((action) =>
        action.id === actionId ? toggleRequirement(action, reqIndex) : action
      )
    }));
  };

  const toggleLongTermMilestone = (milestoneId: string) => {
    setActionPlan((prev) => ({
      ...prev,
      longTerm: prev.longTerm.map((milestone) =>
        milestone.id === milestoneId ? setItemCompleted(milestone, !milestone.completed) : milestone
      )
    }));
  };

  const toggleMilestoneRequirement = (milestoneId: string, reqIndex: number) => {
    setActionPlan((prev) => ({
      ...prev,
      longTerm: prev.longTerm.map((milestone) =>
        milestone.id === milestoneId ? toggleRequirement(milestone, reqIndex) : milestone
      )
    }));
  };

  const savePlan = () => {
    setIsPlanSaved(true);
    setActionPlan((prev) => ({
      ...prev,
      savedAt: new Date().toISOString().split('T')[0]
    }));
    setTimeout(() => {
      setIsPlanSaved(false);
    }, 2800);
  };

  const submitEvidence = (data: { type: Evidence['type']; title: string; link: string; notes?: string }) => {
    const newEvidence: Evidence = {
      id: `ev-${Date.now()}`,
      type: data.type,
      title: data.title,
      link: data.link,
      submittedAt: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: data.notes
    };

    setDashboardData((prev) => ({
      ...prev,
      evidenceSubmissions: [newEvidence, ...prev.evidenceSubmissions],
      confidenceScore: Math.min(99, prev.confidenceScore + 4),
      growthScore: prev.growthScore + 3
    }));
  };

  const loadDemoProfile = (demoId: string) => {
    const demo = DEMO_PROFILES.find((p) => p.id === demoId);
    if (!demo) return;

    const job = DREAM_JOBS.find((j) => j.id === demo.dreamJobId) || DREAM_JOBS[0];
    setSelectedJob(job);
    setProfile({
      id: demo.id,
      name: demo.name,
      year: demo.year,
      major: demo.major,
      dreamJobId: demo.dreamJobId,
      currentScores: demo.scores,
      confidenceRanking: 'Medium',
      matchPercentage: 65,
      transcriptUploaded: true,
      transcriptData: {
        courses: MAJOR_PRESETS[demo.major]?.commonCourses || MAJOR_PRESETS['Mechanical Engineering'].commonCourses,
        gpa: 3.8
      }
    });

    setDiagnosticAnswers({
      q1: { value: 3, text: 'Used Python for data plotting in lab coursework.' },
      q2: { value: 4, text: '' },
      q3: { value: '', text: 'Designed and 3D printed mechanical assembly with snap-fit parts in CAD lab.' },
      q4: { value: '', text: 'Modeled heat transfer and insulation for a thermoelectric cooler prototype.' },
      q5: { value: 'Active Collaborator — coordinate cross-subsystems and code reviews' },
      q7: { value: 'I build a quick toy example on my own to break and understand it' },
      q8: { value: 'Proficient — regularly design, fabricate, and assemble custom parts' },
      q10: { value: 4, text: '' }
    });
  };

  const resetAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    // Reset flow navigation
    setCurrentStep(0);
    setMaxProgressPercent(0);
    setMaxUnlockedStep(1);
    setIsAdminMode(false);

    // Reset student profile data cleanly (clear Johnny/Alex data)
    setStudentId(null);
    setProfile(JSON.parse(JSON.stringify(defaultInitialProfile)));
    setOnboardingStatus('idle');
    setOnboardingError(null);

    // Reset curated careers and baseline
    setCuratedCareers([]);
    setSelectedJob(DREAM_JOBS[0]);
    setBaselineScores(null);
    setCompareStatus('idle');
    setLiveCompetencyScores(null);
    setDynamicAnswerCount(0);

    // Reset diagnostic questionnaire
    setDiagnosticAnswers({});

    // Reset reflection cycle state
    setCurrentCycle(1);
    setPreviousScores(null);
    setScoreDeltas(null);
    setEvolutionSummary(null);
    setIsCalibratingCycle(false);
    setCycleCalibration(null);

    // Reset portrait
    setPortrait(JSON.parse(JSON.stringify(MOCK_PORTRAIT)));
    setPortraitStatus('mock');
    setPortraitError(null);
    setPortraitGeneratedFor(null);

    // Reset action plan & dashboard
    setActionPlan(JSON.parse(JSON.stringify(MOCK_ACTION_PLAN)));
    setIsPlanSaved(false);
    setPlanStatus('mock');
    setPlanError(null);
    setPlanGeneratedFor(null);
    setDashboardData(JSON.parse(JSON.stringify(MOCK_DASHBOARD)));

    // Cancel any running auto-pilot demo
    cancelDemoAutoPilot();
  };

  const JOHNNY_DEMO_COURSES = useMemo(
    () => [
      { code: 'CS 480', name: 'Deep Learning & Neural Networks', grade: 'A', credits: 4, competency: 'technicalFundamentals' as const },
      { code: 'CS 485', name: 'Autonomous AI Agents & LLM Systems', grade: 'A', credits: 4, competency: 'systemsThinking' as const },
      { code: 'CS 310', name: 'Advanced Algorithms & Data Structures', grade: 'A', credits: 4, competency: 'programming' as const },
      { code: 'AI 420', name: 'Applied Natural Language Processing', grade: 'A', credits: 3, competency: 'technicalFundamentals' as const },
      { code: 'ENGR 490', name: 'Agentic Workflows Capstone Lab', grade: 'A', credits: 4, competency: 'prototyping' as const }
    ],
    []
  );

  const cancelDemoAutoPilot = useCallback(() => {
    setIsQuestionAutoPilotRunning(false);
    cancelAutoPilotRef.current = true;
    setIsAutoPilotRunning(false);
    setAutoPilotStep(null);
    setAutoPilotTargetId(null);
    setAutoPilotSpeech(null);
  }, []);

  const startQuestionAutoPilot = () => {
    if (currentStep === 3 && isAdminMode && studentId && !isAutoPilotRunning) {
      setIsQuestionAutoPilotRunning(true);
    }
  };
  const setQuestionAutoPilotTarget = useCallback((id: string, speech: string) => {
    setAutoPilotStep('question');
    setAutoPilotTargetId(id);
    setAutoPilotSpeech(speech);
  }, []);
  useEffect(() => {
    if (isQuestionAutoPilotRunning) cancelDemoAutoPilot();
  }, [currentStep, studentId, currentCycle, isAdminMode, cancelDemoAutoPilot]);

  const runDemoAutoPilot = useCallback(async () => {
    setIsQuestionAutoPilotRunning(false);
    cancelAutoPilotRef.current = false;
    setIsAutoPilotRunning(true);

    const fullIntro = 'I am interested in using AI agent workflows and LLM to solve real world problems.';
    const demoSkills = ['Python', 'Java', 'AI Agents', 'Agentic Workflows', 'LLM'];
    const demoInterests = ['Software Engineer', 'AI Engineer', 'Web Developer'];

    const johnnyPayload: OnboardingPayload = {
      major: 'Artificial Intelligence',
      year: 4,
      intro: fullIntro,
      skills: demoSkills,
      interests: demoInterests,
      experiences: [
        {
          type: 'academic_project',
          title: 'Coursework',
          description: JOHNNY_DEMO_COURSES.map((c) => `${c.name} (${c.grade})`).join(', '),
          tools_used: ['Python', 'LLM', 'PyTorch']
        }
      ]
    };

    // 🚀 Pre-fetch career cards in the background silently (WITHOUT setting onboardingStatus='loading')
    const backgroundPrefetchPromise = (async () => {
      try {
        const studentRes = await apiService.createStudent(johnnyPayload);
        if (studentRes?.student_id) {
          const cardsRes = await apiService.getCuratedCards(studentRes.student_id);
          const mappedJobs =
            cardsRes?.careers && cardsRes.careers.length > 0
              ? cardsRes.careers.map(mapCuratedCareerToDreamJob)
              : DREAM_JOBS;
          return { studentId: studentRes.student_id, careers: mappedJobs };
        }
      } catch (err) {
        console.warn('Auto-Pilot background curation pre-fetch note:', err);
      }
      return { studentId: 'student-demo', careers: DREAM_JOBS };
    })();

    // 1. Ensure on Step 1 (Onboarding)
    setCurrentStep(1);
    // Reset fields for a clean demo slate
    setProfile((prev) => ({
      ...prev,
      name: '',
      major: '',
      year: 1,
      intro: '',
      skills: [],
      interests: [],
      transcriptUploaded: false,
      transcriptData: undefined
    }));
    await new Promise((r) => setTimeout(r, 600));
    if (cancelAutoPilotRef.current) return;

    // --- STEP 1: YOUR NAME ---
    setAutoPilotStep('name');
    setAutoPilotTargetId('demo-field-name');
    setAutoPilotSpeech('Calibrating student identity: Johnny ✨');
    await new Promise((r) => setTimeout(r, 1000));
    if (cancelAutoPilotRef.current) return;

    const fullName = 'Johnny';
    for (let i = 1; i <= fullName.length; i++) {
      if (cancelAutoPilotRef.current) return;
      setProfile((prev) => ({ ...prev, name: fullName.slice(0, i) }));
      await new Promise((r) => setTimeout(r, 85));
    }
    await new Promise((r) => setTimeout(r, 550));

    // --- STEP 2: DEGREE / MAJOR ---
    setAutoPilotStep('major');
    setAutoPilotTargetId('demo-field-major');
    setAutoPilotSpeech('Selecting engineering specialization: Artificial Intelligence 🤖');
    await new Promise((r) => setTimeout(r, 1000));
    if (cancelAutoPilotRef.current) return;

    const fullMajor = 'Artificial Intelligence';
    for (let i = 1; i <= fullMajor.length; i++) {
      if (cancelAutoPilotRef.current) return;
      setProfile((prev) => ({ ...prev, major: fullMajor.slice(0, i) }));
      await new Promise((r) => setTimeout(r, 55));
    }
    await new Promise((r) => setTimeout(r, 550));

    // --- STEP 3: YEAR OF STUDY (Yr 4) ---
    setAutoPilotStep('year');
    setAutoPilotTargetId('demo-field-year-4');
    setAutoPilotSpeech('Setting senior standing: Year 4 🎓');
    await new Promise((r) => setTimeout(r, 950));
    if (cancelAutoPilotRef.current) return;

    setProfile((prev) => ({ ...prev, year: 4 }));
    await new Promise((r) => setTimeout(r, 600));

    // --- STEP 4: ABOUT YOU ---
    setAutoPilotStep('about');
    setAutoPilotTargetId('demo-field-about');
    setAutoPilotSpeech('Synthesizing technical focus & research interests... 💡');
    await new Promise((r) => setTimeout(r, 1000));
    if (cancelAutoPilotRef.current) return;

    for (let i = 1; i <= fullIntro.length; i += 2) {
      if (cancelAutoPilotRef.current) return;
      setProfile((prev) => ({ ...prev, intro: fullIntro.slice(0, Math.min(i, fullIntro.length)) }));
      await new Promise((r) => setTimeout(r, 38));
    }
    setProfile((prev) => ({ ...prev, intro: fullIntro }));
    await new Promise((r) => setTimeout(r, 600));

    // --- STEP 5: TECHNICAL SKILLS & TOOLS ---
    setAutoPilotStep('skills');
    setAutoPilotTargetId('demo-field-skills');
    setAutoPilotSpeech('Injecting core skills: Python, Java, AI Agents, LLM ⚡');
    await new Promise((r) => setTimeout(r, 1000));
    if (cancelAutoPilotRef.current) return;

    for (let i = 1; i <= demoSkills.length; i++) {
      if (cancelAutoPilotRef.current) return;
      setProfile((prev) => ({ ...prev, skills: demoSkills.slice(0, i) }));
      await new Promise((r) => setTimeout(r, 340));
    }
    await new Promise((r) => setTimeout(r, 550));

    // --- STEP 6: CAREER & TECHNICAL INTERESTS ---
    setAutoPilotStep('interests');
    setAutoPilotTargetId('demo-field-interests');
    setAutoPilotSpeech('Mapping target engineering trajectories... 🎯');
    await new Promise((r) => setTimeout(r, 1000));
    if (cancelAutoPilotRef.current) return;

    for (let i = 1; i <= demoInterests.length; i++) {
      if (cancelAutoPilotRef.current) return;
      setProfile((prev) => ({ ...prev, interests: demoInterests.slice(0, i) }));
      await new Promise((r) => setTimeout(r, 380));
    }
    await new Promise((r) => setTimeout(r, 550));

    // --- STEP 7: TRANSCRIPT OCR ---
    setAutoPilotStep('transcript');
    setAutoPilotTargetId('demo-field-transcript');
    setAutoPilotSpeech('Scanning coursework & transcript OCR verification... 📚');
    await new Promise((r) => setTimeout(r, 1050));
    if (cancelAutoPilotRef.current) return;

    setProfile((prev) => ({
      ...prev,
      transcriptUploaded: true,
      transcriptData: {
        courses: JOHNNY_DEMO_COURSES,
        gpa: 3.85
      }
    }));
    await new Promise((r) => setTimeout(r, 1000));

    // --- STEP 8: SUBMISSION ---
    setAutoPilotStep('submit');
    setAutoPilotTargetId('demo-field-submit');
    setAutoPilotSpeech('Calibration complete! Curating Johnny’s dream careers! 🚀');
    await new Promise((r) => setTimeout(r, 1300));
    if (cancelAutoPilotRef.current) return;

    // Trigger visual loading indicator ONLY upon Engipath touching the submit button!
    setOnboardingStatus('loading');

    setIsAutoPilotRunning(false);
    setAutoPilotStep(null);
    setAutoPilotTargetId(null);
    setAutoPilotSpeech(null);

    // Resolve pre-fetched career curation (already finished or nearly finished in background)
    const result = await backgroundPrefetchPromise;
    if (cancelAutoPilotRef.current) return;

    if (result.studentId) setStudentId(result.studentId);
    if (result.careers.length > 0) {
      setCuratedCareers(result.careers);
      setSelectedJob(result.careers[0]);
    }

    setOnboardingStatus('done');
    await new Promise((r) => setTimeout(r, 350));
    if (cancelAutoPilotRef.current) return;

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setCurrentStep, JOHNNY_DEMO_COURSES]);

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(6, prev + 1));
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentStep,
        setCurrentStep,
        goToNextStep,
        goToPrevStep,
        studentId,
        portraitStatus,
        portraitError,
        generatePortrait,
        submitOnboarding,
        onboardingStatus,
        onboardingError,
        curatedCareers,
        baselineScores,
        startComparison,
        compareStatus,
        selectedJob,
        setSelectedJob,
        selectJobById,
        profile,
        updateProfile,
        simulateTranscriptUpload,
        clearTranscript,
        diagnosticAnswers,
        setDiagnosticAnswer,
        clearDiagnosticAnswers,
        diagnosticProgress,
        portrait,
        setPortraitFeedback,
        currentCycle,
        previousScores: previousScores || (currentCycle > 1 ? initialCycle1Scores : null),
        scoreDeltas,
        evolutionSummary,
        isCalibratingCycle,
        cycleCalibration,
        startNewReflectionCycle,
        actionPlan,
        planStatus,
        planError,
        generateActionPlan,
        toggleShortTermAction,
        toggleMinimumRequirement,
        toggleLongTermMilestone,
        toggleMilestoneRequirement,
        savePlan,
        isPlanSaved,
        setIsPlanSaved,
        dashboardData,
        submitEvidence,
        currentScores,
        liveCompetencyScores,
        setLiveCompetencyScores,
        dynamicAnswerCount,
        setDynamicAnswerCount,
        matchPercentage,
        confidenceRanking,
        confidenceScore,
        overallProgress: maxProgressPercent,
        isAdminMode,
        toggleAdminMode,
        skipToFuturePrefilled,
        isStepUnlocked,
        loadDemoProfile,
        resetAll,
        isQuestionAutoPilotRunning,
        startQuestionAutoPilot,
        setQuestionAutoPilotTarget,
        isAutoPilotRunning: isAutoPilotRunning || isQuestionAutoPilotRunning,
        autoPilotStep,
        autoPilotTargetId,
        autoPilotSpeech,
        runDemoAutoPilot,
        cancelDemoAutoPilot
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
