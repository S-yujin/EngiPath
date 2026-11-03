import { LocalizedText, uiAttr, translateUi } from '../../i18n/uiText';
import { localizeCareerTitle } from '../../i18n/careerLocalization';
import { useApp } from '../../context/AppContext';
import React from 'react';
import { motion } from 'framer-motion';
import { useConfidenceScore } from '../../hooks/useConfidenceScore';
import { ShieldCheck, TrendingUp, Sparkles, Target, Compass } from 'lucide-react';

interface ConfidenceScoreProps {
  size?: 'compact' | 'standard' | 'large';
  showRankingBadge?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({
  size = 'standard',
  showRankingBadge = true,
  showSubtitle = true,
  className = ''
}) => {
  const { matchPercentage, ranking, selectedJob } = useConfidenceScore();
  const { language } = useApp();

  const radius = size === 'large' ? 64 : size === 'standard' ? 52 : 38;
  const strokeWidth = size === 'large' ? 10 : size === 'standard' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (matchPercentage / 100) * circumference;

  // Determine qualitative alignment level
  const getAlignmentLevel = (pct: number) => {
    if (pct >= 75) {
      return {
        label: 'Highly Likely Match',
        sublabel: 'Strong Capability Alignment',
        color: '#10B981', // emerald-500
        bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      };
    }
    if (pct >= 50) {
      return {
        label: 'Moderate Alignment',
        sublabel: 'Solid Foundation with Growth Runway',
        color: '#F59E0B', // amber-500
        bgClass: 'bg-amber-50 text-amber-900 border-amber-200',
        icon: <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
      };
    }
    return {
      label: 'Emerging Runway',
      sublabel: 'Foundational Exploration Phase',
      color: '#3B82F6', // blue-500
      bgClass: 'bg-blue-50 text-blue-900 border-blue-200',
      icon: <Compass className="w-3.5 h-3.5 text-blue-600" />
    };
  };

  const alignment = getAlignmentLevel(matchPercentage);

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-glass transition-all duration-300 ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* SVG Circular Progress Meter */}
        <svg
          width={(radius + strokeWidth) * 2}
          height={(radius + strokeWidth) * 2}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated score circle */}
          <motion.circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke={alignment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Inner Number Display with plenty of breathing space */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <motion.span
            key={matchPercentage}
            initial={{ scale: 0.85, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-black tracking-tight text-brand-navy leading-none ${
              size === 'large'
                ? 'text-4xl'
                : size === 'standard'
                ? 'text-2xl sm:text-3xl'
                : 'text-xl'
            }`}
          >
            {matchPercentage}%
          </motion.span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
            <LocalizedText en={"Role Fit"} />{' '}</span>
        </div>
      </div>

      {showRankingBadge && (
        <div className="mt-3 flex flex-col items-center gap-1">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${alignment.bgClass}`}
          >
            {alignment.icon}
            <span>{translateUi(alignment.label, language)}</span>
          </div>
        </div>
      )}

      {showSubtitle && (
        <p className="mt-2 text-[11px] text-slate-500 text-center font-medium leading-tight">
          <LocalizedText en={"Calibrated for"} />{' '}<strong className="text-slate-700">{localizeCareerTitle(selectedJob?.id || '', selectedJob?.title || 'Target Role', language)}</strong> <LocalizedText en={"across coursework & reflection signals."} />{' '}</p>
      )}
    </div>
  );
};
