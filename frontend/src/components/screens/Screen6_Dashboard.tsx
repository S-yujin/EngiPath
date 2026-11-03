import { getUiLanguage, contentLanguage } from '../../i18n/localeStore';
import { LocalizedText, uiAttr, translateUi, localizePlanValue } from '../../i18n/uiText';
import { localizeMajorForDisplay } from '../../i18n/savedPlanLocalization';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { RadarChart } from '../common/RadarChart';
import { SkillLatticeModal } from '../common/SkillLatticeModal';
import { NewCycleModal } from '../common/NewCycleModal';
import {
  Award,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Target,
  FileText,
  Copy,
  Printer,
  Compass,
  Check,
  Briefcase,
  User,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Sun,
  Moon,
  Sunrise,
  Flag,
  Zap,
  GraduationCap,
  Sparkles,
  Sliders,
  RotateCcw,
  Download,
  Network,
  Milestone,
  CheckCircle,
  Activity,
  Gauge,
  Navigation,
  ChevronDown,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MinimumRequirement } from '../../types';

interface ResumeExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  timeline: string;
  bullets: string[];
}

interface ResumeProject {
  id: string;
  title: string;
  organization: string;
  timeline: string;
  bullets: string[];
}

interface ResumeCertification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

interface ResumeData {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  portfolioUrl: string;
  linkedinUrl: string;
  summary: string;
  skills: string[];
  workExperience: ResumeExperience[];
  projects: ResumeProject[];
  education: {
    degree: string;
    school: string;
    gradYear: string;
    gpa: string;
    coursework: string;
  };
  certifications: ResumeCertification[];
}

// Sub-requirement row component with expand/collapse detail
const RequirementRow: React.FC<{
  req: MinimumRequirement;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}> = ({ req, expanded, onToggle, onExpand }) => (
  <div className="text-xs">
    <div className="flex items-start justify-between gap-1.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-start gap-2 text-left cursor-pointer group flex-1"
      >
        <span
          className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
            req.completed
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-300 bg-white group-hover:border-teal-500'
          }`}
        >
          {req.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        </span>
        <span className={`leading-tight ${req.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          {localizePlanValue(req.label, getUiLanguage())}
        </span>
      </button>
      {req.detail && (
        <button
          type="button"
          onClick={onExpand}
          className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
          title={translateUi(expanded ? 'Hide detail' : 'Show detail', getUiLanguage())}
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180 text-teal-600' : ''}`}
          />
        </button>
      )}
    </div>
    {expanded && req.detail && (
      <p className="mt-1.5 ml-5 text-[11px] text-slate-600 leading-relaxed bg-teal-50/50 border border-teal-200/60 rounded-lg p-2 font-normal">
        {localizePlanValue(req.detail, getUiLanguage())}
      </p>
    )}
  </div>
);

export const Screen6_Dashboard: React.FC = () => {
  const {
    dashboardData,
    actionPlan,
    toggleShortTermAction,
    toggleMinimumRequirement,
    toggleLongTermMilestone,
    toggleMilestoneRequirement,
    currentScores,
    previousScores,
    selectedJob,
    matchPercentage,
    confidenceRanking,
    profile,
    portrait,
    currentCycle,
    setCurrentStep,
    language
  } = useApp();

  // Active View Tab: 'overview' vs 'resume'
  const [activeTab, setActiveTab] = useState<'overview' | 'resume'>('overview');

  // 3D Skill Lattice Modal Open State
  const [isLatticeOpen, setIsLatticeOpen] = useState<boolean>(false);

  // New Cycle Re-Reflection Modal State
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState<boolean>(false);

  // Expanded requirement details tracker, keyed `${itemId}-${reqIndex}`
  const [expandedReqs, setExpandedReqs] = useState<Record<string, boolean>>({});

  // Dynamic Time-of-Day Greeting
  const { greeting, GreetingIcon } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { greeting: translateUi('Good morning', language), GreetingIcon: Sunrise };
    }
    if (hour >= 12 && hour < 18) {
      return { greeting: translateUi('Good afternoon', language), GreetingIcon: Sun };
    }
    return { greeting: translateUi('Good evening', language), GreetingIcon: Moon };
  }, [language]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(translateUi(msg, language));
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Progress Bar Surge Effect on checklist cross-off (green on complete, red on cancel)
  const [surgeType, setSurgeType] = useState<'positive' | 'negative' | null>(null);
  const surgeTimerRef = React.useRef<any>(null);

  const triggerProgressSurge = (type: 'positive' | 'negative') => {
    setSurgeType(type);
    if (surgeTimerRef.current) clearTimeout(surgeTimerRef.current);
    surgeTimerRef.current = setTimeout(() => {
      setSurgeType(null);
    }, 4500);
  };

  const handleToggleShortTerm = (id: string) => {
    const action = actionPlan.shortTerm.find((a) => a.id === id);
    const wasCompleted = !!action?.completed;
    toggleShortTermAction(id);
    triggerProgressSurge(wasCompleted ? 'negative' : 'positive');
  };

  const handleToggleShortTermReq = (actionId: string, reqIdx: number) => {
    const action = actionPlan.shortTerm.find((a) => a.id === actionId);
    const wasCompleted = !!action?.minimumRequirements?.[reqIdx]?.completed;
    toggleMinimumRequirement(actionId, reqIdx);
    triggerProgressSurge(wasCompleted ? 'negative' : 'positive');
  };

  const handleToggleLongTerm = (id: string) => {
    const milestone = actionPlan.longTerm.find((m) => m.id === id);
    const wasCompleted = !!milestone?.completed;
    toggleLongTermMilestone(id);
    triggerProgressSurge(wasCompleted ? 'negative' : 'positive');
  };

  const handleToggleLongTermReq = (milestoneId: string, reqIdx: number) => {
    const milestone = actionPlan.longTerm.find((m) => m.id === milestoneId);
    const wasCompleted = !!milestone?.minimumRequirements?.[reqIdx]?.completed;
    toggleMilestoneRequirement(milestoneId, reqIdx);
    triggerProgressSurge(wasCompleted ? 'negative' : 'positive');
  };

  // Resume State
  const [resumeViewMode, setResumeViewMode] = useState<'preview' | 'edit'>('preview');
  const [resumeTheme, setResumeTheme] = useState<'modern' | 'classic' | 'technical'>('modern');
  const [spacingDensity, setSpacingDensity] = useState<'compact' | 'standard'>('compact');

  const buildInitialResumeData = (): ResumeData => {
    const defaultDegree = `B.S. in ${profile.major || 'Mechanical Engineering'}`;
    const defaultSchool = 'Institute of Technology';
    const defaultGradYear = `Year ${profile.year} • Expected 2026`;
    const defaultGpa = profile.transcriptData?.gpa ? `${profile.transcriptData.gpa} / 4.0` : '3.82 / 4.0';
    const defaultCoursework =
      (profile.transcriptData?.courses || []).map((c) => `${c.name} (${c.grade})`).join(', ') ||
      'Dynamic Systems & Controls, Data Structures & Algorithms, CAD/CAM Prototyping, Embedded Firmware';

    const defaultSkills = [
      'Python',
      'C++',
      'Git & CI/CD',
      'System Architecture',
      'Algorithms',
      ...(profile.skills || []),
      ...(selectedJob?.keyCompetencies?.map((k) => k.replace(/\s*\(\d+%\)/, '')) || [
        'Systems Thinking',
        'Technical Fundamentals',
        'Prototyping'
      ])
    ].filter((v, i, a) => a.indexOf(v) === i);

    const defaultExperience: ResumeExperience[] = [
      {
        id: 'exp-1',
        role: 'Robotics Engineering Intern',
        company: 'Autonomous Systems & Robotics Lab',
        location: 'San Francisco, CA',
        timeline: 'Summer 2025',
        bullets: [
          'Developed sensor telemetry interfaces and motor driver firmware in C++ and ROS2.',
          'Collaborated with a cross-functional team of 4 engineers to reduce test iteration loop latency by 22%.',
          'Documented system integration test plans and executed benchmark verification protocols.'
        ]
      }
    ];

    const defaultProjects: ResumeProject[] = [
      {
        id: 'proj-1',
        title: actionPlan.shortTerm[0]?.title || 'Autonomous Robotic Telemetry Testbed',
        organization: 'Independent Capstone Project',
        timeline: 'Recent',
        bullets: [
          actionPlan.shortTerm[0]?.description ||
            'Architected modular embedded sensing pipeline integrating ultrasonic sensors and motor drivers.',
          'Automated unit testing suites and achieved reliable telemetry streaming under stress testing.'
        ]
      },
      {
        id: 'proj-2',
        title: profile.transcriptData?.courses[0]?.name
          ? `${profile.transcriptData.courses[0].name} Laboratory Artifact`
          : 'High-Efficiency Feedback Controller Simulator',
        organization: 'University Coursework & Lab',
        timeline: 'Previous Term',
        bullets: [
          'Modeled mathematical state-space controllers in Python and MATLAB for stability analysis.',
          'Demonstrated 95% validation fidelity against physical benchmark measurements.'
        ]
      }
    ];

    const defaultCertifications: ResumeCertification[] = [
      {
        id: 'cert-1',
        name: 'Python for Engineers & Automation Specialization',
        issuer: 'Coursera & Vanderbilt',
        year: '2026'
      },
      {
        id: 'cert-2',
        name: 'Certified SOLIDWORKS Associate (CSWA)',
        issuer: 'Dassault Systèmes',
        year: '2025'
      }
    ];

    return {
      fullName: profile.name || 'Alex Rivera',
      headline: selectedJob ? `Aspiring ${selectedJob.title}` : 'Engineering Candidate',
      email: `${(profile.name || 'alex.rivera').toLowerCase().replace(/\s+/g, '.')}@university.edu`,
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA',
      portfolioUrl: 'https://github.com/candidate',
      linkedinUrl: 'https://linkedin.com/in/engineering-candidate',
      summary:
        portrait.summary_narration ||
        `Engineering candidate with demonstrated competencies in ${
          selectedJob?.title || 'System Engineering'
        }. Experienced in modular prototyping, empirical analysis, and developing reliable technical solutions.`,
      skills: defaultSkills,
      workExperience: defaultExperience,
      projects: defaultProjects,
      education: {
        degree: defaultDegree,
        school: defaultSchool,
        gradYear: defaultGradYear,
        gpa: defaultGpa,
        coursework: defaultCoursework
      },
      certifications: defaultCertifications
    };
  };

  const [resumeData, setResumeData] = useState<ResumeData>(buildInitialResumeData);
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  // Target Job Keywords for ATS Matching
  const targetJobKeywords = useMemo(() => {
    const jobTitleWords = (selectedJob?.title || 'Robotics Engineer Systems').split(/[\s,]+/);
    const keyComps =
      selectedJob?.keyCompetencies?.map((k) => k.replace(/\s*\(\d+%\)/, '')) || [
        'Systems Thinking',
        'Technical Fundamentals',
        'Programming',
        'Prototyping'
      ];
    const standardKeywords = ['Python', 'C++', 'Git', 'Architecture', 'Algorithms', 'Testing', 'Optimization', 'ROS2', 'SolidWorks'];
    return Array.from(new Set([...jobTitleWords, ...keyComps, ...standardKeywords])).filter((w) => w.length > 2);
  }, [selectedJob]);

  // Real-time ATS Score Calculation
  const atsAnalysis = useMemo(() => {
    const fullResumeText = [
      resumeData.fullName,
      resumeData.headline,
      resumeData.summary,
      resumeData.skills.join(' '),
      resumeData.workExperience.map((w) => `${w.role} ${w.company} ${w.location} ${w.bullets.join(' ')}`).join(' '),
      resumeData.projects.map((p) => `${p.title} ${p.organization} ${p.bullets.join(' ')}`).join(' '),
      resumeData.education.degree,
      resumeData.education.school,
      resumeData.education.coursework,
      resumeData.certifications.map((c) => `${c.name} ${c.issuer}`).join(' ')
    ].join(' ').toLowerCase();

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    targetJobKeywords.forEach((kw) => {
      if (fullResumeText.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    const keywordRatio = matchedKeywords.length / Math.max(1, targetJobKeywords.length);
    const score = Math.min(99, Math.max(50, Math.round(keywordRatio * 48 + 48)));

    return {
      score,
      matchedKeywords,
      missingKeywords
    };
  }, [resumeData, targetJobKeywords]);

  const handleAddKeywordToSkills = (kw: string) => {
    if (!resumeData.skills.includes(kw)) {
      setResumeData((prev) => ({ ...prev, skills: [...prev.skills, kw] }));
      showToast(language === 'ko' ? `"${kw}" 기술이 추가됐어요.` : `Added "${kw}" to skills`);
    }
  };

  const handleSyncFromBlueprint = () => {
    setResumeData(buildInitialResumeData());
    showToast('Resume refreshed from current blueprint');
  };

  const handleGenerateSummary = () => {
    const targetTitle = selectedJob?.title || 'Robotics & Systems Engineer';
    const major = profile.major || 'Mechanical & Software Engineering';
    const autoSummary = language === 'ko'
      ? `${major} 전공 학생으로 ${targetTitle} 직무를 목표로 하고 있습니다. 시제품 제작, 시스템 설계, 기술 문제 해결에 관심이 있으며 실제 프로젝트 경험을 바탕으로 역량을 발전시키고 있습니다.`
      : `Dedicated ${major} student targeting ${targetTitle} roles. Demonstrated strengths in rapid prototyping, system architecture, and technical problem solving with proven ability to deliver functional engineering artifacts.`;
    setResumeData((prev) => ({ ...prev, summary: autoSummary }));
    showToast('Professional summary drafted');
  };

  // Work Experience Helpers
  const handleAddExperience = () => {
    const newExp: ResumeExperience = {
      id: `exp-${Date.now()}`,
      role: 'Engineering Role',
      company: 'Company / Organization',
      location: 'City, State',
      timeline: '2026',
      bullets: ['Contributed to engineering development and milestone validation.']
    };
    setResumeData((prev) => ({
      ...prev,
      workExperience: [newExp, ...prev.workExperience]
    }));
  };

  const handleDeleteExperience = (expId: string) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.filter((e) => e.id !== expId)
    }));
  };

  const handleAddExpBullet = (expId: string) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets, 'Engineered solution to improve performance and reliability.'] } : e
      )
    }));
  };

  const handleUpdateExpBullet = (expId: string, bulletIdx: number, val: string) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((e) =>
        e.id === expId ? { ...e, bullets: e.bullets.map((b, idx) => (idx === bulletIdx ? val : b)) } : e
      )
    }));
  };

  const handleDeleteExpBullet = (expId: string, bulletIdx: number) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((e) =>
        e.id === expId ? { ...e, bullets: e.bullets.filter((_, idx) => idx !== bulletIdx) } : e
      )
    }));
  };

  // Project Helpers
  const handleAddProject = () => {
    const newProj: ResumeProject = {
      id: `proj-${Date.now()}`,
      title: 'New Engineering Project',
      organization: 'Independent Project / Lab',
      timeline: '2026',
      bullets: ['Engineered modular system components achieving target specifications.']
    };
    setResumeData((prev) => ({ ...prev, projects: [newProj, ...prev.projects] }));
  };

  const handleDeleteProject = (projId: string) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== projId)
    }));
  };

  const handleAddProjBullet = (projId: string) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projId ? { ...p, bullets: [...p.bullets, 'Implemented core features and conducted validation benchmarks.'] } : p
      )
    }));
  };

  const handleUpdateProjBullet = (projId: string, bulletIdx: number, val: string) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projId ? { ...p, bullets: p.bullets.map((b, idx) => (idx === bulletIdx ? val : b)) } : p
      )
    }));
  };

  const handleDeleteProjBullet = (projId: string, bulletIdx: number) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projId ? { ...p, bullets: p.bullets.filter((_, idx) => idx !== bulletIdx) } : p
      )
    }));
  };

  // Certification Helpers
  const handleAddCertification = () => {
    const newCert: ResumeCertification = {
      id: `cert-${Date.now()}`,
      name: 'Engineering Certificate',
      issuer: 'Organization',
      year: '2026'
    };
    setResumeData((prev) => ({ ...prev, certifications: [...prev.certifications, newCert] }));
  };

  const handleDeleteCertification = (certId: string) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== certId)
    }));
  };

  // Copy Plain Text
  const handleCopyPlainTextResume = () => {
    const plainText = `${resumeData.fullName.toUpperCase()}
${resumeData.headline}
Email: ${resumeData.email} | Phone: ${resumeData.phone} | Location: ${resumeData.location}
Portfolio: ${resumeData.portfolioUrl} | LinkedIn: ${resumeData.linkedinUrl}

PROFESSIONAL SUMMARY
${resumeData.summary}

TECHNICAL SKILLS
${resumeData.skills.join(' • ')}

WORK EXPERIENCE
${resumeData.workExperience
  .map(
    (e) =>
      `${e.role.toUpperCase()} | ${e.company} (${e.timeline})${e.location ? ` - ${e.location}` : ''}\n${e.bullets
        .map((b) => `• ${b}`)
        .join('\n')}`
  )
  .join('\n\n')}

PROJECTS
${resumeData.projects
  .map((p) => `${p.title.toUpperCase()} | ${p.organization} (${p.timeline})\n${p.bullets.map((b) => `• ${b}`).join('\n')}`)
  .join('\n\n')}

EDUCATION
${resumeData.education.degree}
${resumeData.education.school} (${resumeData.education.gradYear})${resumeData.education.gpa ? ` | GPA: ${resumeData.education.gpa}` : ''}
Relevant Coursework: ${resumeData.education.coursework}

CERTIFICATIONS
${resumeData.certifications.map((c) => `• ${c.name} - ${c.issuer} (${c.year})`).join('\n')}
`;

    navigator.clipboard.writeText(plainText);
    showToast('Plain-text resume copied to clipboard');
  };

  // PDF Save Generator
  const handleSavePdf = () => {
    const prevTitle = document.title;
    const cleanFileName = `${(resumeData.fullName || 'Candidate').trim().replace(/\s+/g, '_')}_Resume`;
    document.title = cleanFileName;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
      window.print();
      document.title = prevTitle;
      return;
    }

    const fontFamily =
      resumeTheme === 'classic'
        ? 'Georgia, Cambria, "Times New Roman", serif'
        : resumeTheme === 'technical'
        ? 'Consolas, "Courier New", Menlo, Monaco, monospace'
        : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

    const resumeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${cleanFileName}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 12mm 14mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: ${fontFamily};
              color: #0f172a;
              background: #ffffff;
              font-size: ${spacingDensity === 'compact' ? '9.5pt' : '10.5pt'};
              line-height: 1.35;
            }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px; }
            .name { font-size: 16pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
            .headline { font-size: 10pt; font-weight: 700; color: #334155; text-transform: uppercase; margin-top: 1px; }
            .contact { font-size: 8.5pt; color: #64748b; margin-top: 3px; }
            .section { margin-bottom: 10px; }
            .section-title {
              font-size: 9.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;
              border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 5px; color: #0f172a;
            }
            .item-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 9.5pt; }
            .item-sub { font-size: 8.5pt; color: #64748b; font-style: italic; margin-bottom: 2px; }
            ul { list-style-type: disc; padding-left: 16px; margin-top: 2px; }
            li { font-size: 9pt; color: #334155; margin-bottom: 2.5px; line-height: 1.3; }
            p { font-size: 9pt; color: #334155; line-height: 1.35; }
            .skills-p { font-weight: 500; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="name">${resumeData.fullName}</div>
            <div class="headline">${resumeData.headline}</div>
            <div class="contact">
              ${resumeData.email} &bull; ${resumeData.phone} &bull; ${resumeData.location} &bull; ${resumeData.portfolioUrl}
            </div>
          </div>
          <div class="section"><div class="section-title">Professional Summary</div><p>${resumeData.summary}</p></div>
          <div class="section"><div class="section-title">Technical Skills & Competencies</div><p class="skills-p">${resumeData.skills.join(' &bull; ')}</p></div>
          ${resumeData.workExperience?.length > 0 ? `
          <div class="section">
            <div class="section-title">Work Experience</div>
            ${resumeData.workExperience.map((exp) => `
              <div style="margin-bottom: 6px;">
                <div class="item-row"><span>${exp.role} &mdash; <strong>${exp.company}</strong></span><span style="font-weight: normal; color: #64748b; font-size: 8.5pt;">${exp.timeline}</span></div>
                ${exp.location ? `<div class="item-sub">${exp.location}</div>` : ''}
                <ul>${exp.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
              </div>
            `).join('')}
          </div>` : ''}
          ${resumeData.projects?.length > 0 ? `
          <div class="section">
            <div class="section-title">Engineering Projects</div>
            ${resumeData.projects.map((p) => `
              <div style="margin-bottom: 6px;">
                <div class="item-row"><span>${p.title}</span><span style="font-weight: normal; color: #64748b; font-size: 8.5pt;">${p.timeline}</span></div>
                <div class="item-sub">${p.organization}</div>
                <ul>${p.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
              </div>
            `).join('')}
          </div>` : ''}
          <div class="section">
            <div class="section-title">Education</div>
            <div class="item-row"><span>${resumeData.education.degree}</span><span style="font-weight: normal; color: #64748b; font-size: 8.5pt;">${resumeData.education.gradYear}</span></div>
            <div style="font-size: 9pt; color: #475569;">${resumeData.education.school} ${resumeData.education.gpa ? `&bull; GPA: ${resumeData.education.gpa}` : ''}</div>
            <div style="font-size: 8.5pt; color: #334155; margin-top: 2px;"><strong>Relevant Coursework:</strong> ${resumeData.education.coursework}</div>
          </div>
          ${resumeData.certifications?.length > 0 ? `
          <div class="section">
            <div class="section-title">Certifications</div>
            <div style="font-size: 9pt; color: #334155;">
              ${resumeData.certifications.map((c) => `<div><strong>${c.name}</strong> &mdash; ${c.issuer} (${c.year})</div>`).join('')}
            </div>
          </div>` : ''}
        </body>
      </html>
    `;

    doc.open();
    doc.write(resumeHtml);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      document.title = prevTitle;
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 3000);
    }, 250);

    showToast('Save as PDF ready — default filename set');
  };

  // Precise Checkpoint Computations: Every small action and sub-requirement contributes
  const shortTermActionsCount = actionPlan.shortTerm.length;
  const completedShortTermActions = actionPlan.shortTerm.filter((a) => a.completed).length;

  const totalShortTermReqs = actionPlan.shortTerm.reduce(
    (acc, a) => acc + (a.minimumRequirements?.length || 0),
    0
  );
  const completedShortTermReqs = actionPlan.shortTerm.reduce(
    (acc, a) => acc + (a.minimumRequirements?.filter((r) => r.completed).length || 0),
    0
  );

  const longTermMilestonesCount = actionPlan.longTerm.length;
  const completedLongTermMilestones = actionPlan.longTerm.filter((m) => m.completed).length;

  const totalLongTermReqs = actionPlan.longTerm.reduce(
    (acc, m) => acc + (m.minimumRequirements?.length || 0),
    0
  );
  const completedLongTermReqs = actionPlan.longTerm.reduce(
    (acc, m) => acc + (m.minimumRequirements?.filter((r) => r.completed).length || 0),
    0
  );

  // Total points
  const totalCheckpoints = shortTermActionsCount + totalShortTermReqs + longTermMilestonesCount + totalLongTermReqs;
  const completedCheckpoints =
    completedShortTermActions + completedShortTermReqs + completedLongTermMilestones + completedLongTermReqs;
  const overallMilestonePercent = Math.round(
    (completedCheckpoints / Math.max(1, totalCheckpoints)) * 100
  );

  const longTermPercent = Math.round(
    ((completedLongTermMilestones + completedLongTermReqs) /
      Math.max(1, longTermMilestonesCount + totalLongTermReqs)) *
      100
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-2xl border border-teal-500/40 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Knowledge Graph Modal */}
      <SkillLatticeModal
        isOpen={isLatticeOpen}
        onClose={() => setIsLatticeOpen(false)}
        selectedJob={selectedJob}
        profile={profile}
        actionPlan={actionPlan}
        currentScores={currentScores}
      />

      {/* Multi-Cycle Re-Reflection Questionnaire Modal */}
      <NewCycleModal
        isOpen={isNewCycleModalOpen}
        onClose={() => setIsNewCycleModalOpen(false)}
      />

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-teal uppercase tracking-wider">
            <GreetingIcon className="w-4 h-4 text-brand-gold" />
            <span>{greeting}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            {profile.name || 'Alex Rivera'}
          </h2>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span><LocalizedText en={"Targeting:"} /></span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              {selectedJob?.title || 'Target Role'}
            </span>
          </p>
        </div>

        {/* Tab Toggle: Overview vs Resume */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span><LocalizedText en={"Overview & Hub"} /></span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resume')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'resume'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            <span><LocalizedText en={"Resume Studio"} /></span>
            <span className="px-1.5 py-0.2 rounded-full bg-teal-400 text-slate-950 text-[10px] font-black">
              {atsAnalysis.score}%
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DASHBOARD OVERVIEW & QUICK ACCESS HUB (LEFT-RIGHT SPLIT)          */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Quick 3 Stat Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"><LocalizedText en={"Role Match"} /></span>
              <div className="text-2xl sm:text-3xl font-black text-brand-navy mt-1">
                {matchPercentage}%
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1.5 w-fit">
                {confidenceRanking} <LocalizedText en={"Rank Fit"} />{' '}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"><LocalizedText en={"Milestone Clearance"} /></span>
              <div className="text-2xl sm:text-3xl font-black text-brand-navy mt-1">
                {completedCheckpoints} <span className="text-sm text-slate-400">/ {totalCheckpoints}</span>
              </div>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded mt-1.5 w-fit">
                {overallMilestonePercent}<LocalizedText en={"% Checkpoints Cleared"} />{' '}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"><LocalizedText en={"Active Sprints"} /></span>
              <div className="text-2xl sm:text-3xl font-black text-brand-navy mt-1">
                {completedShortTermActions} <span className="text-sm text-slate-400">/ {actionPlan.shortTerm.length}</span>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1.5 w-fit">
                <LocalizedText en={"4–8 Week Sprints Done"} />{' '}</span>
            </div>
          </div>

          {/* 🌟 Update Competency Chart & Skills (Multi-Cycle Reflection Banner) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-brand-navy to-slate-900 border border-teal-500/30 p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    <LocalizedText en={"Update Competency Chart & Skills"} />{' '}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30">
                    <LocalizedText en={"Cycle"} />{' '}{currentCycle || 1}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  <LocalizedText en={"Reflect on your recent project work, update your skills & radar chart, and let the system better understand you to personalize your roadmap even further."} />{' '}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNewCycleModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer group"
            >
              <RotateCcw className="w-4 h-4 text-slate-950 group-hover:rotate-180 transition-transform duration-500" />
              <span><LocalizedText en={"Take Reflection Questionnaire"} /></span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* LEFT-RIGHT SPLIT CONTAINER: Left = Actions & Milestones, Right = Sticky Tesla HUD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* =================================================================== */}
            {/* LEFT COLUMN (7 COLS): FULL EXPANDABLE SPRINT & MILESTONE CHECKLISTS */}
            {/* =================================================================== */}
            <div className="lg:col-span-7 space-y-5">
              {/* 5-Phase Quick Navigation Shortcuts */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-brand-teal" />
                    <span><LocalizedText en={"Jump to Any Phase"} /></span>
                  </span>
                  <span className="text-[11px] text-slate-400"><LocalizedText en={"Click to review"} /></span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { step: 1, title: 'Profile', desc: `${localizeMajorForDisplay(profile.major || 'Academics', language)} • ${contentLanguage(language) === 'ko' ? `${profile.year}학년` : `Year ${profile.year}`}` },
                    { step: 2, title: 'Target Role', desc: selectedJob?.title || 'Selected Role' },
                    { step: 3, title: 'Diagnostic', desc: 'Calibrated signals' },
                    { step: 4, title: 'Portrait', desc: 'Strengths & growth' },
                    { step: 5, title: 'Blueprint', desc: '3 Sprint actions' }
                  ].map((p) => (
                    <button
                      key={p.step}
                      type="button"
                      onClick={() => setCurrentStep(p.step)}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border border-slate-200/80 transition-all text-left group flex flex-col justify-between cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-5 h-5 rounded-md bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center">
                          {p.step}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-brand-teal group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div className="mt-2">
                        <span className="text-xs font-extrabold text-slate-800 block group-hover:text-brand-teal transition-colors">
                          {translateUi(p.title, language)}
                        </span>
                        <span className="text-[10px] text-slate-500 line-clamp-1">
                          {translateUi(p.desc, language)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 High-Impact Short-Term Sprints (Full Expandable Format) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-brand-navy uppercase tracking-wider">
                        <LocalizedText en={"Short-Term Micro-Sprints (Next 4–8 Weeks)"} />{' '}</h4>
                      <p className="text-[10px] text-slate-500"><LocalizedText en={"Every sub-requirement checked immediately advances your progress HUD"} /></p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {completedShortTermActions} <LocalizedText en={"of"} />{' '}{actionPlan.shortTerm.length} <LocalizedText en={"Sprints Done"} />{' '}</span>
                </div>

                <div className="space-y-4">
                  {actionPlan.shortTerm.map((action, idx) => (
                    <motion.div
                      key={action.id}
                      className={`relative bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
                        action.completed
                          ? 'border-emerald-300 bg-emerald-50/25 ring-1 ring-emerald-200'
                          : 'border-slate-200/90 hover:border-brand-teal/50 shadow-xs'
                      }`}
                    >
                      {/* Step Header & Done Toggle */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            <LocalizedText en={"Sprint"} />{' '}{idx + 1}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-brand-gold" />
                            <span>{localizePlanValue(action.timeCommitment, language)}</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleShortTerm(action.id)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                            action.completed
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{translateUi(action.completed ? 'Sprint Done' : 'Complete Sprint', language)}</span>
                        </button>
                      </div>

                      <h4 className={`text-sm font-bold text-brand-navy mb-1.5 leading-snug ${action.completed ? 'line-through text-slate-400' : ''}`}>
                        {localizePlanValue(action.title, language)}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {localizePlanValue(action.description, language)}
                      </p>

                      {/* Expandable Minimum Requirements Checklist */}
                      {action.minimumRequirements && action.minimumRequirements.length > 0 && (
                        <div className="mb-3 rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                              <LocalizedText en={"Minimum Requirements (Check to advance HUD)"} />{' '}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {action.minimumRequirements.filter((r) => r.completed).length} / {action.minimumRequirements.length}
                            </span>
                          </div>

                          {action.minimumRequirements.map((req, rIdx) => {
                            const reqKey = `${action.id}-${rIdx}`;
                            return (
                              <RequirementRow
                                key={rIdx}
                                req={req}
                                expanded={!!expandedReqs[reqKey]}
                                onToggle={() => handleToggleShortTermReq(action.id, rIdx)}
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
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
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

              {/* Long-Term Career Vision (1–2 Year Milestones Full Expandable) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold">
                      <Flag className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-brand-navy uppercase tracking-wider">
                        <LocalizedText en={"Long-Term Career Vision (1–2 Year Roadmap)"} />{' '}</h4>
                      <p className="text-[10px] text-slate-500"><LocalizedText en={"Strategic multi-year checkpoints leading to"} />{' '}{selectedJob?.title || 'target role'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                    {completedLongTermMilestones} <LocalizedText en={"of"} />{' '}{actionPlan.longTerm.length} <LocalizedText en={"Done"} />{' '}</span>
                </div>

                {actionPlan.visionDescription && (
                  <div className="rounded-xl border border-brand-navy/10 bg-slate-50 p-3.5 text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-brand-navy block mb-0.5"><LocalizedText en={"Strategic Vision:"} /></span>
                    {localizePlanValue(actionPlan.visionDescription, language)}
                  </div>
                )}

                <div className="space-y-3">
                  {actionPlan.longTerm.map((milestone, mIdx) => (
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
                          onClick={() => handleToggleLongTerm(milestone.id)}
                          className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"
                        >
                          <span
                            className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                              milestone.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : 'border-slate-300 bg-white hover:border-brand-teal'
                            }`}
                          >
                            {milestone.completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <div>
                            <span className={`text-xs font-bold leading-snug block ${milestone.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              <LocalizedText en={"Milestone"} />{' '}{mIdx + 1}: {localizePlanValue(milestone.title, language)}
                            </span>
                            {milestone.notes && (
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{localizePlanValue(milestone.notes, language)}</p>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                          {localizePlanValue(milestone.timeline, language)}
                        </span>
                      </div>

                      {/* Expandable sub-requirements */}
                      {milestone.minimumRequirements && milestone.minimumRequirements.length > 0 && (
                        <div className="mt-3 pl-6 pt-2 border-t border-slate-200/80 space-y-2">
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
                                onToggle={() => handleToggleLongTermReq(milestone.id, rIdx)}
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

            {/* =================================================================== */}
            {/* RIGHT COLUMN (5 COLS): UNIFIED PROGRESS MILESTONE & RADAR HUD       */}
            {/* =================================================================== */}
            <div className="lg:col-span-5 sticky top-24 space-y-4">
              {/* UNIFIED PROGRESS MILESTONE & TELEMETRY COCKPIT CARD */}
              <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-lg p-5 text-slate-900 font-mono space-y-5">
                {/* HUD Top Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_10px_#2dd4bf]" />
                    <span className="text-[11px] font-extrabold tracking-widest text-teal-700 uppercase">
                      <LocalizedText en={"PROGRESS MILESTONES & TELEMETRY"} />{' '}</span>
                  </div>
                  <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {matchPercentage}<LocalizedText en={"% LIVE FIT"} />{' '}</span>
                </div>

                {/* Digital Speedometer & Readiness Power Metric */}
                <div className="flex items-end justify-between bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-sans font-bold">
                      <LocalizedText en={"Target Role Readiness"} />{' '}</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-4xl font-black text-teal-700 font-mono tracking-tight">
                        {overallMilestonePercent}
                      </span>
                      <span className="text-sm font-bold text-teal-700">%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-sans font-bold">
                      <LocalizedText en={"Checkpoints Cleared"} />{' '}</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {completedCheckpoints} <span className="text-xs text-slate-500">/ {totalCheckpoints}</span>
                    </span>
                  </div>
                </div>

                {/* ELONGATED VISUAL CURVED HIGHWAY PATH WITH PROPORTIONAL LASER GAUGE */}
                <div className="relative bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 overflow-hidden">
                  {/* Perspective Road Grid Lines */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:18px_18px]" />

                  {/* Proportional Continuous Progress Line Track (Elongated) */}
                  <div className="absolute left-[31px] top-8 bottom-8 w-1.5 sm:w-2 bg-slate-200 rounded-full overflow-hidden z-0">
                    {/* Active Filled Gauge (Fills proportionally according to actual progress %) */}
                    <motion.div
                      initial={{ height: '0%' }}
                      animate={{ height: `${Math.max(6, overallMilestonePercent)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`w-full rounded-full transition-all duration-500 ${
                        surgeType === 'positive'
                          ? 'bg-gradient-to-b from-[#10b981] via-[#00ff87] to-[#059669] shadow-[0_0_24px_#00ff87,0_0_12px_#10b981]'
                          : surgeType === 'negative'
                          ? 'bg-gradient-to-b from-[#f87171] via-[#ef4444] to-[#b91c1c] shadow-[0_0_24px_#ef4444,0_0_12px_#dc2626]'
                          : 'bg-gradient-to-b from-teal-400 via-teal-300 to-emerald-400 shadow-[0_0_14px_#2dd4bf]'
                      }`}
                    >
                      {/* Constant 5-Second Travelling Energy Pulse Wave */}
                      <motion.div
                        animate={{
                          y: ['-100%', '350%'],
                          opacity: [0.2, 1, 0.2]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 5.0,
                          ease: 'easeInOut'
                        }}
                        className="w-full h-24 bg-gradient-to-b from-transparent via-white to-transparent"
                      />
                    </motion.div>
                  </div>

                  <div className="relative space-y-8 sm:space-y-9 z-10">
                    {[
                      {
                        stage: 1,
                        title: translateUi('Inception & Baseline', language),
                        desc: `${localizeMajorForDisplay(profile.major || translateUi('Academics', language), language)} · ${contentLanguage(language) === 'ko' ? `${profile.year}학년` : `Year ${profile.year}`}`,
                        badge: translateUi('100% Locked', language),
                        isPassed: true,
                        activeGlow: false
                      },
                      {
                        stage: 2,
                        title: translateUi('4–8 Wk Sprints', language),
                        desc: language === 'ko'
                          ? `${actionPlan.shortTerm.length}개 중 ${completedShortTermActions}개 완료 (세부 조건 ${completedShortTermReqs}/${totalShortTermReqs})`
                          : `${completedShortTermActions} of ${actionPlan.shortTerm.length} Sprints (${completedShortTermReqs}/${totalShortTermReqs} Sub-Reqs)`,
                        badge: translateUi(completedShortTermActions === actionPlan.shortTerm.length ? 'Cleared' : 'In Progress', language),
                        isPassed: completedShortTermActions === actionPlan.shortTerm.length && actionPlan.shortTerm.length > 0,
                        activeGlow: completedShortTermActions < actionPlan.shortTerm.length
                      },
                      {
                        stage: 3,
                        title: translateUi('Long-Term Milestones', language),
                        desc: language === 'ko'
                          ? `장기 목표 ${actionPlan.longTerm.length}개 중 ${completedLongTermMilestones}개 달성`
                          : `${completedLongTermMilestones} of ${actionPlan.longTerm.length} Roadmap Goals Cleared`,
                        badge: language === 'ko' ? `${longTermPercent}% 달성` : `${longTermPercent}% Cleared`,
                        isPassed: completedLongTermMilestones === actionPlan.longTerm.length && actionPlan.longTerm.length > 0,
                        activeGlow: completedShortTermActions === actionPlan.shortTerm.length && completedLongTermMilestones < actionPlan.longTerm.length
                      },
                      {
                        stage: 4,
                        title: language === 'ko'
                          ? `목표 직무: ${translateUi(selectedJob?.title || 'Target Role', language)}`
                          : `Destination: ${selectedJob?.title || 'Target Role'}`,
                        desc: language === 'ko' ? '산업별 요구 역량 기준과 비교한 결과' : 'Evaluated against industry competency benchmark',
                        badge: language === 'ko' ? `${matchPercentage}% 적합` : `${matchPercentage}% Fit`,
                        isPassed: overallMilestonePercent >= 90,
                        activeGlow: overallMilestonePercent >= 70
                      }
                    ].map((step, idx) => (
                      <div key={step.stage} className="relative flex items-start gap-4 group">
                        {/* Waypoint Beacon Node */}
                        <div
                          className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-black transition-all shrink-0 ${
                            step.isPassed
                              ? surgeType === 'positive'
                                ? 'bg-[#00ff87] text-slate-950 shadow-[0_0_22px_#00ff87]'
                                : surgeType === 'negative'
                                ? 'bg-[#ef4444] text-white shadow-[0_0_22px_#ef4444]'
                                : 'bg-teal-400 text-slate-950 shadow-[0_0_14px_#2dd4bf]'
                              : step.activeGlow
                              ? 'bg-white border-2 border-teal-500 text-teal-700 shadow-[0_0_10px_rgba(45,212,191,0.5)]'
                              : 'bg-white border border-slate-300 text-slate-500'
                          }`}
                        >
                          {step.isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : `0${step.stage}`}
                        </div>

                        {/* Waypoint Text Info */}
                        <div className="flex-1 min-w-0 font-sans">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold truncate ${step.isPassed ? 'text-slate-900' : step.activeGlow ? 'text-teal-700' : 'text-slate-600'}`}>
                              {step.title}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                                step.isPassed
                                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                  : step.activeGlow
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {step.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* INTEGRATED COMPETENCY RADAR TELEMETRY SECTION */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      <LocalizedText en={"Competency Radar Vector"} />{' '}</span>
                    <span className="text-[10px] font-mono text-teal-700 font-semibold">
                      {confidenceRanking} <LocalizedText en={"Rank"} />{' '}</span>
                  </div>
                  <div className="w-full flex items-center justify-center py-1">
                    <RadarChart
                      currentScores={currentScores}
                      previousScores={previousScores}
                      cycleNumber={currentCycle}
                      targetJob={selectedJob}
                      height={210}
                      showLegend={false}
                      showFilterTabs={false}
                      darkMode={false}
                    />
                  </div>
                  {/* Clean Non-Overlapping In-Card Target Legend */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-600">
                    <span className="flex items-center gap-1.5 text-teal-700 font-bold">
                      <span className="w-2 h-2 rounded-full bg-teal-400" />
                      <span><LocalizedText en={"Your Current Vector"} /></span>
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700 font-semibold truncate max-w-[180px]">
                      <span className="w-2 h-2 rotate-45 bg-amber-500" />
                      <span className="truncate">{selectedJob?.title || 'Target Benchmark'}</span>
                    </span>
                  </div>
                </div>

                {/* 3D Knowledge Graph Modal Button */}
                <button
                  type="button"
                  onClick={() => setIsLatticeOpen(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 cursor-pointer font-sans mt-2"
                >
                  <Network className="w-4 h-4 text-slate-950" />
                  <span><LocalizedText en={"Explore 3D Skill Synapse Lattice"} /></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: STREAMLINED RESUME STUDIO                                         */}
      {/* ========================================================================= */}
      {activeTab === 'resume' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Top ATS Score Bar & Mode Toggle */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-teal-300 flex flex-col items-center justify-center shrink-0 border border-teal-500/30">
                <span className="text-xl font-black leading-none">{atsAnalysis.score}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400"><LocalizedText en={"ATS Fit"} /></span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-navy">
                  <LocalizedText en={"ATS Match for"} />{' '}{selectedJob?.title || 'Target Role'}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-slate-500 font-medium"><LocalizedText en={"Missing Keywords:"} /></span>
                  {atsAnalysis.missingKeywords.slice(0, 4).map((kw, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddKeywordToSkills(kw)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[10px] font-semibold transition-colors cursor-pointer"
                      title={uiAttr("Add to skills")}
                    >
                      + {kw}
                    </button>
                  ))}
                  {atsAnalysis.missingKeywords.length === 0 && (
                    <span className="text-[10px] font-semibold text-emerald-600"><LocalizedText en={"All target keywords matched"} /></span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
                <button
                  type="button"
                  onClick={() => setResumeViewMode('edit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    resumeViewMode === 'edit'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span><LocalizedText en={"Edit Details"} /></span>
                </button>

                <button
                  type="button"
                  onClick={() => setResumeViewMode('preview')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                    resumeViewMode === 'preview'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20 ring-2 ring-emerald-400/40'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                  title={uiAttr("View the styled, high-contrast ATS document preview")}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span><LocalizedText en={"View Document"} /></span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSyncFromBlueprint}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border border-slate-200"
                title={uiAttr("Sync fields from your session blueprint")}
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span className="hidden sm:inline"><LocalizedText en={"Sync Blueprint"} /></span>
              </button>

              <button
                type="button"
                onClick={handleCopyPlainTextResume}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border border-slate-200"
                title={uiAttr("Copy plain text")}
              >
                <Copy className="w-3 h-3" />
                <span><LocalizedText en={"Copy Text"} /></span>
              </button>

              <button
                type="button"
                onClick={handleSavePdf}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-teal-950/20 hover:shadow-lg cursor-pointer"
                title={uiAttr("Save high-resolution vector PDF of the resume")}
              >
                <Download className="w-3.5 h-3.5" />
                <span><LocalizedText en={"Save / Print PDF"} /></span>
              </button>
            </div>
          </div>

          {/* Clean Style Controls Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700"><LocalizedText en={"Typography:"} /></span>
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {[
                  { id: 'modern', label: 'Modern' },
                  { id: 'classic', label: 'Classic' },
                  { id: 'technical', label: 'Technical' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setResumeTheme(t.id as any)}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      resumeTheme === t.id ? 'bg-white text-brand-navy shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium"><LocalizedText en={"Density:"} /></span>
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSpacingDensity('compact')}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer ${
                    spacingDensity === 'compact' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'
                  }`}
                >
                  <LocalizedText en={"Compact (1-Page)"} />{' '}</button>
                <button
                  type="button"
                  onClick={() => setSpacingDensity('standard')}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer ${
                    spacingDensity === 'standard' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'
                  }`}
                >
                  <LocalizedText en={"Standard"} />{' '}</button>
              </div>
            </div>
          </div>

          {/* RESUME BODY: EDIT MODE vs DOCUMENT VIEW */}
          {resumeViewMode === 'edit' ? (
            <div className="space-y-4 text-xs">
              {/* 1. Contact Information */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-brand-navy uppercase tracking-wider text-xs">
                    <LocalizedText en={"1. Contact Information"} />{' '}</h4>
                  <span className="text-[10px] text-slate-400"><LocalizedText en={"Auto-formatted in header"} /></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1"><LocalizedText en={"Full Name"} /></label>
                    <input
                      type="text"
                      value={resumeData.fullName}
                      onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1"><LocalizedText en={"Professional Headline"} /></label>
                    <input
                      type="text"
                      value={resumeData.headline}
                      onChange={(e) => setResumeData({ ...resumeData, headline: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1"><LocalizedText en={"Email"} /></label>
                    <input
                      type="email"
                      value={resumeData.email}
                      onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1"><LocalizedText en={"Phone"} /></label>
                    <input
                      type="text"
                      value={resumeData.phone}
                      onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1"><LocalizedText en={"Location"} /></label>
                    <input
                      type="text"
                      value={resumeData.location}
                      onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1"><LocalizedText en={"Portfolio / GitHub"} /></label>
                    <input
                      type="text"
                      value={resumeData.portfolioUrl}
                      onChange={(e) => setResumeData({ ...resumeData, portfolioUrl: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Professional Summary */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-brand-navy uppercase tracking-wider text-xs">
                    <LocalizedText en={"2. Professional Summary"} />{' '}</h4>
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200"
                  >
                    <LocalizedText en={"Draft Summary"} />{' '}</button>
                </div>

                <textarea
                  rows={3}
                  value={resumeData.summary}
                  onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 leading-relaxed bg-white"
                  placeholder={uiAttr("Summarize your engineering background and target focus...")}
                />
              </div>

              {/* 3. Technical Skills */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-brand-navy uppercase tracking-wider text-xs">
                    <LocalizedText en={"3. Technical Skills & Competencies"} />{' '}</h4>
                  <span className="text-[10px] text-slate-400">{resumeData.skills.length} <LocalizedText en={"skills listed"} /></span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {resumeData.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium text-xs flex items-center gap-1.5 border border-slate-200"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setResumeData({
                            ...resumeData,
                            skills: resumeData.skills.filter((sk) => sk !== s)
                          })
                        }
                        className="text-slate-400 hover:text-red-500 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={uiAttr("Add a new skill and press Enter...")}
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSkillInput.trim() && !resumeData.skills.includes(newSkillInput.trim())) {
                          setResumeData({ ...resumeData, skills: [...resumeData.skills, newSkillInput.trim()] });
                          setNewSkillInput('');
                        }
                      }
                    }}
                    className="p-2 text-xs rounded-xl border border-slate-300 flex-1 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSkillInput.trim() && !resumeData.skills.includes(newSkillInput.trim())) {
                        setResumeData({ ...resumeData, skills: [...resumeData.skills, newSkillInput.trim()] });
                        setNewSkillInput('');
                      }
                    }}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <LocalizedText en={"Add"} />{' '}</button>
                </div>
              </div>

              {/* 4. WORK EXPERIENCE */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-bold text-brand-navy uppercase tracking-wider text-xs">
                      <LocalizedText en={"4. Work Experience & Internships"} />{' '}</h4>
                    <p className="text-[10px] text-slate-500"><LocalizedText en={"Industry roles, co-ops, lab positions, or relevant employment"} /></p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="px-3 py-1 rounded-xl bg-brand-navy text-white text-xs font-semibold hover:bg-brand-navyLight transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span><LocalizedText en={"Add Experience"} /></span>
                  </button>
                </div>

                <div className="space-y-4">
                  {resumeData.workExperience.map((exp, eIdx) => (
                    <div key={exp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          <LocalizedText en={"Experience #"} />{eIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                          title={uiAttr("Delete experience")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1"><LocalizedText en={"Job Title / Role"} /></label>
                          <input
                            type="text"
                            value={exp.role}
                            placeholder={uiAttr("e.g. Robotics Intern")}
                            onChange={(e) =>
                              setResumeData({
                                ...resumeData,
                                workExperience: resumeData.workExperience.map((item) =>
                                  item.id === exp.id ? { ...item, role: e.target.value } : item
                                )
                              })
                            }
                            className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1"><LocalizedText en={"Company / Organization"} /></label>
                          <input
                            type="text"
                            value={exp.company}
                            placeholder={uiAttr("e.g. Acme Automation Corp")}
                            onChange={(e) =>
                              setResumeData({
                                ...resumeData,
                                workExperience: resumeData.workExperience.map((item) =>
                                  item.id === exp.id ? { ...item, company: e.target.value } : item
                                )
                              })
                            }
                            className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1"><LocalizedText en={"Location"} /></label>
                          <input
                            type="text"
                            value={exp.location}
                            placeholder={uiAttr("e.g. San Francisco, CA")}
                            onChange={(e) =>
                              setResumeData({
                                ...resumeData,
                                workExperience: resumeData.workExperience.map((item) =>
                                  item.id === exp.id ? { ...item, location: e.target.value } : item
                                )
                              })
                            }
                            className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1"><LocalizedText en={"Timeline / Dates"} /></label>
                          <input
                            type="text"
                            value={exp.timeline}
                            placeholder={uiAttr("e.g. Summer 2025")}
                            onChange={(e) =>
                              setResumeData({
                                ...resumeData,
                                workExperience: resumeData.workExperience.map((item) =>
                                  item.id === exp.id ? { ...item, timeline: e.target.value } : item
                                )
                              })
                            }
                            className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs"
                          />
                        </div>
                      </div>

                      {/* Bullets */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-700"><LocalizedText en={"Responsibility & Impact Bullets"} /></label>
                          <button
                            type="button"
                            onClick={() => handleAddExpBullet(exp.id)}
                            className="text-[10px] font-bold text-brand-teal hover:text-brand-navy flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span><LocalizedText en={"Add Bullet"} /></span>
                          </button>
                        </div>

                        {exp.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-1.5">
                            <span className="text-slate-400 mt-2 font-bold">•</span>
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => handleUpdateExpBullet(exp.id, bIdx, e.target.value)}
                              className="flex-1 p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs leading-relaxed"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteExpBullet(exp.id, bIdx)}
                              className="text-slate-400 hover:text-red-500 mt-2 p-1 cursor-pointer"
                              title={uiAttr("Delete bullet")}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. PROJECTS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-bold text-brand-navy uppercase tracking-wider text-xs">
                      <LocalizedText en={"5. Engineering Projects & Lab Artifacts"} />{' '}</h4>
                    <p className="text-[10px] text-slate-500"><LocalizedText en={"Capstone projects, course lab builds, and personal technical sprints"} /></p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="px-3 py-1 rounded-xl bg-brand-navy text-white text-xs font-semibold hover:bg-brand-navyLight transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span><LocalizedText en={"Add Project"} /></span>
                  </button>
                </div>

                <div className="space-y-4">
                  {resumeData.projects.map((proj, pIdx) => (
                    <div key={proj.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          <LocalizedText en={"Project #"} />{pIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                          title={uiAttr("Delete project")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1"><LocalizedText en={"Project Title"} /></label>
                          <input
                            type="text"
                            value={proj.title}
                            onChange={(e) =>
                              setResumeData({
                                ...resumeData,
                                projects: resumeData.projects.map((p) =>
                                  p.id === proj.id ? { ...p, title: e.target.value } : p
                                )
                              })
                            }
                            className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1"><LocalizedText en={"Timeline / Context"} /></label>
                          <input
                            type="text"
                            value={proj.timeline}
                            onChange={(e) =>
                              setResumeData({
                                ...resumeData,
                                projects: resumeData.projects.map((p) =>
                                  p.id === proj.id ? { ...p, timeline: e.target.value } : p
                                )
                              })
                            }
                            className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1"><LocalizedText en={"Organization / Course Name"} /></label>
                        <input
                          type="text"
                          value={proj.organization}
                          onChange={(e) =>
                            setResumeData({
                              ...resumeData,
                              projects: resumeData.projects.map((p) =>
                                p.id === proj.id ? { ...p, organization: e.target.value } : p
                              )
                            })
                          }
                          className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs"
                        />
                      </div>

                      {/* Bullets */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-700"><LocalizedText en={"Project Bullets"} /></label>
                          <button
                            type="button"
                            onClick={() => handleAddProjBullet(proj.id)}
                            className="text-[10px] font-bold text-brand-teal hover:text-brand-navy flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span><LocalizedText en={"Add Bullet"} /></span>
                          </button>
                        </div>

                        {proj.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-1.5">
                            <span className="text-slate-400 mt-2 font-bold">•</span>
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => handleUpdateProjBullet(proj.id, bIdx, e.target.value)}
                              className="flex-1 p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs leading-relaxed"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteProjBullet(proj.id, bIdx)}
                              className="text-slate-400 hover:text-red-500 mt-2 p-1 cursor-pointer"
                              title={uiAttr("Delete bullet")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Education */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-brand-navy uppercase tracking-wider text-xs">
                    <LocalizedText en={"6. Education & Academic Background"} />{' '}</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1"><LocalizedText en={"Degree Title"} /></label>
                    <input
                      type="text"
                      value={resumeData.education.degree}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          education: { ...resumeData.education, degree: e.target.value }
                        })
                      }
                      className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1"><LocalizedText en={"School / University"} /></label>
                    <input
                      type="text"
                      value={resumeData.education.school}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          education: { ...resumeData.education, school: e.target.value }
                        })
                      }
                      className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1"><LocalizedText en={"Graduation Timeline & GPA"} /></label>
                    <input
                      type="text"
                      value={`${resumeData.education.gradYear} • GPA: ${resumeData.education.gpa}`}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          education: { ...resumeData.education, gradYear: e.target.value }
                        })
                      }
                      className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1"><LocalizedText en={"Relevant Coursework"} /></label>
                  <input
                    type="text"
                    value={resumeData.education.coursework}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        education: { ...resumeData.education, coursework: e.target.value }
                      })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* 7. Certifications */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-brand-navy uppercase tracking-wider text-xs">
                    <LocalizedText en={"7. Certifications & Credentials"} />{' '}</h4>
                  <button
                    type="button"
                    onClick={handleAddCertification}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-slate-200"
                  >
                    <Plus className="w-3 h-3" />
                    <span><LocalizedText en={"Add Certification"} /></span>
                  </button>
                </div>

                <div className="space-y-2">
                  {resumeData.certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cert.name}
                        placeholder={uiAttr("Certificate name")}
                        onChange={(e) =>
                          setResumeData({
                            ...resumeData,
                            certifications: resumeData.certifications.map((c) =>
                              c.id === cert.id ? { ...c, name: e.target.value } : c
                            )
                          })
                        }
                        className="flex-1 p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={cert.issuer}
                        placeholder={uiAttr("Issuer")}
                        onChange={(e) =>
                          setResumeData({
                            ...resumeData,
                            certifications: resumeData.certifications.map((c) =>
                              c.id === cert.id ? { ...c, issuer: e.target.value } : c
                            )
                          })
                        }
                        className="w-40 p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs"
                      />
                      <input
                        type="text"
                        value={cert.year}
                        placeholder={uiAttr("Year")}
                        onChange={(e) =>
                          setResumeData({
                            ...resumeData,
                            certifications: resumeData.certifications.map((c) =>
                              c.id === cert.id ? { ...c, year: e.target.value } : c
                            )
                          })
                        }
                        className="w-20 p-2 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteCertification(cert.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* VISUAL CLEAN ATS RESUME DOCUMENT WITH DISTINCT DESK FRAME */
            <div className="bg-slate-200/70 p-4 sm:p-8 rounded-3xl border border-slate-300/80 shadow-inner space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                    <LocalizedText en={"Live Document View • ATS Standard A4 Layout"} />{' '}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResumeViewMode('edit')}
                    className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer text-[11px]"
                  >
                    <LocalizedText en={"Edit Content"} />{' '}</button>
                  <button
                    type="button"
                    onClick={handleSavePdf}
                    className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-sm transition-all flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span><LocalizedText en={"Download PDF"} /></span>
                  </button>
                </div>
              </div>

              <div
                className={`bg-white rounded-2xl border border-slate-300 shadow-2xl text-slate-900 leading-relaxed max-w-3xl mx-auto transition-all ${
                  spacingDensity === 'compact' ? 'p-6 sm:p-9 space-y-4 text-xs' : 'p-8 sm:p-12 space-y-6 text-sm'
                } ${resumeTheme === 'classic' ? 'font-serif' : resumeTheme === 'technical' ? 'font-mono' : 'font-sans'}`}
              >
                <div className="text-center pb-3 space-y-0.5 border-b-2 border-slate-900">
                  <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                    {resumeData.fullName}
                  </h1>
                  <p className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                    {resumeData.headline}
                  </p>
                  <p className="text-[11px] text-slate-500 flex flex-wrap items-center justify-center gap-x-2 pt-0.5">
                    <span>{resumeData.email}</span>
                    <span>•</span>
                    <span>{resumeData.phone}</span>
                    <span>•</span>
                    <span>{resumeData.location}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-800">{resumeData.portfolioUrl}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <h2 className="text-[11px] font-extrabold uppercase tracking-wider pb-0.5 border-b border-slate-200 text-slate-900">
                    <LocalizedText en={"Professional Summary"} />{' '}</h2>
                  <p className="text-slate-700 text-justify leading-relaxed">{resumeData.summary}</p>
                </div>

                <div className="space-y-1">
                  <h2 className="text-[11px] font-extrabold uppercase tracking-wider pb-0.5 border-b border-slate-200 text-slate-900">
                    <LocalizedText en={"Technical Skills & Competencies"} />{' '}</h2>
                  <p className="text-slate-800 font-medium leading-relaxed">{resumeData.skills.join(' • ')}</p>
                </div>

                {resumeData.workExperience && resumeData.workExperience.length > 0 && (
                  <div className="space-y-2.5">
                    <h2 className="text-[11px] font-extrabold uppercase tracking-wider pb-0.5 border-b border-slate-200 text-slate-900">
                      <LocalizedText en={"Work Experience"} />{' '}</h2>

                    {resumeData.workExperience.map((exp) => (
                      <div key={exp.id} className="space-y-0.5">
                        <div className="flex justify-between items-baseline font-bold text-slate-900">
                          <span className="text-xs">
                            {exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span>
                          </span>
                          <span className="text-[10px] font-normal text-slate-500">{exp.timeline}</span>
                        </div>
                        {exp.location && <p className="text-[10px] text-slate-500 italic">{exp.location}</p>}
                        <ul className="list-disc list-outside pl-4 text-slate-700 space-y-0.5">
                          {exp.bullets.map((b, idx) => (
                            <li key={idx} className="leading-snug">
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {resumeData.projects && resumeData.projects.length > 0 && (
                  <div className="space-y-2.5">
                    <h2 className="text-[11px] font-extrabold uppercase tracking-wider pb-0.5 border-b border-slate-200 text-slate-900">
                      <LocalizedText en={"Engineering Projects"} />{' '}</h2>

                    {resumeData.projects.map((proj) => (
                      <div key={proj.id} className="space-y-0.5">
                        <div className="flex justify-between items-baseline font-bold text-slate-900">
                          <span className="text-xs">{proj.title}</span>
                          <span className="text-[10px] font-normal text-slate-500">{proj.timeline}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic font-medium">{proj.organization}</p>
                        <ul className="list-disc list-outside pl-4 text-slate-700 space-y-0.5">
                          {proj.bullets.map((b, idx) => (
                            <li key={idx} className="leading-snug">
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                  <h2 className="text-[11px] font-extrabold uppercase tracking-wider pb-0.5 border-b border-slate-200 text-slate-900">
                    <LocalizedText en={"Education"} />{' '}</h2>
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span>{resumeData.education.degree}</span>
                    <span className="text-[10px] font-normal text-slate-500">{resumeData.education.gradYear}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {resumeData.education.school} {resumeData.education.gpa ? `• GPA: ${resumeData.education.gpa}` : ''}
                  </p>
                  <p className="text-slate-700 text-[11px]">
                    <strong><LocalizedText en={"Coursework:"} /></strong> {resumeData.education.coursework}
                  </p>
                </div>

                {resumeData.certifications && resumeData.certifications.length > 0 && (
                  <div className="space-y-1">
                    <h2 className="text-[11px] font-extrabold uppercase tracking-wider pb-0.5 border-b border-slate-200 text-slate-900">
                      <LocalizedText en={"Certifications"} />{' '}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                      {resumeData.certifications.map((c) => (
                        <div key={c.id} className="text-slate-700">
                          <strong className="text-slate-900">{c.name}</strong> — {c.issuer} ({c.year})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
