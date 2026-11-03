import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { DynamicQuestion, HeardSummaryResponse } from '../types';
import { DIAGNOSTIC_QUESTIONS } from '../utils/mockData';
import { localizeQuestion } from '../i18n/questionBankKo';

export function useDiagnostic() {
  const {
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

  const loadedSessionRef = useRef<string | null>(null);
  const [mockIndex, setMockIndex] = useState<number>(0);

  // Helper to fetch the summary once complete
  const fetchSummary = useCallback(async (sid: string) => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      const summary = await apiService.getHeardSummary(sid);
      setHeardSummary(summary);
    } catch (err: any) {
      console.error('Failed to fetch summary:', err);
      setSummaryError(err?.message || 'Could not synthesize heard summary.');
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  // Load next / current question on mount or cycle switch
  const loadQuestion = useCallback(async (sid: string) => {
    setIsLoading(true);
    try {
      const res = await apiService.startQuestionnaire(sid);
      if (res.is_complete || !res.question) {
        setIsComplete(true);
        setCompletionReason(res.completion_reason);
        await fetchSummary(sid);
      } else {
        setIsComplete(false);
        setCompletionReason(null);
        setHeardSummary(null);
        setDynamicQuestion(res.question);
        setAnsweredCount(res.progress.answered_count);
        setDynamicAnswerCount(res.progress.answered_count);
        if (res.live_scores) {
          setLiveCompetencyScores(res.live_scores);
        }
      }
    } catch (err) {
      console.warn('Could not load dynamic questionnaire, using mock fallback', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSummary, setLiveCompetencyScores, setDynamicAnswerCount]);

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
    if (!dynamicQuestion) return;
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
    if (!dynamicQuestion || selectedOptionIds.length === 0) return;
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
        setTimeout(() => setMidpointPhase(2), 1000);
      }

      const res = await apiService.submitQuestionnaireAnswer(
        studentId,
        dynamicQuestion.id,
        selectedOptionIds,
        notes
      );

      if (res.live_scores) {
        setLiveCompetencyScores(res.live_scores);
      }
      setAnsweredCount(res.answered_count);
      setDynamicAnswerCount(res.answered_count);

      if (res.is_complete || !res.next_question) {
        setIsComplete(true);
        setCompletionReason(res.completion_reason);
        await fetchSummary(studentId);
      } else {
        if (res.is_midpoint || isSubmittingQ5) {
          setMidpointSummary(res.midpoint_summary || null);
          setMidpointPhase(3);
          // Allow student to read the personalized DeepSeek synthesis before Q6
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setIsMidpointRecalibrating(false);
        } else {
          // Natural micro-pause (200ms) for organic mentor transition
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        setDynamicQuestion(res.next_question);
        setSelectedOptionIds([]);
        setNotes('');
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setIsMidpointRecalibrating(false);
    } finally {
      setIsSubmitting(false);
      setIsReflecting(false);
    }
  };

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
