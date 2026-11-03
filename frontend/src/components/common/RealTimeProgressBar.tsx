import { LocalizedText, uiAttr } from '../../i18n/uiText';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { STEPS } from '../../utils/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface RealTimeProgressBarProps {
  className?: string;
}

export const RealTimeProgressBar: React.FC<RealTimeProgressBarProps> = ({ className = '' }) => {
  const { currentStep, setCurrentStep, overallProgress, isStepUnlocked, isAdminMode, t } = useApp();
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const progressPercentage = overallProgress;
  const activeStepObj = STEPS.find((s) => s.step === currentStep) || STEPS[0];

  return (
    <div className={`w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col justify-center px-1 sm:px-2 select-none ${className}`}>
      {/* Top Info Header Row: Active Step Label & Live Percentage */}
      <div className="flex items-center justify-between text-xs mb-1.5 px-0.5">
        <div className="flex items-center gap-1.5 truncate">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-bold text-slate-800 tracking-tight truncate text-[11px] sm:text-xs">
            {t(`step.${currentStep}`, activeStepObj.title)}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-slate-400 font-semibold">
            ({currentStep}/6)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isAdminMode && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-bold">
              <LocalizedText en={"⚡ Admin"} />{' '}</span>
          )}
          <span className="font-extrabold text-[11px] sm:text-xs text-brand-navy font-mono">
            {Math.round(progressPercentage)}%
          </span>
          <span className="text-[10px] text-slate-400 font-medium"><LocalizedText en={"Complete"} /></span>
        </div>
      </div>

      {/* Progress Track Bar & Milestone Line Pins */}
      <div
        className="relative w-full h-2.5 sm:h-3 bg-slate-200/90 rounded-full flex items-center p-0.5"
        onMouseLeave={() => setHoveredStep(null)}
      >
        {/* Animated Gradient Fill Bar */}
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-brand-navy relative"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, progressPercentage)}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        >
          {/* Glowing Leading Pulse Node at Bar Tip */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white shadow-md border-2 border-brand-teal flex items-center justify-center pointer-events-none z-20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
          </div>
        </motion.div>

        {/* Milestone Node Pins Along the Line (Steps 1 through 6) */}
        <div className="absolute inset-x-1 sm:inset-x-1.5 inset-y-0 flex items-center justify-between pointer-events-none">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            const isHovered = hoveredStep === s.step;
            const isUnlocked = isStepUnlocked(s.step);

            return (
              <div key={s.step} className="relative flex items-center justify-center pointer-events-auto">
                <button
                  type="button"
                  onMouseEnter={() => setHoveredStep(s.step)}
                  onClick={() => {
                    if (isUnlocked) {
                      setCurrentStep(s.step);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 flex items-center justify-center shadow-xs ${
                    !isUnlocked
                      ? 'bg-slate-200 border border-slate-300 opacity-60 cursor-not-allowed'
                      : isCompleted
                      ? 'bg-emerald-500 text-white scale-100 hover:scale-125 ring-2 ring-emerald-200 cursor-pointer'
                      : isCurrent
                      ? 'bg-slate-900 text-white scale-125 ring-4 ring-teal-400/40 shadow-sm cursor-pointer'
                      : 'bg-white border-2 border-slate-300 hover:border-slate-400 hover:scale-115 cursor-pointer'
                  }`}
                  aria-label={`Step ${s.step}: ${s.title}`}
                >
                  {isCompleted ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : isCurrent ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  ) : null}
                </button>

                {/* Dropdown Milestone Tooltip on Hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 3, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 2, scale: 0.96 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                      <div
                        className={`px-3 py-1.5 rounded-xl shadow-xl border whitespace-nowrap flex items-center gap-1.5 text-xs ${
                          !isUnlocked
                            ? 'bg-slate-900/90 text-slate-400 border-slate-700/60'
                            : 'bg-slate-900/95 text-white border-slate-700/80 shadow-2xl'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-brand-teal text-white'
                              : !isUnlocked
                              ? 'bg-slate-800 text-slate-500'
                              : 'bg-white/20 text-white'
                          }`}
                        >
                          {isCompleted ? '✓' : s.step}
                        </span>
                        <span
                          className={`tracking-tight ${
                            !isUnlocked ? 'text-slate-400 font-medium' : 'text-slate-100 font-bold'
                          }`}
                        >
                          {t(`step.${s.step}`, s.title)}
                        </span>
                        {isCompleted && <span className="text-[10px] text-emerald-400 font-semibold"><LocalizedText en={"(Done)"} /></span>}
                        {isCurrent && <span className="text-[10px] text-amber-300 font-semibold"><LocalizedText en={"(Active)"} /></span>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
