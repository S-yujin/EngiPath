import { LocalizedText, uiAttr } from '../../i18n/uiText';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MatrixCharacterBackground } from '../common/MatrixCharacterBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export const Screen0_Hero: React.FC = () => {
  const { setCurrentStep } = useApp();
  const [isFading, setIsFading] = useState<boolean>(false);

  const handleStart = () => {
    if (isFading) return;
    setIsFading(true);

    // After 650ms smooth fade, transition to Step 1 (Profile Form)
    setTimeout(() => {
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 650);
  };

  return (
    <div className="w-full h-screen relative select-none overflow-hidden bg-[#FAF9FC] flex flex-col items-center justify-center">
      {/* Centered Rigid Multi-Lingual Matrix Background ("万途" ↔ "OneTool" ↔ "원툴") */}
      <div className="absolute inset-0 pointer-events-none">
        <MatrixCharacterBackground opacity={0.88} />
      </div>

      {/* Gentle Violet Fade Overlay on Exit */}
      <AnimatePresence>
        {isFading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeInOut' }}
            className="fixed inset-0 pointer-events-none z-30 bg-[#FAF9FC]/80 backdrop-blur-[1px]"
          />
        )}
      </AnimatePresence>

      {/* Central Interactive Hero Presentation */}
      <motion.div
        animate={{
          opacity: isFading ? 0 : 1,
          scale: isFading ? 0.96 : 1
        }}
        transition={{ duration: 0.65, ease: 'easeInOut' }}
        className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto space-y-6"
      >
        {/* Floating WanTu Brand Logo */}
        <motion.div
          onClick={handleStart}
          whileHover={!isFading ? { scale: 1.05 } : undefined}
          whileTap={!isFading ? { scale: 0.96 } : undefined}
          className="relative cursor-pointer group"
        >
          {/* Ambient glowing halo behind logo */}
          <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-purple-500/25 via-fuchsia-400/25 to-teal-400/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

          <motion.div
            animate={
              !isFading
                ? {
                    y: [0, -6, 0],
                    filter: [
                      'drop-shadow(0 10px 20px rgba(147, 51, 234, 0.15))',
                      'drop-shadow(0 20px 35px rgba(168, 85, 247, 0.28))',
                      'drop-shadow(0 10px 20px rgba(147, 51, 234, 0.15))'
                    ]
                  }
                : undefined
            }
            transition={{
              duration: 3.2,
              repeat: !isFading ? Infinity : 0,
              ease: 'easeInOut'
            }}
            className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center p-1 relative z-10"
          >
            <img
              src="/engipath-mark.svg"
              alt={uiAttr("Engipath Logo")}
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </motion.div>
        </motion.div>

        {/* Typography: Headline (H1) */}
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            <LocalizedText en={"Map Your Skills."} />{' '}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
              <LocalizedText en={"Find Your Path."} />{' '}</span>{' '}
            <LocalizedText en={"Land the Job."} />{' '}</h1>
        </div>

        {/* Playful Interactive Call-to-Action Button (Lighter Vibrant Purple) */}
        <motion.div
          animate={{ opacity: isFading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="pt-3 pointer-events-auto"
        >
          <motion.button
            onClick={handleStart}
            whileHover={{
              scale: 1.06,
              rotate: -1.5,
              boxShadow: '0 20px 40px -5px rgba(147, 51, 234, 0.45)'
            }}
            whileTap={{
              scale: 0.96,
              rotate: 1
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-purple-500/25 border border-purple-300/40 cursor-pointer overflow-hidden transition-all"
          >
            {/* Shimmer flare effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span className="tracking-tight"><LocalizedText en={"Start Your Journey"} /></span>
            <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1.5 transition-transform" />
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};
