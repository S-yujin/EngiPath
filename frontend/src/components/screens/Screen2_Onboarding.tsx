import { LocalizedText, uiAttr } from '../../i18n/uiText';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { OnboardingPayload } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  BookOpen,
  Trash2,
  AlertCircle,
  User
} from 'lucide-react';

export const Screen2_Onboarding: React.FC = () => {
  const {
    profile,
    updateProfile,
    simulateTranscriptUpload,
    clearTranscript,
    submitOnboarding,
    onboardingStatus,
    onboardingError,
    setCurrentStep,
    t,
    isAutoPilotRunning,
    autoPilotStep,
    cancelDemoAutoPilot
  } = useApp();

  const [isSimulatingUpload, setIsSimulatingUpload] = useState<boolean>(false);
  const [intro, setIntro] = useState<string>(profile.intro || '');
  const [skillsInput, setSkillsInput] = useState<string>('');
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [interestsInput, setInterestsInput] = useState<string>('');
  const [interests, setInterests] = useState<string[]>(profile.interests || []);

  // Sync with profile updates (including auto-pilot live typing)
  useEffect(() => {
    if (profile.intro !== undefined) {
      setIntro(profile.intro);
    }
  }, [profile.intro]);

  useEffect(() => {
    if (profile.skills) {
      setSkills(profile.skills);
    }
  }, [profile.skills]);

  useEffect(() => {
    if (profile.interests) {
      setInterests(profile.interests);
    }
  }, [profile.interests]);

  // Realistic progressive loading bar state
  const [loadingProgress, setLoadingProgress] = useState<number>(18);
  const [loadingStage, setLoadingStage] = useState<number>(1);

  useEffect(() => {
    if (onboardingStatus === 'loading') {
      setLoadingProgress(18);
      setLoadingStage(1);
      const t1 = setTimeout(() => {
        setLoadingProgress(52);
        setLoadingStage(2);
      }, 700);
      const t2 = setTimeout(() => {
        setLoadingProgress(84);
        setLoadingStage(3);
      }, 1600);
      const t3 = setTimeout(() => {
        setLoadingProgress(96);
        setLoadingStage(3);
      }, 2600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setLoadingProgress(18);
      setLoadingStage(1);
    }
  }, [onboardingStatus]);

  const hasUserData =
    !!profile.major ||
    intro.trim().length > 0 ||
    skills.length > 0 ||
    interests.length > 0 ||
    profile.transcriptUploaded;

  const addChip = (list: string[], setList: (v: string[]) => void, value: string) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
  };

  const buildPayload = (): OnboardingPayload => {
    const finalSkills = [...skills];
    if (skillsInput.trim() && !finalSkills.includes(skillsInput.trim())) {
      finalSkills.push(skillsInput.trim());
    }
    const finalInterests = [...interests];
    if (interestsInput.trim() && !finalInterests.includes(interestsInput.trim())) {
      finalInterests.push(interestsInput.trim());
    }
    return {
      major: profile.major,
      year: profile.year,
      intro: intro.trim() || undefined,
      skills: finalSkills.length > 0 ? finalSkills : undefined,
      interests: finalInterests.length > 0 ? finalInterests : undefined,
      experiences: profile.transcriptData?.courses
        ? [
            {
              type: 'academic_project',
              title: 'Coursework',
              description: profile.transcriptData.courses.map((c) => `${c.name} (${c.grade})`).join(', '),
              tools_used: []
            }
          ]
        : []
    };
  };

  const handleSubmit = async () => {
    updateProfile({ intro });
    await submitOnboarding(buildPayload());
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleYearChange = (year: number) => {
    updateProfile({ year });
  };

  const handleMajorSelect = (major: string) => {
    updateProfile({ major });
  };

  const handleUploadClick = () => {
    setIsSimulatingUpload(true);
    setTimeout(() => {
      simulateTranscriptUpload();
      setIsSimulatingUpload(false);
    }, 900);
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-transparent flex flex-col justify-center py-6">
      {/* 🚀 Floating Auto-Pilot Active Banner */}
      <AnimatePresence>
        {isAutoPilotRunning && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="sticky top-20 z-50 max-w-xl mx-auto px-4 py-2.5 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-cyan-400/60 text-white shadow-2xl shadow-cyan-950/60 flex items-center justify-between gap-3 text-xs mb-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-extrabold text-cyan-300"><LocalizedText en={"Engipath Auto-Pilot Active"} /></span>
              <span className="text-[11px] text-slate-300">
                {autoPilotStep === 'name' && '• Calibrating Name (Johnny)'}
                {autoPilotStep === 'major' && '• Calibrating Major (AI)'}
                {autoPilotStep === 'year' && '• Setting Standing (Year 4)'}
                {autoPilotStep === 'about' && '• Writing Project Focus'}
                {autoPilotStep === 'skills' && '• Injecting Technical Skills'}
                {autoPilotStep === 'interests' && '• Mapping Career Trajectories'}
                {autoPilotStep === 'transcript' && '• OCR Coursework Verification'}
                {autoPilotStep === 'submit' && '• Finalizing Calibration & Curating Careers'}
              </span>
            </div>
            <button
              type="button"
              onClick={cancelDemoAutoPilot}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold cursor-pointer transition-colors"
            >
              <LocalizedText en={"Cancel (ESC)"} />{' '}</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 ACADEMIC CONTEXT FORM (Step 1 of 6) */}
      <section
        id="academic-context-section"
        className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 w-full space-y-4"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-brand-navy text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
            <span>{t('onboarding.badge', 'Step 1 of 6')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            {t('onboarding.title', 'Tell us about your engineering journey')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            {t('onboarding.subtitle', 'Calibrate your baseline and curate personalized career directions.')}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
          {/* Student Name, Degree / Major, & Year */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Student Name */}
            <div id="demo-field-name" className={`rounded-xl transition-all duration-300 ${autoPilotStep === 'name' ? 'ring-2 ring-cyan-400 bg-cyan-50/40 p-1 -m-1 shadow-lg shadow-cyan-400/20' : ''}`}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('onboarding.name', 'YOUR NAME')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-brand-teal" />
                </div>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  placeholder={t('onboarding.namePlaceholder', 'e.g. Cherry')}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 2. Degree / Major (Text Box) */}
            <div id="demo-field-major" className={`rounded-xl transition-all duration-300 ${autoPilotStep === 'major' ? 'ring-2 ring-cyan-400 bg-cyan-50/40 p-1 -m-1 shadow-lg shadow-cyan-400/20' : ''}`}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('onboarding.major', 'DEGREE / MAJOR')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-4 h-4 text-brand-teal" />
                </div>
                <input
                  type="text"
                  value={profile.major}
                  onChange={(e) => handleMajorSelect(e.target.value)}
                  placeholder={t('onboarding.majorPlaceholder', 'e.g. Cybersecurity')}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 3. Year of Study */}
            <div id="demo-field-year" className={`rounded-xl transition-all duration-300 ${autoPilotStep === 'year' ? 'ring-2 ring-cyan-400 bg-cyan-50/40 p-1 -m-1 shadow-lg shadow-cyan-400/20' : ''}`}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('onboarding.year', 'CURRENT YEAR OF STUDY')}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((year) => (
                  <button
                    key={year}
                    id={year === 4 ? 'demo-field-year-4' : undefined}
                    type="button"
                    onClick={() => handleYearChange(year)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${profile.year === year
                        ? 'bg-brand-navy text-white border-brand-navy shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      } ${autoPilotStep === 'year' && year === 4 ? 'ring-2 ring-cyan-400 animate-pulse' : ''}`}
                  >
                    {t(`onboarding.year${year}`, `Yr ${year}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Major Suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap -mt-2">
            <span className="text-[10px] font-medium text-slate-400">
              {t('onboarding.popularMajors', 'Popular majors:')}
            </span>
            {['Mechanical Engineering', 'Computer Science', 'Electrical Engineering', 'Bioengineering', 'Data Science & AI', 'Robotics & Automation'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleMajorSelect(m)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
              >
                {m}
              </button>
            ))}
          </div>

          {/* About You */}
          <div id="demo-field-about" className={`rounded-xl transition-all duration-300 ${autoPilotStep === 'about' ? 'ring-2 ring-cyan-400 bg-cyan-50/40 p-1 -m-1 shadow-lg shadow-cyan-400/20' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                {t('onboarding.about', 'ABOUT YOU (1-2 SENTENCES)')}
              </label>
              <span className="text-[10px] text-slate-400"><LocalizedText en={"Self-described"} /></span>
            </div>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder={t('onboarding.aboutPlaceholder', 'Brief summary of your academic background and interests...')}
              rows={2}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
            />
          </div>

          {/* Skills / Interests Chips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div id="demo-field-skills" className={`rounded-xl transition-all duration-300 ${autoPilotStep === 'skills' ? 'ring-2 ring-cyan-400 bg-cyan-50/40 p-1.5 -m-1.5 shadow-lg shadow-cyan-400/20' : ''}`}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('onboarding.skills', 'TECHNICAL SKILLS & TOOLS')}
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && skillsInput.trim()) {
                      e.preventDefault();
                      addChip(skills, setSkills, skillsInput);
                      setSkillsInput('');
                    }
                  }}
                  placeholder={t('onboarding.skillsPlaceholder', 'Type a skill and press Enter')}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                />

                {/* Quick Skills Suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-medium text-slate-400">
                    {t('onboarding.popularSkills', 'Popular:')}
                  </span>
                  {['Python', 'C++', 'CAD / SolidWorks', 'MATLAB', 'Git', 'Embedded C', 'ROS / ROS2', 'PyTorch', 'SQL', 'React'].map((s) => {
                    const isAdded = skills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addChip(skills, setSkills, s)}
                        disabled={isAdded}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-purple-100 text-purple-800 border-purple-300 opacity-60 cursor-default'
                            : 'bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 border-slate-200/80'
                        }`}
                      >
                        {isAdded ? `✓ ${s}` : `+ ${s}`}
                      </button>
                    );
                  })}
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-1">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => setSkills(skills.filter((x) => x !== s))}
                          className="hover:text-red-600 font-bold ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div id="demo-field-interests" className={`rounded-xl transition-all duration-300 ${autoPilotStep === 'interests' ? 'ring-2 ring-cyan-400 bg-cyan-50/40 p-1.5 -m-1.5 shadow-lg shadow-cyan-400/20' : ''}`}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('onboarding.interests', 'CAREER & TECHNICAL INTERESTS')}
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && interestsInput.trim()) {
                      e.preventDefault();
                      addChip(interests, setInterests, interestsInput);
                      setInterestsInput('');
                    }
                  }}
                  placeholder={t('onboarding.interestsPlaceholder', 'Type an interest and press Enter')}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                />

                {/* Quick Interests Suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-medium text-slate-400">
                    {t('onboarding.popularInterests', 'Popular:')}
                  </span>
                  {['Robotics & Automation', 'Autonomous Vehicles', 'Embedded Systems', 'Machine Learning & AI', 'Renewable Energy', 'Medical Devices', 'Aerospace & Defense', 'IoT & Smart Devices'].map((it) => {
                    const isAdded = interests.includes(it);
                    return (
                      <button
                        key={it}
                        type="button"
                        onClick={() => addChip(interests, setInterests, it)}
                        disabled={isAdded}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-teal-100 text-teal-800 border-teal-300 opacity-60 cursor-default'
                            : 'bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border-slate-200/80'
                        }`}
                      >
                        {isAdded ? `✓ ${it}` : `+ ${it}`}
                      </button>
                    );
                  })}
                </div>

                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-1">
                    {interests.map((it) => (
                      <span
                        key={it}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-teal-50 text-teal-900 border border-teal-200"
                      >
                        {it}
                        <button
                          type="button"
                          onClick={() => setInterests(interests.filter((x) => x !== it))}
                          className="hover:text-red-600 font-bold ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transcript / Coursework Simulation */}
          <div id="demo-field-transcript" className={`border-t border-slate-100 pt-3 space-y-2 rounded-xl transition-all duration-300 ${autoPilotStep === 'transcript' ? 'ring-2 ring-cyan-400 bg-cyan-50/40 p-1.5 shadow-lg shadow-cyan-400/20' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-teal" />
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  {t('onboarding.transcriptTitle', 'Coursework & Transcript OCR')}
                </span>
              </div>
              {profile.transcriptUploaded && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {t('onboarding.transcriptParsed', 'Parsed')} ({t('onboarding.transcriptGpa', 'GPA')} {profile.transcriptData?.gpa})
                </span>
              )}
            </div>

            {!profile.transcriptUploaded ? (
              <div
                onClick={handleUploadClick}
                className={`border border-dashed rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-center cursor-pointer transition-all ${isSimulatingUpload
                    ? 'border-brand-teal bg-blue-50/50'
                    : 'border-slate-300 hover:border-brand-teal bg-slate-50/50 hover:bg-white'
                  }`}
              >
                <UploadCloud className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-xs font-semibold text-slate-700">
                  {isSimulatingUpload
                    ? t('onboarding.transcriptSimulating', 'Simulating OCR & Parsing Courses...')
                    : t('onboarding.transcriptUpload', 'Click to Upload Transcript or Load Sample Courses')}
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900">
                    {t('onboarding.transcriptExtracted', 'Validated Coursework Extracted:')}
                  </span>
                  <button
                    onClick={clearTranscript}
                    className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> {t('onboarding.transcriptRemove', 'Remove')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {profile.transcriptData?.courses.map((c) => (
                    <span
                      key={c.code}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-emerald-200 text-emerald-800 font-medium"
                    >
                      {c.code}: <strong className="text-emerald-950">{c.grade}</strong> ({c.name})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Curation Dynamic Progress Bar Card */}
          <AnimatePresence>
            {onboardingStatus === 'loading' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-brand-navy to-slate-900 text-white shadow-xl border border-slate-700/80 space-y-3.5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-brand-teal shadow-inner">
                      <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white"><LocalizedText en={"AI Career Calibration & O*NET Synthesis"} /></h4>
                      <p className="text-[11px] text-slate-300"><LocalizedText en={"Matching coursework & competencies against 900+ occupations..."} /></p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-brand-teal animate-pulse">
                    <LocalizedText en={"Processing..."} />{' '}</span>
                </div>

                {/* Progressive monotonic progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/80 relative">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-brand-teal to-amber-300 relative shadow-sm"
                      initial={{ width: '15%' }}
                      animate={{ width: `${loadingProgress}%` }}
                      transition={{ duration: 0.65, ease: 'easeOut' }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-md animate-ping" />
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold px-0.5 transition-colors">
                    <span className={loadingStage === 1 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      <LocalizedText en={"1. Calibrating baseline"} />{' '}</span>
                    <span className={loadingStage === 2 ? 'text-brand-teal font-bold' : 'text-slate-400'}>
                      <LocalizedText en={"2. Synthesizing O*NET database"} />{' '}</span>
                    <span className={loadingStage === 3 ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                      <LocalizedText en={"3. Generating Top Recommendations"} />{' '}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Backend Error Alert */}
          {onboardingStatus === 'error' && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold"><LocalizedText en={"Backend Connection Error:"} /></strong>
                <p className="mt-0.5 text-red-700">{onboardingError}</p>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-1">
            <button
              id="demo-field-submit"
              onClick={handleSubmit}
              disabled={!hasUserData || onboardingStatus === 'loading'}
              className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-navy to-brand-navyLight hover:brightness-110 text-white text-sm font-extrabold shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${autoPilotStep === 'submit' ? 'ring-4 ring-cyan-400 shadow-2xl shadow-cyan-500/50 scale-[1.02]' : ''}`}
            >
              {onboardingStatus === 'loading' ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>{t('onboarding.submittingBtn', 'Curating your careers with AI...')}</span>
                </>
              ) : (
                <>
                  <span>{t('onboarding.submitBtn', 'Get My Curated Careers')}</span>
                  <ArrowRight className="w-4 h-4 text-brand-gold" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
