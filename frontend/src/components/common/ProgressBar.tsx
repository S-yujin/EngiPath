import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  sublabel?: string;
  color?: string;
  height?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  sublabel,
  color = 'from-brand-teal to-brand-navy',
  height = 'md',
  showPercentage = true,
  className = ''
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5 text-xs">
          {label && <span className="font-semibold text-slate-700">{label}</span>}
          {sublabel && <span className="text-slate-500">{sublabel}</span>}
          {showPercentage && <span className="font-bold text-brand-navy ml-auto">{clamped}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden p-0.5 ${heightClasses[height]}`}>
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
