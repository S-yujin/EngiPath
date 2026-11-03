import { LocalizedText, uiAttr, translateUi } from '../../i18n/uiText';
import { localizeDiagnosticBridge, localizeDiagnosticDimension } from '../../i18n/diagnosticLocalization';
import { localizeCareerTitle } from '../../i18n/careerLocalization';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useDiagnostic } from '../../hooks/useDiagnostic';
import { RadarChart } from '../common/RadarChart';
import { ConfidenceScore } from '../common/ConfidenceScore';
import { ProgressBar } from '../common/ProgressBar';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  ThumbsUp,
  Sliders,
  RotateCcw,
  Edit3,
  Bot,
  Layers,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Screen3_Diagnostic: React.FC = () => {
  const {
    dynamicQuestion,
    conversationalBridge,
    mentorInsight,
    isContradiction,
    selectedOptionIds,
    toggleOption,
    notes,
    setNotes,
    submitAnswer,
    answeredCount,
    diagnosticProgress,
    isComplete,
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
  } = useDiagnostic();

  const {
    setCurrentStep,
    currentCycle,
    isCalibratingCycle,
    cycleCalibration,
    profile,
    language
  } = useApp();

  // State for inline refinement when user clicks "Not really / Refine"
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refinementText, setRefinementText] = useState<string>('');

  const sampleSnippets = [
    'Led the sub-circuit testing phase',
    'Wrote custom Python parser scripts',
    'Debugged race condition in multithreaded loop',
    'Presented technical design to peers',
    'Iterated on CAD 3D print tolerances',
  ];

  const handleSnippetClick = (snippet: string) => {
    setNotes((prev) => (prev ? `${prev} • ${translateUi(snippet, language)}` : translateUi(snippet, language)));
  };

  // 🌟 DEDICATED AI CYCLE CALIBRATION LOADING SCREEN
  if (isCalibratingCycle) {
    return (
      <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -15 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-brand-navy p-8 sm:p-12 border border-teal-500/30 text-white shadow-2xl overflow-hidden text-center space-y-8"
        >
          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none bg-teal-500/15" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none bg-cyan-500/15" />

          {/* Central AI Radar / Mascot Scanner */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            {/* Animated Radar Pulse Rings */}
            <div className="absolute inset-0 rounded-full border-2 border-teal-400/30 animate-ping opacity-40" />
            <div className="absolute -inset-4 rounded-full border border-teal-400/20 animate-pulse" />
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-teal-400 via-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-2xl shadow-teal-950/60 z-10 animate-bounce">
              <Bot className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
          </div>

          {/* Header & Subtitle */}
          <div className="space-y-2 relative z-10 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/10 border border-teal-400/30 text-xs font-extrabold uppercase tracking-wider text-teal-300">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin-slow" />
              <span><LocalizedText en={"Engipath AI Mentor • Cycle"} />{' '}{currentCycle} <LocalizedText en={"Calibration"} /></span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              <LocalizedText en={"Personalizing Your Growth Diagnostic"} />{' '}</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <LocalizedText en={"Synthesizing your recent project milestone with your target career ("} />{' '}<span className="text-teal-300 font-bold">{localizeCareerTitle(selectedJob?.id || '', selectedJob?.title || 'Engineering Specialist', language)}</span><LocalizedText en={") to curate dynamic diagnostic probes."} />{' '}</p>
          </div>

          {/* Student Milestone Ingestion Quote Box */}
          <div className="relative z-10 max-w-2xl mx-auto rounded-2xl bg-slate-900/80 border border-white/10 p-4 sm:p-5 text-left space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-teal-400">
                <Layers className="w-3.5 h-3.5" />
                <LocalizedText en={"Ingested Milestone Evidence"} />{' '}</span>
              <span className="text-slate-400"><LocalizedText en={"Focus:"} />{' '}{localizeDiagnosticDimension(cycleCalibration?.target_dimension || 'Systems Architecture', language)}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-medium italic border-l-2 border-teal-400 pl-3 py-0.5">
              "{translateUi(cycleCalibration?.synthesis_rationale || 'Synthesizing recent milestone progress with target engineering competencies to customize diagnostic probes.', language)}"
            </p>
          </div>

          {/* 3-Stage Animated Calibration Pipeline */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-teal-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                <div className="w-4 h-4 rounded-full bg-teal-400/20 flex items-center justify-center text-teal-300">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span><LocalizedText en={"1. Signal Ingestion"} /></span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                <LocalizedText en={"Extracted project execution context into telemetry matrix."} />{' '}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-teal-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                <div className="w-4 h-4 rounded-full bg-teal-400/20 flex items-center justify-center text-teal-300">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span><LocalizedText en={"2. Role Alignment"} /></span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                <LocalizedText en={"Benchmarked against"} />{' '}{localizeCareerTitle(selectedJob?.id || '', selectedJob?.title || 'Target Role', language)} <LocalizedText en={"competency targets."} />{' '}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 bg-cyan-950/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <div className="w-4 h-4 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-300 animate-spin">
                  <Zap className="w-3 h-3 text-cyan-400" />
                </div>
                <span><LocalizedText en={"3. Probe Curation"} /></span>
              </div>
              <p className="text-[11px] text-cyan-200/90 leading-snug">
                <LocalizedText en={"10 unasked challenge probes calibrated for Cycle"} />{' '}{currentCycle}.
              </p>
            </div>
          </div>

          {/* Curated Probes Badges */}
          {cycleCalibration?.selected_probes && cycleCalibration.selected_probes.length > 0 && (
            <div className="relative z-10 max-w-xl mx-auto space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <LocalizedText en={"Activated Cycle"} />{' '}{currentCycle} <LocalizedText en={"Challenge Probes"} />{' '}</span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {cycleCalibration.selected_probes.map((probe, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-teal-400/10 border border-teal-400/30 text-xs font-bold text-teal-300 shadow-sm"
                  >
                    ✦ {probe}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="relative z-10 max-w-md mx-auto space-y-2 pt-2">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: '15%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.7, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 rounded-full"
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold">
              <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
              <span><LocalizedText en={"Launching Cycle"} />{' '}{currentCycle} <LocalizedText en={"Question 1..."} /></span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Progress Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-navy to-brand-teal flex items-center justify-center text-white font-bold shadow-sm">
            Q{answeredCount + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-brand-navy">
                <LocalizedText en={"Engineering Reflection Engine"} />{' '}</h2>
              {currentCycle > 1 && (
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-300 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3 text-teal-600" />
                  <LocalizedText en={"Cycle"} />{' '}{currentCycle} <LocalizedText en={"Diagnostic"} />{' '}</span>
              )}
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-600" />
                <LocalizedText en={"Adaptive Signal Intelligence"} />{' '}</span>
            </div>
            <p className="text-xs text-slate-500">
              {dynamicQuestion?.layer === 'adaptive'
                ? translateUi('Adaptive Follow-Up — Calibrating self-perception with demonstrated experience', language)
                : dynamicQuestion?.layer === 'contextual'
                ? translateUi('Contextual Reflection — Exploring domain depth and work methods', language)
                : translateUi('Core Diagnostic — Mapping foundational problem-solving and strengths', language)}
            </p>
          </div>
        </div>

        {/* Diagnostic Completion Bar */}
        <div className="w-full md:w-72">
          <ProgressBar
            progress={diagnosticProgress}
            label={language === 'ko' ? `응답 완료: ${answeredCount} / 10` : `Questions Answered: ${answeredCount} / 10`}
            color="from-brand-teal to-brand-gold"
          />
        </div>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Question Card OR "Here's What I Heard" Checkpoint (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {isMidpointRecalibrating ? (
              /* 🌟 Mid-Diagnostic Intelligence Synthesis Card (50% Milestone) */
              <motion.div
                key="midpoint-recalibrating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gradient-to-br from-slate-900 via-brand-navy to-slate-900 rounded-2xl p-7 sm:p-9 border border-amber-400/40 text-white shadow-xl text-center space-y-5 relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-brand-teal flex items-center justify-center text-slate-950 mx-auto shadow-lg animate-bounce">
                  <Sparkles className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-extrabold uppercase tracking-wider">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>
                      {midpointPhase === 1
                        ? translateUi('Stage 1/3: Analyzing Q1–Q5 Problem-Solving Style', language)
                        : midpointPhase === 2
                        ? translateUi('Stage 2/3: Career Competency Calibration', language)
                        : translateUi('Stage 3/3: Dynamic Q6–Q10 Probes Activated', language)}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    {midpointPhase === 1
                      ? translateUi('Synthesizing Your Engineering Baseline', language)
                      : midpointPhase === 2
                      ? (language === 'ko' ? `${localizeCareerTitle(selectedJob?.id || '', selectedJob?.title || '목표 직무', language)} 직무 역량 비교 중` : `Calibrating against ${selectedJob?.title || 'Target Role'}`)
                      : translateUi('Second-Half Probes Custom-Tailored', language)}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed pt-1">
                    {midpointSummary ? localizeDiagnosticBridge(midpointSummary, language) : translateUi('Analyzing your first 5 engineering signals... Recalibrating remaining questions for your target career.', language)}
                  </p>
                </div>

                {/* Progress Pipeline Steps */}
                <div className="grid grid-cols-3 gap-2 pt-2 max-w-md mx-auto">
                  <div
                    className={`p-2 rounded-xl border text-[10px] font-bold transition-all ${
                      midpointPhase >= 1
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    <LocalizedText en={"1. Telemetry"} />{' '}</div>
                  <div
                    className={`p-2 rounded-xl border text-[10px] font-bold transition-all ${
                      midpointPhase >= 2
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    <LocalizedText en={"2. Role Mapping"} />{' '}</div>
                  <div
                    className={`p-2 rounded-xl border text-[10px] font-bold transition-all ${
                      midpointPhase >= 3
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    <LocalizedText en={"3. Probes Ready"} />{' '}</div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1 text-xs font-bold text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>
                    {midpointPhase === 1
                      ? translateUi('Aggregating problem framing and root-cause evidence...', language)
                      : midpointPhase === 2
                      ? translateUi('Projecting multi-axis radar competency scores...', language)
                      : translateUi('Ready! Launching question 6...', language)}
                  </span>
                </div>
              </motion.div>
            ) : isComplete && (isLoadingSummary || (!heardSummary && !summaryError)) ? (
              /* Sleek AI Synthesis Loading State */
              <motion.div
                key="loading-summary"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-8 sm:p-10 border border-brand-teal/30 shadow-sm text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-teal to-brand-navy flex items-center justify-center text-white mx-auto shadow-md animate-pulse">
                  <Sparkles className="w-6 h-6 text-brand-gold" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-brand-navy">
                    <LocalizedText en={"Synthesizing Your Reflection Checkpoint"} />{' '}</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    <LocalizedText en={"Analyzing your answers across the 16 engineering reflection dimensions to summarize your strengths and growth style..."} />{' '}</p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2 text-xs font-semibold text-brand-teal">
                  <span className="w-2 h-2 rounded-full bg-brand-teal animate-ping" />
                  <span><LocalizedText en={"Connecting signal evidence..."} /></span>
                </div>
              </motion.div>
            ) : isComplete && summaryError && !heardSummary ? (
              /* Error State with Retry */
              <motion.div
                key="summary-error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 rounded-2xl p-6 sm:p-7 border border-red-200 text-red-900 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-extrabold"><LocalizedText en={"Could not synthesize checkpoint"} /></h3>
                    <p className="text-xs text-red-700 mt-0.5">{summaryError}</p>
                  </div>
                </div>
                <button
                  onClick={retryFetchSummary}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                >
                  <LocalizedText en={"Retry Synthesis"} />{' '}</button>
              </motion.div>
            ) : isComplete && heardSummary ? (
              /* "Here's What I Heard" Checkpoint */
              <motion.div
                key="heard-summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span><LocalizedText en={"Reflection Checkpoint"} /></span>
                  </div>
                  <h3 className="text-xl font-extrabold text-brand-navy">
                    <LocalizedText en={"Here's what I heard about your engineering journey"} />{' '}</h3>
                  <p className="text-xs text-slate-500">{translateUi(heardSummary.opening, language)}</p>
                </div>

                {/* Synthesis Bullets */}
                <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                  {heardSummary.summary_bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-brand-teal/15 text-brand-teal flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p>{bullet}</p>
                    </div>
                  ))}
                </div>

                {/* Closing Prompt & Response Buttons */}
                {!isRefining ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-slate-700 text-center">
                      {translateUi(heardSummary.closing_prompt, language)}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        onClick={() => confirmHeardCheckpoint('yes')}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span><LocalizedText en={"Yes, accurately"} /></span>
                      </button>
                      <button
                        onClick={() => confirmHeardCheckpoint('mostly')}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navyLight text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span><LocalizedText en={"Mostly accurate"} /></span>
                      </button>
                      <button
                        onClick={() => setIsRefining(true)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer border border-amber-600/30"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-white" />
                        <span><LocalizedText en={"Not quite / Refine"} /></span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Refinement Box */
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 pt-2 border-t border-slate-100"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        <LocalizedText en={"Help us calibrate: what feels incomplete or slightly off?"} />{' '}</span>
                      <button
                        type="button"
                        onClick={() => setIsRefining(false)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                      >
                        <LocalizedText en={"Cancel"} />{' '}</button>
                    </div>

                    <textarea
                      value={refinementText}
                      onChange={(e) => setRefinementText(e.target.value)}
                      placeholder={uiAttr("E.g. I actually have more hands-on hardware and embedded systems experience than indicated, and I prefer building prototypes over theoretical research...")}
                      rows={3}
                      className="w-full text-xs p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsRefining(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                      >
                        <LocalizedText en={"Back"} />{' '}</button>
                      <button
                        type="button"
                        onClick={() => confirmHeardCheckpoint('not_really', refinementText)}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <span><LocalizedText en={"Submit Refinement & Continue"} /></span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : dynamicQuestion ? (
              /* Active Question Card */
              <motion.div
                key={dynamicQuestion.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5"
              >
                {/* 💬 Conversational Mentor Reflection Bubble */}
                {conversationalBridge && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border ${
                      isContradiction
                        ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-300 text-amber-950'
                        : 'bg-gradient-to-r from-teal-500/10 via-blue-500/5 to-transparent border-teal-200 text-slate-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      isContradiction
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                        : 'bg-gradient-to-br from-teal-500 to-brand-navy text-white'
                    }`}>
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                          <LocalizedText en={"Mentor Reflection"} />{' '}</span>
                        {isContradiction && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300">
                            <LocalizedText en={"🔍 Socratic Calibration"} />{' '}</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold leading-relaxed text-slate-900">
                        {localizeDiagnosticBridge(conversationalBridge, language)}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Scenario & Question Layer Context Indicator */}
                {dynamicQuestion.layer === 'contextual' ? (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/90 border border-purple-200/80 text-purple-950 text-xs shadow-xs">
                    <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      🔍
                    </div>
                    <div>
                      <span className="font-extrabold uppercase tracking-wide text-purple-900 block text-[11px]">
                        <LocalizedText en={"Domain Deep Dive"} />{' '}</span>
                      <span className="text-purple-700 text-[11px]">
                        <LocalizedText en={"Tailored scenario based on your previous interest and task choices."} />{' '}</span>
                    </div>
                  </div>
                ) : dynamicQuestion.layer === 'adaptive' ? (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs shadow-xs">
                    <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      ⚡
                    </div>
                    <div>
                      <span className="font-extrabold uppercase tracking-wide text-amber-900 block text-[11px]">
                        <LocalizedText en={"Adaptive Reflection Probe"} />{' '}</span>
                      <span className="text-amber-800 text-[11px]">
                        <LocalizedText en={"Exploring nuances between your self-ratings and project experiences."} />{' '}</span>
                    </div>
                  </div>
                ) : null}

                {/* Header Badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
                        dynamicQuestion.layer === 'contextual'
                          ? 'bg-purple-100/70 text-purple-900 border-purple-200'
                          : dynamicQuestion.layer === 'adaptive'
                          ? 'bg-amber-100/70 text-amber-900 border-amber-200'
                          : 'bg-brand-navy/5 text-brand-navy border-brand-navy/15'
                      }`}
                    >
                      {dynamicQuestion.layer === 'contextual'
                        ? translateUi('DEEP DIVE', language)
                        : dynamicQuestion.layer === 'adaptive'
                        ? translateUi('ADAPTIVE PROBE', language)
                        : translateUi('CORE QUESTION', language)}
                    </span>
                    {dynamicQuestion.dimension && dynamicQuestion.dimension[0] && (
                      <span className="text-[11px] font-semibold text-slate-500 capitalize">
                        {localizeDiagnosticDimension(dynamicQuestion.dimension[0], language)}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono font-semibold text-slate-400">
                    <LocalizedText en={"ID:"} />{' '}{dynamicQuestion.id}
                  </span>
                </div>

                {/* Question Text */}
                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-bold text-brand-navy leading-snug">
                    {dynamicQuestion.text}
                  </h3>
                  {dynamicQuestion.instruction && (
                    <p className="text-xs font-semibold text-brand-teal">
                      {dynamicQuestion.instruction}
                    </p>
                  )}
                </div>

                {/* Hint */}
                {dynamicQuestion.hint && (
                  <div className="flex items-start gap-2 bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-900">
                    <Lightbulb className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                    <span>{dynamicQuestion.hint}</span>
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-2.5 pt-1">
                  {dynamicQuestion.options.map((opt) => {
                    const isSelected = selectedOptionIds.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleOption(opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-brand-navy text-white border-brand-navy shadow-sm ring-2 ring-brand-teal/30 font-bold'
                            : 'bg-slate-50/80 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center ${
                              isSelected ? 'bg-brand-gold text-brand-navy' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-md border border-slate-300 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Optional Commentary / Project Evidence */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-teal" />
                    <span><LocalizedText en={"Optional Project Context / Concrete Evidence:"} /></span>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={uiAttr("E.g. In my senior design drone project, I wrote custom PID controllers in C++ and debugged the sensor drift...")}
                    rows={2}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-teal outline-none transition-all"
                  />

                  {/* Snippets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sampleSnippets.map((snippet) => (
                      <button
                        key={translateUi(snippet, language)}
                        type="button"
                        onClick={() => handleSnippetClick(snippet)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-900 border border-slate-200 transition-colors"
                      >
                        + {translateUi(snippet, language)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400">
                    {selectedOptionIds.length > 0
                      ? `${selectedOptionIds.length}${language === 'ko' ? '개 선택됨' : ' option(s) selected'}`
                      : translateUi('Please select an option to continue', language)}
                  </p>

                  <button
                    onClick={submitAnswer}
                    disabled={selectedOptionIds.length === 0 || isSubmitting}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all ${
                      selectedOptionIds.length > 0 && !isSubmitting
                        ? 'bg-gradient-to-r from-brand-navy to-brand-navyLight hover:brightness-110 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{translateUi(isSubmitting ? 'Calibrating...' : 'Next Question', language)}</span>
                    <ArrowRight className="w-4 h-4 text-brand-gold" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-brand-teal border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium"><LocalizedText en={"Loading questionnaire engine..."} /></p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Live Dynamic Scoring & Radar Panel (5 cols, sticky floating on scroll with top buffer) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 self-start transition-all duration-300 ease-out">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-brand-navy">
                  <LocalizedText en={"Evidence-Calibrated Competency"} />{' '}</h3>
                <p className="text-xs text-slate-500">
                  <LocalizedText en={"Real-time radar adapting to your reflection"} />{' '}</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <LocalizedText en={"Live"} />{' '}</span>
            </div>

            {/* Radar Chart */}
            <div className="h-72">
              <RadarChart currentScores={currentScores} targetJob={selectedJob} height={280} />
            </div>

            {/* Confidence Score Gauge */}
            <div className="pt-2 border-t border-slate-100">
              <ConfidenceScore size="standard" />
            </div>
          </div>

          {/* Quick CTA to proceed if desired */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-slate-800"><LocalizedText en={"Ready to conclude reflection?"} /></p>
              <p className="text-slate-500 text-[11px]"><LocalizedText en={"You can view your Growth Portrait at any time."} /></p>
            </div>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-3 py-2 rounded-xl bg-brand-navy text-white font-bold hover:bg-brand-navyLight transition-colors flex items-center gap-1 flex-shrink-0"
            >
              <span><LocalizedText en={"See Portrait"} /></span>
              <ArrowRight className="w-3 h-3 text-brand-gold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
