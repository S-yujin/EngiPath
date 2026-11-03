import { LocalizedText, uiAttr, translateUi } from '../../i18n/uiText';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReflectionItem, ReflectionPortrait } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';
import { AgreementButtons } from './AgreementButtons';
import { COMPETENCY_LABELS } from '../../utils/scoring';
import {
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Flame,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Sparkles,
  Target,
  Compass,
  TrendingUp
} from 'lucide-react';

interface ReflectionCardProps {
  item: ReflectionItem;
  category: keyof ReflectionPortrait;
  onFeedbackChange: (state: any, note?: string) => void;
}

export const ReflectionCard: React.FC<ReflectionCardProps> = ({
  item,
  category,
  onFeedbackChange
}) => {
  const { language } = useApp();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const getCategoryConfig = (cat: keyof ReflectionPortrait | string) => {
    switch (cat) {
      case 'supported_strengths':
      case 'strengths':
        return {
          badgeVariant: 'strength' as BadgeVariant,
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          categoryTitle: 'Supported Strength',
          categorySub: 'Verified by Scenario Decisions',
          cardStyle: 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm',
          topBanner: 'bg-gradient-to-r from-emerald-500 to-teal-600 h-1.5 rounded-t-2xl',
          calloutBg: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950',
          calloutIcon: <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />,
          pillClass: 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
        };
      case 'possible_hidden_strengths':
      case 'overlookedStrengths':
        return {
          badgeVariant: 'overlooked' as BadgeVariant,
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" />,
          categoryTitle: 'Possible Hidden Strength',
          categorySub: 'Latent Competence Uncovered',
          cardStyle: 'bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/20 border-purple-200/90 hover:border-purple-400 shadow-sm ring-1 ring-purple-100',
          topBanner: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-navy h-1.5 rounded-t-2xl',
          calloutBg: 'bg-purple-50/90 border-purple-200 text-purple-950',
          calloutIcon: <Flame className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />,
          pillClass: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'areas_to_validate':
      case 'areasToValidate':
        return {
          badgeVariant: 'validate' as BadgeVariant,
          icon: <Target className="w-3.5 h-3.5 text-amber-600" />,
          categoryTitle: 'Area Worth Validating',
          categorySub: 'High Interest • Open Runway',
          cardStyle: 'bg-white border-amber-200/90 hover:border-amber-400 shadow-sm',
          topBanner: 'bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-t-2xl',
          calloutBg: 'bg-amber-50/80 border-amber-200 text-amber-950',
          calloutIcon: <Compass className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />,
          pillClass: 'bg-amber-100 text-amber-900 border-amber-200'
        };
      case 'developing_picture':
      case 'developmentAreas':
        return {
          badgeVariant: 'development' as BadgeVariant,
          icon: <TrendingUp className="w-3.5 h-3.5 text-blue-600" />,
          categoryTitle: 'Developing Picture',
          categorySub: 'Emerging Capability in Progress',
          cardStyle: 'bg-white border-blue-200/90 hover:border-blue-300 shadow-sm',
          topBanner: 'bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-t-2xl',
          calloutBg: 'bg-blue-50/70 border-blue-200 text-blue-950',
          calloutIcon: <TrendingUp className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />,
          pillClass: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'still_taking_shape':
      case 'insufficientInfo':
      default:
        return {
          badgeVariant: 'insufficient' as BadgeVariant,
          icon: <Info className="w-3.5 h-3.5 text-slate-500" />,
          categoryTitle: 'Still Taking Shape',
          categorySub: 'Unobserved Profile Runway',
          cardStyle: 'bg-slate-50/50 border-dashed border-slate-300 hover:border-slate-400 shadow-none',
          topBanner: 'bg-slate-300 h-1 rounded-t-2xl',
          calloutBg: 'bg-slate-100/70 border-slate-200 text-slate-700',
          calloutIcon: <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />,
          pillClass: 'bg-slate-200/80 text-slate-700 border-slate-300'
        };
    }
  };

  const config = getCategoryConfig(category);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 flex flex-col ${config.cardStyle}`}
    >
      {/* Top Color Accent Ribbon */}
      <div className={config.topBanner} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={config.badgeVariant} size="sm" icon={config.icon}>
                {translateUi(config.categoryTitle, language)}
              </Badge>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/60">
                {translateUi(COMPETENCY_LABELS[item.competency] || item.competency, language)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                • {translateUi(config.categorySub, language)}
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-extrabold text-brand-navy leading-snug pt-0.5">
              {translateUi(item.label, language)}
            </h4>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-3">
            {/* Mentor Explanation Callout */}
            <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed ${config.calloutBg}`}>
              {config.calloutIcon}
              <div>
                <span className="font-bold"><LocalizedText en={"Why this insight:"} />{' '}</span>
                <span>{translateUi(item.explanation || item.evidence || '', language)}</span>
              </div>
            </div>

            {/* Supporting Evidence Source Badges */}
            {item.supporting_sources && item.supporting_sources.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span className="font-bold text-slate-700"><LocalizedText en={"Observed Evidence:"} /></span>
                {item.supporting_sources.map((src, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border ${config.pillClass}`}
                  >
                    {src}
                  </span>
                ))}
              </div>
            )}

            {/* User Context Note if exists */}
            {item.userContextNote && (
              <div className="text-xs sm:text-sm bg-blue-50/80 border border-blue-200 p-3 rounded-xl text-blue-950 font-medium">
                <span className="font-bold text-blue-900"><LocalizedText en={"Your Added Context:"} />{' '}</span>
                {item.userContextNote}
              </div>
            )}

            {/* Agreement / Disagree / Add Context interactive controls */}
            <div className="pt-1">
              <AgreementButtons
                initialState={item.userFeedback}
                initialNote={item.userContextNote}
                onFeedbackChange={onFeedbackChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
