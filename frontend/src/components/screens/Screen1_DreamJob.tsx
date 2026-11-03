import { LocalizedText, uiAttr, translateUi } from '../../i18n/uiText';
import { localizeCareerTitle, localizeCareerDescription, localizeCareerCategory, localizeCareerReason } from '../../i18n/careerLocalization';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DREAM_JOBS } from '../../utils/mockData';
import { DreamJob } from '../../types';
import { CareerCoverflowSlider, getRoleMedia } from './CareerCoverflowSlider';
import { calculateMatchPercentage } from '../../utils/scoring';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SortOption = 'fit' | 'pay';

export const Screen1_DreamJob: React.FC = () => {
  const {
    selectedJob,
    setSelectedJob,
    setCurrentStep,
    curatedCareers,
    profile,
    matchPercentage,
    t,
    language
  } = useApp();

  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<SortOption>('fit');

  // Dynamic curated jobs from backend or reliable fallback to DREAM_JOBS
  const rawJobs: DreamJob[] = curatedCareers && curatedCareers.length > 0 ? curatedCareers : DREAM_JOBS;

  // Sorted jobs by Highest Fit or Highest Pay
  const jobs: DreamJob[] = useMemo(() => {
    const list = [...rawJobs];
    if (sortBy === 'pay') {
      return list.sort((a, b) => {
        const mediaA = getRoleMedia(a.category, a.title, a.id);
        const mediaB = getRoleMedia(b.category, b.title, b.id);
        const payA = parseInt(mediaA.metric.replace(/[^0-9]/g, ''), 10) || 0;
        const payB = parseInt(mediaB.metric.replace(/[^0-9]/g, ''), 10) || 0;
        return payB - payA;
      });
    }
    // Default: 'fit'
    return list.sort((a, b) => {
      const matchA = calculateMatchPercentage(profile.currentScores, a.targetScores);
      const matchB = calculateMatchPercentage(profile.currentScores, b.targetScores);
      return matchB - matchA;
    });
  }, [rawJobs, sortBy, profile.currentScores]);

  const activeJob = selectedJob || (jobs.length > 0 ? jobs[0] : null);

  const competencyLabels: Record<string, string> = {
    technicalFundamentals: 'Technical Fundamentals',
    programming: 'Programming & Logic',
    prototyping: 'Prototyping & CAD/Lab',
    systemsThinking: 'Systems Thinking',
    communication: 'Communication & Team',
    learningAgility: 'Learning Agility'
  };

  const handleConfirmAndProceed = () => {
    if (activeJob) {
      setSelectedJob(activeJob);
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJob = React.useCallback((job: DreamJob) => {
    setSelectedJob(job);
  }, [setSelectedJob]);

  const activeMedia = activeJob ? getRoleMedia(activeJob.category, activeJob.title, activeJob.id) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold shadow-2xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{curatedCareers.length > 0 ? t('careers.badge', 'Curated by Engipath AI') : translateUi('Calibrated Recommendations', language)}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            {t('careers.title', 'Curated Career Directions')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('careers.subtitle', 'Slide and select any career card to inspect target competencies and begin your diagnostic baseline.')}
          </p>
        </div>

        {/* Top Right Action & Navigation */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => {
              setCurrentStep(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('step.1', 'Profile')} ({t('nav.step')} 1)</span>
          </button>

          <button
            onClick={handleConfirmAndProceed}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-amber-400" />
            <span>{t('careers.confirmBtn', 'Proceed to Step 3')}</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* 🚀 Sort & Filter Control Bar (Highest Fit & Highest Pay) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur-md px-4 sm:px-5 py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600 flex-wrap">
          <div className="flex items-center gap-1 text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('careers.sortBy', 'Sort by')}:</span>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 gap-1">
            <button
              onClick={() => setSortBy('fit')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                sortBy === 'fit'
                  ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${sortBy === 'fit' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{t('careers.sortHighestFit', 'Highest Fit')}</span>
            </button>

            <button
              onClick={() => setSortBy('pay')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                sortBy === 'pay'
                  ? 'bg-white text-sky-950 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <DollarSign className={`w-3.5 h-3.5 ${sortBy === 'pay' ? 'text-sky-600' : 'text-slate-400'}`} />
              <span>{t('careers.sortHighestPay', 'Highest Pay')}</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          <span className="font-bold text-slate-700">{jobs.length}</span> <LocalizedText en={"career directions"} />{' '}</div>
      </div>

      {/* 🚀 1. 3D COVERFLOW SLIDING CAROUSEL (Image 1 Style) */}
      <div className="w-full">
        <CareerCoverflowSlider
          jobs={jobs}
          selectedJob={activeJob}
          onSelectJob={handleSelectJob}
          onConfirm={handleConfirmAndProceed}
          t={t}
          matchPercentage={matchPercentage}
          userScores={profile.currentScores}
        />
      </div>

      {/* 🚀 2. DETAILED ROLE SPECIFICATIONS & TARGET COMPETENCY RADAR (Expandable / Collapsible) */}
      {activeJob && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5"
        >
          {/* Header Info Banner */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                {activeMedia?.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${activeMedia?.badgeBg || 'bg-purple-50 text-purple-700 border-purple-100/80'}`}>
                    {localizeCareerCategory(activeJob.category || 'Engineering Specialty', language)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    <LocalizedText en={"O*NET"} />{' '}{activeJob.id}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-brand-navy mt-1">
                  {localizeCareerTitle(activeJob.id, activeJob.title, language)}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {t('careers.matchScore', 'Match Fit')}
                </span>
                <span className="text-xl font-black text-emerald-600">
                  {matchPercentage}%
                </span>
              </div>

              <button
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                title={language === 'ko' ? (isDetailsOpen ? '직무 상세 접기' : '직무 상세 펼치기') : (isDetailsOpen ? 'Collapse specifications' : 'Expand specifications')}
              >
                {isDetailsOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {isDetailsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 overflow-hidden"
              >
                {/* Role Overview */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t('careers.overview', 'Role Overview')}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {localizeCareerDescription(activeJob.id, activeJob.description, language)}
                  </p>
                </div>

                {/* AI Alignment Points */}
                {activeJob.keyCompetencies && activeJob.keyCompetencies.length > 0 && (
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-navy">
                      <Sparkles className="w-4 h-4 text-brand-teal" />
                      <span>{t('careers.whyMatch', 'Why This Matches Your Profile')} ({profile.major || 'Engineering'}<LocalizedText en={", Yr"} />{' '}{profile.year})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeJob.keyCompetencies.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{translateUi(localizeCareerReason(point, language), language)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Core Competency Profile */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t('careers.targetCompetency', 'Target Competency Expectations (6 Core Dimensions)')}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {Object.entries(activeJob.targetScores).map(([key, targetVal]) => (
                      <div
                        key={key}
                        className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700 truncate">
                            {translateUi(competencyLabels[key] || key, language)}
                          </span>
                          <span className="font-bold text-brand-navy">
                            {targetVal}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-teal to-brand-navy rounded-full"
                            style={{ width: `${targetVal}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t('step.1', 'Profile')} ({t('nav.step')} 1)</span>
                  </button>

                  <button
                    onClick={handleConfirmAndProceed}
                    className="flex-1 max-w-md ml-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    <span>{t('careers.confirmBtn', 'Confirm Career & Start Diagnostic')} ({t('nav.step')} 3)</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
