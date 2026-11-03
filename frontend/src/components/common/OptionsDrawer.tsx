import { LocalizedText, uiAttr, translateUi } from '../../i18n/uiText';
import React from 'react';
import { useApp } from '../../context/AppContext';
import { STEPS, DEMO_PROFILES } from '../../utils/mockData';
import {
  X,
  Check,
  Zap,
  Lock,
  Layers,
  Home,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OptionsDrawer: React.FC<OptionsDrawerProps> = ({ isOpen, onClose }) => {
  const {
    currentStep,
    setCurrentStep,
    profile,
    loadDemoProfile,
    isAdminMode,
    toggleAdminMode,
    skipToFuturePrefilled,
    isStepUnlocked,
    t,
    runDemoAutoPilot,
    language
  } = useApp();

  const handleStepClick = (stepNum: number) => {
    if (!isStepUnlocked(stepNum)) return;
    setCurrentStep(stepNum);
    onClose();
    if (stepNum === 1) {
      const academicSection = document.getElementById('academic-context-section');
      if (academicSection) {
        academicSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFastForward = (targetStep: number = 6) => {
    skipToFuturePrefilled(targetStep);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Drawer Capsule */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl z-10 flex flex-col border-l border-slate-200/80"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-navy text-white flex items-center justify-center">
                  <Layers className="w-4 h-4 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy">
                    {t('options.title', 'Navigation & Presets')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {t('options.subtitle', 'Quick test flow & step shortcuts')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title={uiAttr("Close options panel")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Step Navigation Flow */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('options.steps', 'Step Navigator')}
                  </span>
                  {isAdminMode && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                      <span><LocalizedText en={"Admin Active"} /></span>
                    </span>
                  )}
                </div>

                {/* Admin Testing Pass & Fast-Forward Banner */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-300/80 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900"><LocalizedText en={"Admin Mode & Future Skip"} /></div>
                        <div className="text-[10px] text-slate-600"><LocalizedText en={"Bypass locks with prefilled modern data"} /></div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAdminMode(true)}
                      className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border flex items-center gap-1 ${
                        isAdminMode
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-100/60'
                      }`}
                    >
                      <span>{translateUi(isAdminMode ? 'UNLOCKED' : 'ENABLE', language)}</span>
                      {isAdminMode && <Check className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-amber-200/80 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFastForward(6)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                      title={uiAttr("Skip into future with fully prefilled portrait and dashboard")}
                    >
                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span><LocalizedText en={"Skip to Dashboard (Step 6)"} /></span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFastForward(5)}
                      className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold shadow-2xs cursor-pointer transition-all"
                      title={uiAttr("Skip to Step 5 Action Blueprint")}
                    >
                      <LocalizedText en={"Step 5 Blueprint"} />{' '}</button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {STEPS.map((s) => {
                    const isCurrent = currentStep === s.step;
                    const isCompleted = currentStep > s.step;
                    const isUnlocked = isStepUnlocked(s.step);

                    return (
                      <button
                        key={s.step}
                        onClick={() => handleStepClick(s.step)}
                        disabled={!isUnlocked}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                          !isUnlocked
                            ? 'bg-slate-50 border-slate-200/80 text-slate-400 opacity-60 cursor-not-allowed'
                            : isCurrent
                            ? 'bg-brand-navy text-white border-brand-navy shadow-xs font-bold cursor-pointer'
                            : isCompleted
                            ? 'bg-emerald-50/60 border-emerald-200 text-slate-800 hover:bg-emerald-100/60 cursor-pointer'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              !isUnlocked
                                ? 'bg-slate-200 text-slate-500'
                                : isCurrent
                                ? 'bg-white/20 text-white'
                                : isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {!isUnlocked ? <Lock className="w-3 h-3 text-slate-400" /> : s.step}
                          </span>
                          <div>
                            <div className="text-xs font-bold">{t(`step.${s.step}`, s.title)}</div>
                            <div
                              className={`text-[10px] truncate max-w-[210px] ${
                                !isUnlocked ? 'text-slate-400' : isCurrent ? 'text-slate-200' : 'text-slate-500'
                              }`}
                            >
                              {t(`step.${s.step}`, s.shortTitle)}
                            </div>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-brand-gold font-bold">
                            <LocalizedText en={"Current"} />{' '}</span>
                        ) : !isUnlocked ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-500 font-bold flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span><LocalizedText en={"Locked"} /></span>
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ✨ LIVE DEMO AUTO-PILOT (JOHNNY - AI) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-brand-navy to-slate-900 text-white shadow-xl border border-cyan-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-sm">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-cyan-300"><LocalizedText en={"Engipath Auto-Pilot Mode"} /></span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"><LocalizedText en={"Ctrl+Shift+D"} /></span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <LocalizedText en={"Watch Engipath fly across the screen, scan fields, and populate Johnny's senior AI Engineering profile automatically!"} />{' '}</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      runDemoAutoPilot();
                    }, 250);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-400/25 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span><LocalizedText en={"Launch Engipath Auto-Pilot (Johnny)"} /></span>
                </button>
              </div>

              {/* Quick Persona Presets */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('options.presets', 'Preset Personas')}
                  </span>
                  <span className="text-[10px] text-slate-400"><LocalizedText en={"1-click demo test"} /></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_PROFILES.map((p) => {
                    const isSelected = profile.name === p.name;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          loadDemoProfile(p.id);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-brand-navy">{p.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {p.major} <LocalizedText en={"• Yr"} />{' '}{p.year}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    setCurrentStep(0);
                    onClose();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>{t('options.returnHero', 'Return to Hero Landing Top')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

