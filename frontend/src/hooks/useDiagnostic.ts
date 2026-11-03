import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { DynamicQuestion, HeardSummaryResponse } from '../types';
import { DIAGNOSTIC_QUESTIONS } from '../utils/mockData';
import { chooseQuestionOptions, questionOptionTarget } from '../utils/questionAutoAnswer';
import { localizeQuestion } from '../i18n/questionBankKo';

export function useDiagnostic() {
  const {
    profile, isAdminMode, currentStep, isQuestionAutoPilotRunning,
    cancelDemoAutoPilot, setQuestionAutoPilotTarget,
    studentId,
    currentScores,
    setLiveCompetencyScores,
    setDynamicAnswerCount,
    selectedJob,
    matchPercentage,
    confidenceRanking,
    confidenceScore,
    setCurrentStep,
    currentCycle,
    isCalibratingCycle,
    language,
  } = useApp();

  const [dynamicQuestion, setDynamicQuestion] = useState<DynamicQuestion | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [completionReason, setCompletionReason] = useState<string | null>(null);
  const [heardSummary, setHeardSummary] = useState<HeardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const sessionRef = useRef(0);
  const submittingRef = useRef(false);
  const pendingPauses = useRef(new Map<ReturnType<typeof setTimeout>, () => void>());
  const pause = (ms: number) => new Promise<void>(resolve => {
    const timer = setTimeout(() => { pendingPauses.current.delete(timer); resolve(); }, ms);
    pendingPauses.current.set(timer, resolve);
  });
  const [questionError, setQuestionError] = useState<string | null>(null);
  useEffect(() => {
    const generation = ++sessionRef.current;
    return () => {
      if (sessionRef.current === generation) ++sessionRef.current;
      loadedSessionRef.current = null;
      for (const [timer, resolve] of pendingPauses.current) { clearTimeout(timer); resolve(); }
      pendingPauses.current.clear();
    };
  }, [studentId, currentCycle, isCalibratingCycle]);
  const loadedSessionRef = useRef<string | null>(null);
  const [mockIndex, setMockIndex] = useState<number>(0);

  // Helper to fetch the summary once complete
  const fetchSummary = useCallback(async (sid: string) => {
    const generation = sessionRef.current;
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      const summary = await apiService.getHeardSummary(sid);
      if (generation !== sessionRef.current) return;
      setHeardSummary(summary);
    } catch (err: any) {
      if (generation !== sessionRef.current) return;
      console.error('Failed to fetch summary:', err);
      setSummaryError(err?.message || 'Could not synthesize heard summary.');
    } finally {
      if (generation === sessionRef.current) setIsLoadingSummary(false);
    }
  }, []);

  // Load next / current question on mount or cycle switch
  const loadQuestion = useCallback(async (sid: string) => {
    const generation = sessionRef.current;
    setIsLoading(true);
    setQuestionError(null);
    try {
      await apiService.startQuestionnaire(sid);
      if (generation !== sessionRef.current) return;
      const res = await apiService.getNextQuestion(sid);
      if (generation !== sessionRef.current) return;
      setAnsweredCount(res.progress.answered_count);
      setDynamicAnswerCount(res.progress.answered_count);
      if (res.live_scores) setLiveCompetencyScores(res.live_scores);
      if (res.is_complete || !res.question) {
        setIsComplete(true);
        setCompletionReason(res.completion_reason);
        await fetchSummary(sid);
      } else {
        setIsComplete(false);
        setCompletionReason(null);
        setHeardSummary(null);
        setDynamicQuestion(res.question);
      }
    } catch (err) {
      if (generation !== sessionRef.current) return;
      setQuestionError('Could not load questionnaire. Please reload to retry.');
      cancelDemoAutoPilot();
    } finally {
      if (generation === sessionRef.current) setIsLoading(false);
    }
  }, [fetchSummary, setLiveCompetencyScores, setDynamicAnswerCount, cancelDemoAutoPilot]);

  useEffect(() => {
    // If AI Cycle Calibration is actively in progress, clear all completed states and wait
    if (isCalibratingCycle) {
      setIsComplete(false);
      setCompletionReason(null);
      setHeardSummary(null);
      setSelectedOptionIds([]);
      setNotes('');
      setAnsweredCount(0);
      setMockIndex(0);
      loadedSessionRef.current = null;
      return;
    }

    const sessionKey = `${studentId || 'demo'}-cycle-${currentCycle}`;
    if (loadedSessionRef.current === sessionKey) {
      return;
    }
    loadedSessionRef.current = sessionKey;

    setDynamicQuestion(null);
    setIsSubmitting(false);
    setIsReflecting(false);
    setIsMidpointRecalibrating(false);
    // Reset questionnaire state for the active cycle
    setIsComplete(false);
    setCompletionReason(null);
    setHeardSummary(null);
    setSelectedOptionIds([]);
    setNotes('');
    setAnsweredCount(0);
    setMockIndex(0);

    if (!studentId) {
      setIsLoading(false);
      return;
    }

    loadQuestion(studentId);
  }, [studentId, currentCycle, isCalibratingCycle, loadQuestion]);

  const toggleOption = (optId: string) => {
    if (!dynamicQuestion || submittingRef.current || isQuestionAutoPilotRunning) return;
    if (dynamicQuestion.allow_multiple) {
      if (selectedOptionIds.includes(optId)) {
        setSelectedOptionIds(selectedOptionIds.filter((id) => id !== optId));
      } else {
        if (selectedOptionIds.length < dynamicQuestion.max_selections) {
          setSelectedOptionIds([...selectedOptionIds, optId]);
        }
      }
    } else {
      setSelectedOptionIds([optId]);
    }
  };

  const [isReflecting, setIsReflecting] = useState<boolean>(false);
  const [isMidpointRecalibrating, setIsMidpointRecalibrating] = useState<boolean>(false);
  const [midpointPhase, setMidpointPhase] = useState<1 | 2 | 3>(1);
  const [midpointSummary, setMidpointSummary] = useState<string | null>(null);

  const submitAnswer = async () => {
    if (!dynamicQuestion || selectedOptionIds.length === 0 || submittingRef.current || isLoading || isComplete) return;
    if (!studentId) {
      // Advance mock
      if (mockIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
        setMockIndex((prev) => prev + 1);
        setSelectedOptionIds([]);
        setNotes('');
      } else {
        setCurrentStep(4);
      }
      return;
    }

    submittingRef.current = true;
    const generation = sessionRef.current;
    setQuestionError(null);
    const isSubmittingQ5 = answeredCount === 4;
    if (isSubmittingQ5) {
      setIsMidpointRecalibrating(true);
      setMidpointPhase(1);
    }

    setIsSubmitting(true);
    setIsReflecting(true);
    try {
      // Transition to stage 2 (AI Mentor Synthesis) while API request is in flight
      if (isSubmittingQ5) {
        setMidpointPhase(2);
      }

      const res = await apiService.submitQuestionnaireAnswer(
        studentId,
        dynamicQuestion.id,
        selectedOptionIds,
        notes
      );

      if (generation !== sessionRef.current) return;
      if (!res.success) throw new Error("Answer was not accepted");
      if (res.live_scores) {
        setLiveCompetencyScores(res.live_scores);
      }
      setAnsweredCount(res.answered_count);
      setDynamicAnswerCount(res.answered_count);

      if (res.is_complete || !res.next_question) {
        cancelDemoAutoPilot();
        setIsMidpointRecalibrating(false);
        setIsComplete(true);
        setCompletionReason(res.completion_reason);
        await fetchSummary(studentId);
      } else {
        if (res.is_midpoint || isSubmittingQ5) {
          setMidpointSummary(res.midpoint_summary || null);
          setMidpointPhase(3);
          // Allow student to read the personalized DeepSeek synthesis before Q6
          await pause(2000);
          if (generation !== sessionRef.current) return;
          setIsMidpointRecalibrating(false);
        } else {
          // Natural micro-pause (200ms) for organic mentor transition
          await pause(200);
        }
        if (generation !== sessionRef.current) return;
        setDynamicQuestion(res.next_question);
        setSelectedOptionIds([]);
        setNotes('');
      }
    } catch (err) {
      if (generation !== sessionRef.current) return;
      cancelDemoAutoPilot();
      setQuestionError('Answer could not be submitted. Automatic answers stopped; please retry manually.');
      console.error('Error submitting answer:', err);
      setIsMidpointRecalibrating(false);
    } finally {
      submittingRef.current = false;
      if (generation === sessionRef.current) {
        setIsSubmitting(false);
        setIsReflecting(false);
      }
    }
  };

  const submitRef = useRef(submitAnswer);
  submitRef.current = submitAnswer;
  const attemptedRef = useRef(new Set<string>());
  useEffect(() => {
    if (!isQuestionAutoPilotRunning) { attemptedRef.current.clear(); return; }
    if (!studentId || !isAdminMode || currentStep !== 3 || isComplete || isCalibratingCycle || questionError) {
      cancelDemoAutoPilot(); return;
    }
    if (isLoading || isSubmitting || !dynamicQuestion) return;
    const key = studentId + ':' + currentCycle + ':' + dynamicQuestion.id;
    if (attemptedRef.current.has(key) || attemptedRef.current.size >= 100) {
      cancelDemoAutoPilot(); return;
    }
    const ids = chooseQuestionOptions(dynamicQuestion, profile);
    if (!ids.length) { cancelDemoAutoPilot(); return; }
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const select = (index: number) => {
      if (stopped) return;
      if (index < ids.length) {
        setQuestionAutoPilotTarget(questionOptionTarget(dynamicQuestion.id, ids[index]), 'Scanning profile evidence and selecting an answer');
        timer = setTimeout(() => {
          if (stopped) return;
          setSelectedOptionIds(ids.slice(0, index + 1));
          select(index + 1);
        }, 900);
      } else {
        setQuestionAutoPilotTarget('question-submit', 'Submitting this answer');
        timer = setTimeout(() => {
          if (stopped) return;
          attemptedRef.current.add(key);
          void submitRef.current();
        }, 900);
      }
    };
    select(0);
    return () => { stopped = true; clearTimeout(timer); };
  }, [isQuestionAutoPilotRunning, studentId, currentCycle, isAdminMode, currentStep,
    isComplete, isCalibratingCycle, isLoading, isSubmitting, dynamicQuestion, questionError,
    profile, cancelDemoAutoPilot, setQuestionAutoPilotTarget]);

  const confirmHeardCheckpoint = async (
    response: 'yes' | 'mostly' | 'not_really',
    refinementText?: string
  ) => {
    if (studentId) {
      try {
        const corrections = refinementText?.trim()
          ? [{ signal_affected: 'all', user_correction: refinementText.trim() }]
          : undefined;
        await apiService.confirmHeardSummary(studentId, response, corrections);
      } catch (err) {
        console.error('Error confirming summary:', err);
      }
    }
    setCurrentStep(4);
  };

  const retryFetchSummary = () => {
    if (studentId) {
      fetchSummary(studentId);
    }
  };

  const diagnosticProgress = Math.min(100, Math.round((answeredCount / 10) * 100));

  return {
    questionError,
    studentId,
    dynamicQuestion: localizeQuestion(dynamicQuestion, language),
    conversationalBridge: dynamicQuestion?.conversational_bridge,
    mentorInsight: dynamicQuestion?.mentor_insight,
    isContradiction: Boolean(dynamicQuestion?.contradiction_alert || dynamicQuestion?.layer === 'adaptive'),
    selectedOptionIds,
    setSelectedOptionIds,
    notes,
    setNotes,
    toggleOption,
    submitAnswer,
    answeredCount,
    diagnosticProgress,
    isComplete,
    completionReason,
    heardSummary,
    isLoadingSummary,
    summaryError,
    retryFetchSummary,
    confirmHeardCheckpoint,
    isLoading,
    isSubmitting,
    isReflecting,
    isMidpointRecalibrating,
    midpointPhase,
    midpointSummary,
    currentScores,
    selectedJob,
    matchPercentage,
    confidenceRanking,
    confidenceScore,
  };
}
