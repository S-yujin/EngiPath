import React from 'react';

export type BadgeVariant =
  | 'strength'
  | 'overlooked'
  | 'validate'
  | 'development'
  | 'insufficient'
  | 'low'
  | 'medium'
  | 'high'
  | 'gold'
  | 'navy'
  | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  size = 'md',
  className = ''
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    strength: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/20',
    overlooked: 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400/20',
    validate: 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/20',
    development: 'bg-orange-50 text-orange-800 border-orange-300 ring-1 ring-orange-400/20',
    insufficient: 'bg-slate-100 text-slate-700 border-slate-300 ring-1 ring-slate-400/10',
    low: 'bg-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
    high: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    gold: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
    navy: 'bg-slate-900 text-white border-slate-700',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3.5 py-1.5 font-medium'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-all ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="inline-block">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
