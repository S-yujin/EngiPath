import { LocalizedText, uiAttr, translateUi } from '../../i18n/uiText';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCw, X, ArrowRight, Zap, Target, BookOpen, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NewCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FOCUS_OPTIONS = [
  { id: 'Prototyping & Execution', label: 'Prototyping & Hardware', icon: Layers },
  { id: 'Troubleshooting & Problem Solving', label: 'Troubleshooting & Debugging', icon: Zap },
  { id: 'Systems Thinking & Architecture', label: 'Systems Thinking & Architecture', icon: Target },
  { id: 'Learning Agility & Adaptation', label: 'Learning & Technology Agility', icon: BookOpen },
];

export const NewCycleModal: React.FC<NewCycleModalProps> = ({ isOpen, onClose }) => {
  const { currentCycle, startNewReflectionCycle, language } = useApp();
  const [projectUpdate, setProjectUpdate] = useState('');
  const [focusArea, setFocusArea] = useState('Prototyping & Execution');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextCycle = currentCycle + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await startNewReflectionCycle(projectUpdate.trim() || undefined, focusArea);
      onClose();
    } catch (err) {
      console.error('Error starting new cycle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-teal-500/30 text-white shadow-2xl overflow-hidden z-10 p-6 sm:p-7 space-y-6"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none bg-teal-500/10" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-400/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-lg shadow-teal-950/40">
                  <RotateCw className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 px-2 py-0.5 rounded-full bg-teal-400/10 border border-teal-400/20">
                      <LocalizedText en={"Cycle"} />{' '}{nextCycle} <LocalizedText en={"• Growth Checkpoint"} />{' '}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight mt-0.5">
                    <LocalizedText en={"Start New Reflection Cycle"} />{' '}</h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Question 1: What did you work on? */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <LocalizedText en={"What new projects, coursework, or challenges have you tackled?"} />{' '}</label>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <LocalizedText en={"Briefly mention any recent hands-on tasks, bug fixes, or skills you practiced. This gives our AI mentor context to ask fresh, targeted questions."} />{' '}</p>
                <textarea
                  value={projectUpdate}
                  onChange={(e) => setProjectUpdate(e.target.value)}
                  placeholder={uiAttr("e.g., Built a CAN-bus telemetry module on STM32, fixed sensor noise issues, and wrote unit tests for our robot drivetrain...")}
                  rows={3}
                  className="w-full rounded-2xl bg-slate-950/80 border border-slate-700/80 focus:border-teal-400 p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 transition-all resize-none"
                />
              </div>

              {/* Question 2: Priority Focus Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-teal-400" />
                  <LocalizedText en={"Select primary growth dimension to explore:"} />{' '}</label>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = focusArea === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setFocusArea(opt.id)}
                        className={`p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-500/20 border-teal-400 text-teal-200 shadow-sm'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-teal-300' : 'text-slate-500'}`} />
                        <span className="truncate text-[11px]">{translateUi(opt.label, language)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <LocalizedText en={"Cancel"} />{' '}</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-teal-950/50 hover:shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span><LocalizedText en={"Initializing Cycle"} />{' '}{nextCycle}…</span>
                  ) : (
                    <>
                      <span><LocalizedText en={"Launch Cycle"} />{' '}{nextCycle} <LocalizedText en={"Diagnostic"} /></span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
