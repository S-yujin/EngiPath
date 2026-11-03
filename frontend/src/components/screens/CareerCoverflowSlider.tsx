import { LocalizedText, uiAttr, translateUi } from '../../i18n/uiText';
import { localizeCareerTitle, localizeCareerDescription, localizeCareerCategory, localizeCareerSalary } from '../../i18n/careerLocalization';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DreamJob } from '../../types';
import { useApp } from '../../context/AppContext';
import { calculateMatchPercentage } from '../../utils/scoring';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  Terminal,
  Network,
  Briefcase,
  Activity,
  Zap,
  SlidersHorizontal,
  HeartPulse,
  Dumbbell,
  TrendingUp,
  Palette,
  Scale,
  GraduationCap,
  FlaskConical,
  Leaf,
  Brain
} from 'lucide-react';

interface CareerCoverflowSliderProps {
  jobs: DreamJob[];
  selectedJob: DreamJob | null;
  onSelectJob: (job: DreamJob) => void;
  onConfirm: () => void;
  t: (key: string, fallback?: string) => string;
  matchPercentage?: number;
  userScores?: any;
}

// Universal visual asset & media resolver across all disciplines
export const getRoleMedia = (category: string = '', title: string = '', id: string = '') => {
  const text = (category + ' ' + title + ' ' + id).toLowerCase();

  // 1. Nursing & Clinical Healthcare
  if (text.includes('nurs') || text.includes('clinic') || text.includes('patient') || text.includes('hospital') || text.includes('care') || text.includes('therap') || text.includes('midwi')) {
    return {
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      metric: '$94,000 / yr',
      matchScore: 94,
      icon: <HeartPulse className="w-4 h-4 text-rose-600" />,
      accent: 'text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-100'
    };
  }

  // 2. Sports Science, Kinesiology & Human Performance
  if (text.includes('sport') || text.includes('kinesiolog') || text.includes('athlet') || text.includes('fitness') || text.includes('exercise') || text.includes('physio') || text.includes('rehab')) {
    return {
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      metric: '$88,000 / yr',
      matchScore: 92,
      icon: <Dumbbell className="w-4 h-4 text-orange-600" />,
      accent: 'text-orange-600',
      badgeBg: 'bg-orange-50 text-orange-700 border-orange-100'
    };
  }

  // 3. Business, Finance, Economics & Management
  if (text.includes('business') || text.includes('financ') || text.includes('consult') || text.includes('account') || text.includes('econom') || text.includes('market') || text.includes('invest') || text.includes('bank') || text.includes('entrepreneur')) {
    return {
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      metric: '$118,000 / yr',
      matchScore: 93,
      icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
      accent: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
  }

  // 4. Design, UI/UX & Creative Media
  if (text.includes('design') || text.includes('ux') || text.includes('ui') || text.includes('art') || text.includes('media') || text.includes('graphic') || text.includes('visual') || text.includes('creative') || text.includes('animat')) {
    return {
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
      metric: '$98,000 / yr',
      matchScore: 91,
      icon: <Palette className="w-4 h-4 text-violet-600" />,
      accent: 'text-violet-600',
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-100'
    };
  }

  // 5. Psychology, Cognitive & Behavioral Sciences
  if (text.includes('psychol') || text.includes('behavior') || text.includes('social') || text.includes('counsel') || text.includes('cognit') || text.includes('mental')) {
    return {
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
      metric: '$86,000 / yr',
      matchScore: 90,
      icon: <Brain className="w-4 h-4 text-purple-600" />,
      accent: 'text-purple-600',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-100'
    };
  }

  // 6. Law, Legal Studies & Public Policy
  if (text.includes('law') || text.includes('legal') || text.includes('policy') || text.includes('govern') || text.includes('justice') || text.includes('crimin') || text.includes('advoc')) {
    return {
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      metric: '$124,000 / yr',
      matchScore: 92,
      icon: <Scale className="w-4 h-4 text-amber-700" />,
      accent: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-100'
    };
  }

  // 7. Education, Teaching & Academia
  if (text.includes('educat') || text.includes('teach') || text.includes('pedagog') || text.includes('curriculum') || text.includes('profess') || text.includes('school')) {
    return {
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
      metric: '$82,000 / yr',
      matchScore: 89,
      icon: <GraduationCap className="w-4 h-4 text-blue-600" />,
      accent: 'text-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100'
    };
  }

  // 8. Biological, Chemistry & Life Sciences
  if (text.includes('bio') || text.includes('chem') || text.includes('genom') || text.includes('biochem') || text.includes('microbiol') || text.includes('biotech')) {
    return {
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
      metric: '$106,000 / yr',
      matchScore: 91,
      icon: <FlaskConical className="w-4 h-4 text-emerald-600" />,
      accent: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
  }

  // 9. Environmental Science, CleanTech & Sustainability
  if (text.includes('environ') || text.includes('ecolog') || text.includes('sustain') || text.includes('climate') || text.includes('clean') || text.includes('solar') || text.includes('wind') || text.includes('geolog')) {
    return {
      image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
      metric: '$112,000 / yr',
      matchScore: 89,
      icon: <Leaf className="w-4 h-4 text-emerald-600" />,
      accent: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
  }

  // 10. Cybersecurity, Infosec & Forensics
  if (text.includes('secur') || text.includes('cyber') || text.includes('forensic') || text.includes('crypt')) {
    return {
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      metric: '$126,000 / yr',
      matchScore: 94,
      icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
      accent: 'text-indigo-600',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    };
  }

  // 11. Aerospace, Aeronautics & Rocket Propulsion
  if (text.includes('aero') || text.includes('propuls') || text.includes('space') || text.includes('orbit') || text.includes('rocket') || text.includes('satellit')) {
    return {
      image: 'https://images.unsplash.com/photo-1517976487502-570a256df2a5?auto=format&fit=crop&w=800&q=80',
      metric: '$135,000 / yr',
      matchScore: 92,
      icon: <Zap className="w-4 h-4 text-sky-600" />,
      accent: 'text-sky-600',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-100'
    };
  }

  // 12. AI Hardware, Microelectronics & Silicon
  if (text.includes('ai-hardware') || text.includes('semiconduct') || text.includes('chip') || text.includes('hardware') || text.includes('silicon') || text.includes('circuit')) {
    return {
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      metric: '$142,000 / yr',
      matchScore: 95,
      icon: <Cpu className="w-4 h-4 text-purple-600" />,
      accent: 'text-purple-600',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-100'
    };
  }

  // 13. Software Engineering, Computer Science & Cloud Architecture
  if (text.includes('software') || text.includes('program') || text.includes('developer') || text.includes('system') || text.includes('cloud') || text.includes('full stack') || text.includes('backend') || text.includes('frontend')) {
    return {
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      metric: '$130,000 / yr',
      matchScore: 93,
      icon: <Terminal className="w-4 h-4 text-teal-600" />,
      accent: 'text-teal-600',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-100'
    };
  }

  // 14. Data Science, Machine Learning & Analytics
  if (text.includes('data') || text.includes('ai') || text.includes('machine learn') || text.includes('deep learn') || text.includes('statistic')) {
    return {
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      metric: '$132,000 / yr',
      matchScore: 94,
      icon: <Activity className="w-4 h-4 text-cyan-600" />,
      accent: 'text-cyan-600',
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-100'
    };
  }

  // 15. Civil, Urban & Smart Infrastructure
  if (text.includes('infrastruct') || text.includes('civil') || text.includes('urban') || text.includes('smart city') || text.includes('construct') || text.includes('structur')) {
    return {
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      metric: '$115,000 / yr',
      matchScore: 88,
      icon: <Network className="w-4 h-4 text-amber-600" />,
      accent: 'text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100'
    };
  }

  // 16. Mechanical Design & Precision Manufacturing
  if (text.includes('mechanic') || text.includes('manufactur') || text.includes('cad') || text.includes('mechatron') || text.includes('automotive')) {
    return {
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      metric: '$110,000 / yr',
      matchScore: 87,
      icon: <Briefcase className="w-4 h-4 text-slate-700" />,
      accent: 'text-slate-700',
      badgeBg: 'bg-slate-50 text-slate-700 border-slate-200'
    };
  }

  // 17. Robotics & Intelligent Automation (Default fallback)
  return {
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    metric: '$128,000 / yr',
    matchScore: 94,
    icon: <Cpu className="w-4 h-4 text-brand-teal" />,
    accent: 'text-brand-teal',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-100'
  };
};

export const CareerCoverflowSlider: React.FC<CareerCoverflowSliderProps> = ({
  jobs,
  selectedJob,
  onSelectJob,
  onConfirm,
  t,
  matchPercentage,
  userScores
}) => {
  const initialIndex = Math.max(
    0,
    jobs.findIndex((j) => j.id === selectedJob?.id)
  );
  const { language } = useApp();
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex >= 0 ? initialIndex : 0);
  const containerRef = useRef<HTMLDivElement>(null);

  // When jobs array changes (e.g. sorted by Highest Fit or Highest Pay), reset active card to #1
  useEffect(() => {
    setActiveIndex(0);
    if (jobs.length > 0) {
      onSelectJob(jobs[0]);
    }
  }, [jobs]);

  const slideNext = useCallback(() => {
    setActiveIndex((prev) => {
      const next = prev < jobs.length - 1 ? prev + 1 : 0;
      if (jobs[next]) {
        onSelectJob(jobs[next]);
      }
      return next;
    });
  }, [jobs, onSelectJob]);

  const slidePrev = useCallback(() => {
    setActiveIndex((prev) => {
      const prevIdx = prev > 0 ? prev - 1 : jobs.length - 1;
      if (jobs[prevIdx]) {
        onSelectJob(jobs[prevIdx]);
      }
      return prevIdx;
    });
  }, [jobs, onSelectJob]);

  const handleCardClick = (index: number) => {
    if (index !== activeIndex && jobs[index]) {
      setActiveIndex(index);
      onSelectJob(jobs[index]);
    }
  };

  // Keyboard navigation (Left / Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        slidePrev();
      } else if (e.key === 'ArrowRight') {
        slideNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slideNext, slidePrev]);

  if (!jobs || jobs.length === 0) {
    return null;
  }

  return (
    <div className="w-full relative select-none py-2">
      {/* 3D Coverflow Viewport Container with Generous Breathing Room */}
      <div
        ref={containerRef}
        className="relative w-full h-[480px] sm:h-[515px] flex items-center justify-center overflow-hidden"
        style={{ perspective: '1400px' }}
      >
        {/* Floating Left / Right Chevron Controls */}
        <button
          onClick={slidePrev}
          aria-label={uiAttr("Previous Career Card")}
          className="absolute left-2 sm:left-6 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl flex items-center justify-center text-slate-700 hover:text-brand-navy hover:scale-110 active:scale-95 transition-all cursor-pointer group"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={slideNext}
          aria-label={uiAttr("Next Career Card")}
          className="absolute right-2 sm:right-6 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl flex items-center justify-center text-slate-700 hover:text-brand-navy hover:scale-110 active:scale-95 transition-all cursor-pointer group"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* 3D Sliding Cards Array */}
        <div className="relative w-full max-w-6xl h-full flex items-center justify-center">
          {jobs.map((job, index) => {
            const offset = index - activeIndex;
            const isCenter = offset === 0;
            const media = getRoleMedia(job.category, job.title, job.id);

            // Calculate 3D perspective transforms with generous spacing
            let xOffset = 0;
            let rotateY = 0;
            let scale = 1;
            let zIndex = 30;
            let opacity = 1;
            let brightness = 1;

            if (isCenter) {
              xOffset = 0;
              rotateY = 0;
              scale = 1.04;
              zIndex = 35;
              opacity = 1;
              brightness = 1;
            } else if (offset < 0) {
              // Left side cards: Spaced out so adjacent titles & metrics are clearly visible
              const absOffset = Math.abs(offset);
              xOffset = -absOffset * 230 - 85;
              rotateY = Math.min(38, 22 + absOffset * 7);
              scale = Math.max(0.68, 0.90 - absOffset * 0.10);
              zIndex = 30 - absOffset * 5;
              opacity = Math.max(0.25, 0.95 - absOffset * 0.25);
              brightness = Math.max(0.72, 0.92 - absOffset * 0.10);
            } else {
              // Right side cards: Spaced out so adjacent titles & metrics are clearly visible
              const absOffset = Math.abs(offset);
              xOffset = absOffset * 230 + 85;
              rotateY = -Math.min(38, 22 + absOffset * 7);
              scale = Math.max(0.68, 0.90 - absOffset * 0.10);
              zIndex = 30 - absOffset * 5;
              opacity = Math.max(0.25, 0.95 - absOffset * 0.25);
              brightness = Math.max(0.72, 0.92 - absOffset * 0.10);
            }

            // Hide cards positioned too far out
            if (Math.abs(offset) > 3) {
              return null;
            }

            const fitScore = userScores && job.targetScores
              ? calculateMatchPercentage(userScores, job.targetScores)
              : media.matchScore;

            return (
              <motion.div
                key={job.id}
                drag={isCenter ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                  const swipeThreshold = 40;
                  const velocityThreshold = 300;
                  if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
                    slideNext();
                  } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
                    slidePrev();
                  }
                }}
                onClick={() => handleCardClick(index)}
                animate={{
                  x: xOffset,
                  rotateY: rotateY,
                  scale: scale,
                  zIndex: zIndex,
                  opacity: opacity,
                  filter: `brightness(${brightness})`
                }}
                transition={{
                  type: 'spring',
                  stiffness: 175,
                  damping: 26,
                  mass: 0.75
                }}
                style={{
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'center center'
                }}
                className={`absolute w-[290px] sm:w-[330px] md:w-[355px] h-[435px] sm:h-[460px] bg-white rounded-3xl overflow-hidden shadow-2xl border transition-shadow cursor-pointer ${
                  isCenter
                    ? 'ring-2 ring-brand-teal/50 border-slate-300/80 shadow-[0_20px_50px_rgba(0,0,0,0.18)] cursor-grab active:cursor-grabbing'
                    : 'border-slate-200/80 hover:border-brand-teal/40'
                }`}
              >
                {/* Card Top: High Quality Domain Photo Banner */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
                  <img
                    src={media.image}
                    alt={localizeCareerTitle(job.id, job.title, language)}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  {/* Subtle Dark Vignette & Category Pill Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-md text-[10px] font-extrabold uppercase tracking-wide text-slate-800">
                    {media.icon}
                    <span className="truncate max-w-[170px]">{localizeCareerCategory(job.category || 'Engineering', language)}</span>
                  </div>

                  <div className={`absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black shadow-md ${
                    isCenter
                      ? 'bg-brand-gold text-slate-950 ring-2 ring-amber-300/60 shadow-lg'
                      : 'bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/90'
                  }`}>
                    <Sparkles className={`w-3 h-3 ${isCenter ? 'text-slate-950' : 'text-amber-500'}`} />
                    <span>{fitScore}<LocalizedText en={"% Fit"} /></span>
                  </div>
                </div>

                {/* Card Bottom: Content, Pricing / Metrics & Summary */}
                <div className="p-4 sm:p-5 flex flex-col justify-between h-[calc(100%-192px)] sm:h-[calc(100%-208px)] text-left bg-white">
                  <div>
                    {/* Role Title & Rank Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 line-clamp-1 tracking-tight">
                        {localizeCareerTitle(job.id, job.title, language)}
                      </h3>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80 flex-shrink-0">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Prominent Highlighted Metric (Cyan/Teal font from Image 1) */}
                    <div className="text-base sm:text-lg font-extrabold text-[#0284c7] mt-0.5">
                      {localizeCareerSalary(media.metric, language)}
                    </div>

                    {/* Description Paragraph */}
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 sm:line-clamp-3 leading-relaxed font-normal">
                      {localizeCareerDescription(job.id, job.description, language)}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isCenter ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirm();
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer group/btn"
                      >
                        <span>{t('careers.selectRole', 'Select Career')}</span>
                        <ArrowRight className="w-4 h-4 text-amber-400 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    ) : (
                      <div className="w-full py-1.5 text-center text-xs font-bold text-slate-400">
                        <LocalizedText en={"Click to focus"} />{' '}</div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Interactive Dot & Pill Stepper Controls */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {jobs.map((job, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={job.id}
              onClick={() => setActiveIndex(idx)}
              className={`transition-all duration-250 cursor-pointer rounded-full ${
                isActive
                  ? 'w-8 h-2.5 bg-slate-900 shadow-xs'
                  : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              title={localizeCareerTitle(job.id, job.title, language)}
              aria-label={language === "ko" ? `${idx + 1}번째 진로 카드로 이동` : `Go to slide ${idx + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
};
