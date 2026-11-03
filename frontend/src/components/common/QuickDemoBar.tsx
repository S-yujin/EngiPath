import { LocalizedText, uiAttr } from '../../i18n/uiText';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_PROFILES, STEPS } from '../../utils/mockData';
import { Sparkles, RotateCcw, UserCheck, ChevronRight, Zap } from 'lucide-react';

export const QuickDemoBar: React.FC = () => {
  const { currentStep, setCurrentStep, loadDemoProfile, resetAll, profile } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs py-1.5 px-4 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-brand-gold">
            <Zap className="w-3.5 h-3.5" />
            <span><LocalizedText en={"Demo Mode:"} /></span>
          </span>
          <span className="text-slate-300 hidden sm:inline"><LocalizedText en={"Active Student:"} /></span>
          <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {profile.name} ({profile.major}<LocalizedText en={", Yr"} />{' '}{profile.year})
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {/* Fast Stepper Shortcuts */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setCurrentStep(0)}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                currentStep === 0
                  ? 'bg-brand-gold text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              title={uiAttr("Hero Landing Page")}
            >
              <LocalizedText en={"Hero"} />{' '}</button>
            {STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`px-2 py-0.5 rounded transition-all font-medium ${
                  currentStep === s.step
                    ? 'bg-brand-teal text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title={s.title}
              >
                S{s.step}
              </button>
            ))}
          </div>

          {/* Quick Archetype Loader */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 ml-1 hidden md:inline"><LocalizedText en={"Presets:"} /></span>
            {DEMO_PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => loadDemoProfile(p.id)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-brand-navyLight border border-slate-700 text-slate-200 hover:text-brand-gold transition-colors font-medium"
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <button
            onClick={resetAll}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors ml-1"
            title={uiAttr("Reset to initial clean state")}
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline"><LocalizedText en={"Reset"} /></span>
          </button>
        </div>
      </div>
    </div>
  );
};
