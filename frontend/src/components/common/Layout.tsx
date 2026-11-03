import { LocalizedText, uiAttr } from '../../i18n/uiText';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OptionsDrawer } from './OptionsDrawer';
import { WaveSpectrogramBackground } from './WaveSpectrogramBackground';
import { RealTimeProgressBar } from './RealTimeProgressBar';
import { FloatingRobotAvatar } from './FloatingRobotAvatar';
import { Check, ShieldCheck, SlidersHorizontal, Languages, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentStep, setCurrentStep, isPlanSaved, setIsPlanSaved, profile, language, setLanguage, isAdminMode, toggleAdminMode, resetAll, t } = useApp();
  const [scrolledPastHero, setScrolledPastHero] = useState<boolean>(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);

  // Auto-dismiss plan saved toast after 3 seconds
  useEffect(() => {
    if (isPlanSaved) {
      const timer = setTimeout(() => {
        setIsPlanSaved(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPlanSaved, setIsPlanSaved]);

  useEffect(() => {
    const handleScroll = () => {
      if (currentStep === 0 || currentStep === 1) {
        const threshold = window.innerHeight * 1.5;
        if (window.scrollY >= threshold) {
          setScrolledPastHero(true);
        } else if (window.scrollY < threshold - 120) {
          setScrolledPastHero(false);
        }
      } else {
        setScrolledPastHero(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentStep]);

  const scrollToHeroTop = () => {
    setCurrentStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetProgress = () => {
    resetAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasHero = currentStep === 0;
  const showNav = !hasHero;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FC] text-slate-800 antialiased selection:bg-brand-teal selection:text-white">
      {/* Floating Modern Rounded Top Navigation Bar, Reset & Translation Bubbles */}
      <header
        className={`fixed top-4 inset-x-3 sm:inset-x-6 lg:inset-x-8 max-w-7xl mx-auto z-40 flex items-center gap-2.5 sm:gap-3.5 transition-all duration-300 ${
          showNav
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        {/* Main Navbar Capsule */}
        <div className="flex-1 rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-lg shadow-slate-900/5 px-4 sm:px-7 h-16 sm:h-17 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Clean Brand Logo (No bubble card, pure logo image) */}
          <div
            className="flex items-center cursor-pointer group flex-shrink-0"
            onClick={scrollToHeroTop}
            title={uiAttr("Return to Hero Top")}
          >
            <img
              src="/engipath-mark.svg"
              alt={uiAttr("Engipath Logo")}
              className="h-11 sm:h-14 w-auto object-contain group-hover:scale-106 transition-transform duration-200"
            />
          </div>

          {/* Center: Continuous Real-Time Progress Bar (Replaces Number Stepper) */}
          <RealTimeProgressBar className="flex-1 mx-1 sm:mx-4" />

          {/* Right: Active Profile, Admin Mode & Options Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {profile.name && (
              <div className="hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                <div className="w-5.5 h-5.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {profile.name.charAt(0)}
                </div>
                <span className="truncate max-w-[100px] font-bold text-slate-900">
                  {profile.name}
                </span>
              </div>
            )}

            <button
              onClick={() => setIsOptionsOpen(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all group cursor-pointer"
              title={uiAttr("Open settings and options")}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-300 group-hover:rotate-12 transition-transform" />
              <span>{t('nav.options', 'Options')}</span>
            </button>
          </div>
        </div>

        {/* Standalone Aligned Reset Progress Bubble */}
        <button
          onClick={handleResetProgress}
          className="h-16 sm:h-17 px-3.5 sm:px-4.5 rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200/80 hover:border-rose-300 text-slate-700 hover:text-rose-600 font-extrabold text-xs shadow-lg shadow-slate-900/5 hover:shadow-xl flex items-center gap-2 transition-all cursor-pointer group flex-shrink-0"
          title={uiAttr("Reset all progress and return to start")}
        >
          <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-100 group-hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-transform group-hover:-rotate-90 duration-300">
            <RotateCcw className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold hidden md:inline">
            {t('nav.reset', 'Reset')}
          </span>
        </button>

        {/* Standalone Aligned Translation Bubble (Same Height & Center Baseline) */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="h-16 sm:h-17 px-4 sm:px-4.5 rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200/80 hover:border-purple-300 text-purple-950 font-extrabold text-xs shadow-lg shadow-slate-900/5 hover:shadow-xl flex items-center gap-2 transition-all cursor-pointer group"
            title={uiAttr("Translate platform (English, 中文, 한국어, Español, Français, Deutsch)")}
          >
            <div className="w-6 h-6 rounded-full bg-purple-100/80 flex items-center justify-center text-purple-700 group-hover:rotate-12 transition-transform">
              <Languages className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">
              {language === 'en'
                ? 'EN'
                : language === 'zh'
                ? '中文'
                : language === 'ko'
                ? '한국어'
                : language === 'es'
                ? 'ES'
                : language === 'fr'
                ? 'FR'
                : 'DE'}
            </span>
          </button>

          {/* Language Popover Dropdown */}
          <AnimatePresence>
            {isLangMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsLangMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-purple-100 p-1.5 z-50 space-y-1"
                >
                  {[
                    { code: 'ko', label: '한국어', flag: '🇰🇷' },
                    { code: 'en', label: 'English', flag: '🇺🇸' },
                    { code: 'zh', label: '中文 (简体)', flag: '🇨🇳' },
                    { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
                    { code: 'fr', label: 'Français (French)', flag: '🇫🇷' },
                    { code: 'de', label: 'Deutsch (German)', flag: '🇩🇪' }
                  ].map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setLanguage(item.code as any);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        language === item.code
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-purple-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.flag}</span>
                        <span>{item.label}</span>
                      </span>
                      {language === item.code && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Slide-out Options & Navigation Drawer */}
      <OptionsDrawer
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
      />

      {/* Plan Saved Toast Alert */}
      <AnimatePresence>
        {isPlanSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            onClick={() => setIsPlanSaved(false)}
            className="fixed top-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl border border-emerald-400 cursor-pointer transition-all"
            title={uiAttr("Click to dismiss")}
          >
            <ShieldCheck className="w-5 h-5 text-emerald-100 shrink-0" />
            <div>
              <div className="text-xs font-bold">{t('nav.planSaved', 'Action Plan Saved')}</div>
              <div className="text-[11px] text-emerald-100">
                {t('nav.planSavedDesc', 'Your customized engineering blueprint is secured.')}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPlanSaved(false);
              }}
              className="text-emerald-200 hover:text-white ml-2 p-1 font-bold text-xs"
              title={uiAttr("Close")}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Ambient Purple Character Wave Spectrogram Soundboard Background */}
      {!hasHero && <WaveSpectrogramBackground />}

      {/* Dynamic Screen Container */}
      <main className={`relative z-10 flex-1 w-full ${hasHero ? 'pt-0' : 'pt-26 sm:pt-28'}`}>
        {children}
      </main>

      {/* Floating Interactive 2D Layered Robot Companion (Screens 1 to 6) */}
      {!hasHero && <FloatingRobotAvatar />}
    </div>
  );
};
