import { LocalizedText, uiAttr, translateUi, localizePlanValue } from '../../i18n/uiText';
import { getUiLanguage } from '../../i18n/localeStore';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NewCycleModal } from '../common/NewCycleModal';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Calendar,
  Milestone,
  Check,
  Plus,
  Share2,
  Layers,
  Flag,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  RotateCw,
  Trophy,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MinimumRequirement } from '../../types';

/** Shared todo-list row: checkbox toggles completion, chevron expands concrete steps. */
const RequirementRow: React.FC<{
  req: MinimumRequirement;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}> = ({ req, expanded, onToggle, onExpand }) => (
  <div>
    <div className="flex items-start gap-1.5 group">
      <button
        onClick={onToggle}
        className="flex items-start gap-2 flex-1 text-left cursor-pointer"
        title={translateUi(req.completed ? 'Mark as not done' : 'Mark as done', getUiLanguage())}
      >
        <span
          className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
            req.completed
              ? 'bg-emerald-600 border-emerald-600'
              : 'bg-white border-slate-300 group-hover:border-brand-teal'
          }`}
        >
          {req.completed && <Check className="w-3 h-3 text-white stroke-[3]" />}
        </span>
        <span
          className={`text-[11px] leading-snug ${
            req.completed ? 'line-through text-slate-400' : 'text-slate-700'
          }`}
        >
          {localizePlanValue(req.label, getUiLanguage())}
        </span>
      </button>
      {req.detail && (
        <button
          onClick={onExpand}
          className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          title={translateUi(expanded ? 'Hide detail' : 'Show detail', getUiLanguage())}
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
    {expanded && req.detail && (
      <p className="mt-1 ml-6 text-[10px] text-slate-500 leading-relaxed bg-white/60 border border-slate-200 rounded p-1.5">
        {localizePlanValue(req.detail, getUiLanguage())}
      </p>
    )}
  </div>
);

export const Screen5_ActionPlan: React.FC = () => {
  const {
    actionPlan,
    planStatus,
    planError,
    generateActionPlan,
    currentCycle,
    toggleShortTermAction,
    toggleMinimumRequirement,
    toggleLongTermMilestone,
    toggleMilestoneRequirement,
    selectedJob,
    language,
    setCurrentStep
  } = useApp();

  // Generate tailored action plan from LLM whenever student enters Step 5 or changes job
  useEffect(() => {
    generateActionPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob?.id]);

  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState<boolean>(false);
  // Expanded requirement details, keyed `${action.id}-${reqIndex}`.
  const [expandedReqs, setExpandedReqs] = useState<Record<string, boolean>>({});

  // Calculate live checklist completion stats
  const totalShortTermActions = actionPlan.shortTerm.length;
  const completedShortTermActions = actionPlan.shortTerm.filter((a) => a.completed).length;

  const totalShortTermReqs = actionPlan.shortTerm.reduce(
    (acc, a) => acc + (a.minimumRequirements?.length || 0),
    0
  );
  const completedShortTermReqs = actionPlan.shortTerm.reduce(
    (acc, a) => acc + (a.minimumRequirements?.filter((r) => r.completed).length || 0),
    0
  );

  const totalLongTermMilestones = actionPlan.longTerm.length;
  const completedLongTermMilestones = actionPlan.longTerm.filter((m) => m.completed).length;

  const totalCheckpoints = totalShortTermActions + totalShortTermReqs + totalLongTermMilestones;
  const completedCheckpoints = completedShortTermActions + completedShortTermReqs + completedLongTermMilestones;
  const progressPercent = totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* New Reflection Cycle Check-in Modal */}
      <NewCycleModal
        isOpen={isNewCycleModalOpen}
        onClose={() => setIsNewCycleModalOpen(false)}
      />

      {/* Header */}
      <div className="text-center space-y-2 relative">
        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shadow-sm">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span><LocalizedText en={"Step 5 of 6"} /></span>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-teal-300 text-xs font-extrabold border border-teal-500/30">
            <LocalizedText en={"Cycle"} />{' '}{currentCycle} <LocalizedText en={"Blueprint"} />{' '}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight">
          <LocalizedText en={"Your Action Plan & Milestone Checklist"} />{' '}</h2>
        <p className="text-slate-600 text-sm max-w-xl mx-auto">
          <LocalizedText en={"Every item below is an interactive checklist step tailored to bridge your skill gap toward"} />{' '}
          <strong className="text-brand-navy underline decoration-brand-gold">{selectedJob?.title || 'Target Role'}</strong>.
        </p>
      </div>

      {/* Live Checklist Progress Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-navy to-slate-900 border border-teal-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-400/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white"><LocalizedText en={"Action Blueprint Progress"} /></h4>
              <p className="text-xs text-slate-300">
                {completedShortTermActions} <LocalizedText en={"of"} />{' '}{totalShortTermActions} <LocalizedText en={"Sprints Done •"} />{' '}{completedShortTermReqs}/{totalShortTermReqs} <LocalizedText en={"Sub-tasks checked"} />{' '}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => generateActionPlan(true)}
              disabled={planStatus === 'generating'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title={uiAttr("Regenerate customized plan with Engipath AI")}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${planStatus === 'generating' ? 'animate-spin' : ''}`} />
              <span><LocalizedText en={"Regenerate with AI"} /></span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewCycleModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-teal-950/50 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span><LocalizedText en={"New Cycle Reflection"} /></span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium"><LocalizedText en={"Overall Checklist Completion"} /></span>
            <span className="text-teal-300 font-mono font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-teal-400 via-teal-300 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(45,212,191,0.6)]"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Plan generation states */}
      {planStatus === 'generating' && (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4 text-center min-h-72">
          <Loader2 className="w-10 h-10 text-brand-teal animate-spin" />
          <h3 className="text-base font-extrabold text-brand-navy">
            <LocalizedText en={"Designing your personalized action checklist with Engipath AI…"} />{' '}</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            <LocalizedText en={"Analyzing your diagnostic gap against"} />{' '}{selectedJob?.title || 'target role'} <LocalizedText en={"to build concrete, high-leverage micro-sprints."} />{' '}</p>
        </div>
      )}

      {planStatus === 'error' && (
        <div className="bg-red-50 rounded-3xl p-8 border border-red-200 flex flex-col items-center justify-center space-y-4 text-center min-h-72">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <h3 className="text-base font-extrabold text-red-900"><LocalizedText en={"Action plan generation failed"} /></h3>
          <p className="text-xs text-red-700 max-w-sm">{planError}</p>
          <button
            type="button"
            onClick={() => generateActionPlan(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-brand-navyLight transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <LocalizedText en={"Retry"} />{' '}</button>
        </div>
      )}

      {planStatus !== 'generating' && planStatus !== 'error' && (
        <>
          {/* SECTION 1: Exactly 3 Short-Term Actions (Checklist Format) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-navy text-white flex items-center justify-center font-black text-xs shadow-sm">
                  1
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-brand-navy">
                    <LocalizedText en={"Short-Term Sprint Checklist (Next 4–8 Weeks)"} />{' '}</h3>
                  <p className="text-xs text-slate-500">
                    <LocalizedText en={"High-impact micro-sprints with checkable sub-requirements"} />{' '}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                {completedShortTermActions} <LocalizedText en={"of"} />{' '}{totalShortTermActions} <LocalizedText en={"Sprints Done"} />{' '}</span>
            </div>

            <div className="space-y-4">
              {actionPlan.shortTerm.map((action, idx) => (
                <motion.div
                  key={action.id}
                  whileHover={{ y: -2 }}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 ${
                    action.completed
                      ? 'border-emerald-300 bg-emerald-50/20 ring-2 ring-emerald-200/50'
                      : 'border-slate-200/90 hover:border-brand-teal/50 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Interactive Sprint Checkbox Button */}
                      <button
                        type="button"
                        onClick={() => toggleShortTermAction(action.id)}
                        className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          action.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'border-slate-300 bg-white hover:border-brand-teal hover:bg-slate-50'
                        }`}
                        title={action.completed ? 'Mark incomplete' : 'Mark sprint complete'}
                      >
                        {action.completed && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            <LocalizedText en={"Sprint"} />{' '}{idx + 1}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {localizePlanValue(action.timeCommitment, language)}
                          </span>
                        </div>

                        <h4 className={`text-base font-bold text-brand-navy leading-snug ${action.completed ? 'line-through text-slate-400' : ''}`}>
                          {localizePlanValue(action.title, language)}
                        </h4>

                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                          {localizePlanValue(action.description, language)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleShortTermAction(action.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                        action.completed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {translateUi(action.completed ? 'Sprint Done ✓' : 'Complete Sprint', language)}
                    </button>
                  </div>

                  {/* Expandable Minimum Requirements Checklist */}
                  {action.minimumRequirements && action.minimumRequirements.length > 0 && (
                    <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                          <LocalizedText en={"Minimum Requirement Checklist (Check each to advance)"} />{' '}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {action.minimumRequirements.filter((r) => r.completed).length} / {action.minimumRequirements.length} <LocalizedText en={"Done"} />{' '}</span>
                      </div>

                      {action.minimumRequirements.map((req, rIdx) => {
                        const reqKey = `${action.id}-${rIdx}`;
                        return (
                          <RequirementRow
                            key={rIdx}
                            req={req}
                            expanded={!!expandedReqs[reqKey]}
                            onToggle={() => toggleMinimumRequirement(action.id, rIdx)}
                            onExpand={() =>
                              setExpandedReqs((prev) => ({ ...prev, [reqKey]: !prev[reqKey] }))
                            }
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Resource Link */}
                  {action.resourceLink && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={action.resourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:text-brand-navy transition-colors"
                      >
                        <span><LocalizedText en={"Open Learning Resource"} /></span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* SECTION 2: Long-Term Vision Timeline Checklist (1-2 Years) */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-xs shadow-sm">
                  2
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-brand-navy">
                    <LocalizedText en={"Long-Term Career Vision Roadmap (1–2 Years)"} />{' '}</h3>
                  <p className="text-xs text-slate-500">
                    <LocalizedText en={"Strategic checkpoints leading to full readiness for"} />{' '}{selectedJob?.title || 'Target Role'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                {completedLongTermMilestones} <LocalizedText en={"of"} />{' '}{totalLongTermMilestones} <LocalizedText en={"Milestones Cleared"} />{' '}</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              {actionPlan.visionDescription && (
                <div className="rounded-2xl border border-brand-navy/10 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-brand-navy block mb-0.5"><LocalizedText en={"Strategic Vision:"} /></span>
                  {localizePlanValue(actionPlan.visionDescription, language)}
                </div>
              )}

              <div className="space-y-3">
                {actionPlan.longTerm.map((milestone, idx) => (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      milestone.completed
                        ? 'bg-emerald-50/30 border-emerald-200 text-slate-500'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div
                        onClick={() => toggleLongTermMilestone(milestone.id)}
                        className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"
                      >
                        <span
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            milestone.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : 'border-slate-300 bg-white hover:border-brand-teal'
                          }`}
                        >
                          {milestone.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <div>
                          <span className={`text-sm font-bold leading-snug block ${milestone.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            <LocalizedText en={"Milestone"} />{' '}{idx + 1}: {localizePlanValue(milestone.title, language)}
                          </span>
                          {milestone.notes && (
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{localizePlanValue(milestone.notes, language)}</p>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 shrink-0">
                        {localizePlanValue(milestone.timeline, language)}
                      </span>
                    </div>

                    {/* Expandable sub-requirements */}
                    {milestone.minimumRequirements && milestone.minimumRequirements.length > 0 && (
                      <div className="mt-3 pl-7 pt-2.5 border-t border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            <LocalizedText en={"Sub-Requirements:"} />{' '}</span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {milestone.minimumRequirements.filter((r) => r.completed).length} / {milestone.minimumRequirements.length}
                          </span>
                        </div>

                        {milestone.minimumRequirements.map((req, rIdx) => {
                          const reqKey = `lt-${milestone.id}-${rIdx}`;
                          return (
                            <RequirementRow
                              key={rIdx}
                              req={req}
                              expanded={!!expandedReqs[reqKey]}
                              onToggle={() => toggleMilestoneRequirement(milestone.id, rIdx)}
                              onExpand={() =>
                                setExpandedReqs((prev) => ({ ...prev, [reqKey]: !prev[reqKey] }))
                              }
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

      {/* Accomplished Milestones Historical Archive (Multi-Cycle Evolution) */}
      {actionPlan.accomplished_actions && actionPlan.accomplished_actions.length > 0 && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-teal-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-400/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white"><LocalizedText en={"Accomplished Milestones Archive"} /></h3>
                <p className="text-xs text-slate-300"><LocalizedText en={"Historical action sprint achievements from prior reflection cycles"} /></p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {actionPlan.accomplished_actions.length} <LocalizedText en={"Achieved"} />{' '}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {actionPlan.accomplished_actions.map((act, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 relative overflow-hidden group hover:border-teal-500/40 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300 px-2 py-0.5 rounded-full bg-teal-500/20">
                    <LocalizedText en={"Cycle"} />{' '}{act.cycle_number} <LocalizedText en={"Completed"} />{' '}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                  {act.title}
                </h4>
                {act.why && (
                  <p className="text-[11px] text-slate-300 line-clamp-2 italic">
                    "{act.why}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-200">
        <button
          onClick={() => setCurrentStep(4)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span><LocalizedText en={"Back to Portrait"} /></span>
        </button>

        <button
          onClick={() => setCurrentStep(6)}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal hover:brightness-110 text-white text-sm font-extrabold shadow-md hover:shadow-lg transition-all"
        >
          <span><LocalizedText en={"Enter Living Retention Dashboard"} /></span>
          <ArrowRight className="w-4 h-4 text-brand-gold" />
        </button>
      </div>
        </>
      )}
    </div>
  );
};
