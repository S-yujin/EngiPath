import { DreamJob, DiagnosticQuestion, ReflectionPortrait, ActionPlan, DashboardData, CompetencyScores, StepInfo } from '../types';

export const STEPS: StepInfo[] = [
  { step: 1, path: '/onboarding', title: 'Profile', shortTitle: 'Profile', timeEstimate: '' },
  { step: 2, path: '/', title: 'Career Matches', shortTitle: 'Careers', timeEstimate: '' },
  { step: 3, path: '/diagnostic', title: 'Diagnostic', shortTitle: 'Diagnostic', timeEstimate: '' },
  { step: 4, path: '/portrait', title: 'Portrait', shortTitle: 'Portrait', timeEstimate: '' },
  { step: 5, path: '/action-plan', title: 'Action Plan', shortTitle: 'Plan', timeEstimate: '' },
  { step: 6, path: '/dashboard', title: 'Dashboard', shortTitle: 'Dashboard', timeEstimate: '' },
];

export const DREAM_JOBS: DreamJob[] = [
  {
    id: 'robotics',
    title: 'Robotics Engineer',
    icon: '🤖',
    category: 'Autonomous Systems & Automation',
    tagline: 'Build the intelligent machines and robotic systems of tomorrow.',
    description: 'Design, build, and program autonomous robots, robotic manipulators, and robotic perception systems for space, medicine, and manufacturing.',
    keyCompetencies: ['Programming (90%)', 'Prototyping (85%)'],
    targetScores: {
      technicalFundamentals: 85,
      programming: 90,
      prototyping: 85,
      systemsThinking: 80,
      communication: 70,
      learningAgility: 75
    }
  },
  {
    id: 'aerospace',
    title: 'Aerospace Propulsion',
    icon: '🚀',
    category: 'Aeronautics & Space Exploration',
    tagline: 'Reach for the stars with hypersonic and rocket engineering.',
    description: 'Pioneer advanced propulsion systems, rocket engines, thermal shields, and orbital trajectory dynamics for next-generation flight.',
    keyCompetencies: ['Technical Fundamentals (95%)', 'Systems Thinking (85%)'],
    targetScores: {
      technicalFundamentals: 95,
      programming: 60,
      prototyping: 70,
      systemsThinking: 85,
      communication: 65,
      learningAgility: 70
    }
  },
  {
    id: 'sustainable',
    title: 'Sustainable Energy Analyst',
    icon: '⚡',
    category: 'CleanTech & Smart Grids',
    tagline: 'Power the future with decarbonized energy grids.',
    description: 'Model renewable energy systems, grid-scale batteries, and green energy economics to accelerate the world’s transition to zero-carbon energy.',
    keyCompetencies: ['Systems Thinking (85%)', 'Technical Fundamentals (80%)'],
    targetScores: {
      technicalFundamentals: 80,
      programming: 70,
      prototyping: 60,
      systemsThinking: 85,
      communication: 75,
      learningAgility: 70
    }
  },
  {
    id: 'ai-hardware',
    title: 'AI Hardware Designer',
    icon: '🧠',
    category: 'Semiconductors & Deep Learning Accelerators',
    tagline: 'Engineer microchips and silicon architectures for intelligence.',
    description: 'Architect low-latency neural processing units (NPUs), silicon photonics, and high-bandwidth memory pipelines powering frontier foundation models.',
    keyCompetencies: ['Technical Fundamentals (85%)', 'Programming (80%)', 'Learning Agility (80%)'],
    targetScores: {
      technicalFundamentals: 85,
      programming: 80,
      prototyping: 75,
      systemsThinking: 80,
      communication: 65,
      learningAgility: 80
    }
  },
  {
    id: 'biomedical',
    title: 'Biomedical Device Creator',
    icon: '🩺',
    category: 'Healthcare & Bionics',
    tagline: 'Engineer life-changing medical devices and neural prosthetics.',
    description: 'Develop implantable biometric sensors, robotic surgical tools, microfluidics, and assistive bionics to save and improve human lives.',
    keyCompetencies: ['Prototyping (85%)', 'Communication (80%)', 'Technical Fundamentals (80%)'],
    targetScores: {
      technicalFundamentals: 80,
      programming: 60,
      prototyping: 85,
      systemsThinking: 75,
      communication: 80,
      learningAgility: 70
    }
  },
  {
    id: 'infrastructure',
    title: 'Smart Infrastructure Architect',
    icon: '🏗️',
    category: 'Smart Cities & Resilient Civil Systems',
    tagline: 'Build resilient, connected, and sustainable future megacities.',
    description: 'Integrate IoT sensors, structural health monitoring, and AI-driven traffic systems into climate-resilient bridges, tunnels, and urban transit.',
    keyCompetencies: ['Systems Thinking (90%)', 'Communication (80%)'],
    targetScores: {
      technicalFundamentals: 75,
      programming: 70,
      prototyping: 65,
      systemsThinking: 90,
      communication: 80,
      learningAgility: 65
    }
  }
];

export const MAJOR_PRESETS: Record<string, { label: string; defaultScores: CompetencyScores; commonCourses: Array<{ code: string; name: string; grade: string; credits: number; competency: keyof CompetencyScores }> }> = {
  'Mechanical Engineering': {
    label: 'Mechanical Engineering',
    defaultScores: {
      technicalFundamentals: 65,
      programming: 35,
      prototyping: 60,
      systemsThinking: 55,
      communication: 50,
      learningAgility: 60
    },
    commonCourses: [
      { code: 'ME 201', name: 'Thermodynamics I', grade: 'A-', credits: 3, competency: 'technicalFundamentals' },
      { code: 'ME 220', name: 'Statics & Solid Mechanics', grade: 'A', credits: 4, competency: 'technicalFundamentals' },
      { code: 'ME 250', name: 'Design & Manufacturing CAD/CAM', grade: 'B+', credits: 3, competency: 'prototyping' },
      { code: 'ENGR 101', name: 'Intro to Computational Problem Solving', grade: 'B', credits: 3, competency: 'programming' },
    ]
  },
  'Computer Science': {
    label: 'Computer Science',
    defaultScores: {
      technicalFundamentals: 55,
      programming: 75,
      prototyping: 40,
      systemsThinking: 60,
      communication: 50,
      learningAgility: 70
    },
    commonCourses: [
      { code: 'CS 106B', name: 'Data Structures & Algorithms', grade: 'A', credits: 4, competency: 'programming' },
      { code: 'CS 107', name: 'Computer Systems Architecture', grade: 'A-', credits: 4, competency: 'systemsThinking' },
      { code: 'MATH 51', name: 'Linear Algebra & Multivariable Calc', grade: 'B+', credits: 4, competency: 'technicalFundamentals' },
    ]
  },
  'Electrical & Computer Engineering': {
    label: 'Electrical & Computer Engineering',
    defaultScores: {
      technicalFundamentals: 70,
      programming: 60,
      prototyping: 55,
      systemsThinking: 65,
      communication: 45,
      learningAgility: 65
    },
    commonCourses: [
      { code: 'EE 101', name: 'Circuits & Embedded Systems', grade: 'A', credits: 4, competency: 'prototyping' },
      { code: 'EE 214', name: 'Signals & Linear Systems', grade: 'B+', credits: 4, competency: 'technicalFundamentals' },
      { code: 'CS 102', name: 'Object-Oriented Programming (C++)', grade: 'A-', credits: 3, competency: 'programming' },
    ]
  },
  'Biomedical Engineering': {
    label: 'Biomedical Engineering',
    defaultScores: {
      technicalFundamentals: 60,
      programming: 40,
      prototyping: 55,
      systemsThinking: 55,
      communication: 65,
      learningAgility: 65
    },
    commonCourses: [
      { code: 'BME 200', name: 'Biomaterials & Tissue Mechanics', grade: 'A', credits: 3, competency: 'technicalFundamentals' },
      { code: 'BME 250', name: 'Medical Device Prototyping Lab', grade: 'A-', credits: 3, competency: 'prototyping' },
      { code: 'BIO 110', name: 'Human Physiology for Engineers', grade: 'A', credits: 4, competency: 'communication' },
    ]
  },
  'Aerospace Engineering': {
    label: 'Aerospace Engineering',
    defaultScores: {
      technicalFundamentals: 75,
      programming: 45,
      prototyping: 50,
      systemsThinking: 65,
      communication: 50,
      learningAgility: 60
    },
    commonCourses: [
      { code: 'AERO 201', name: 'Fluid Mechanics & Aerodynamics', grade: 'A-', credits: 4, competency: 'technicalFundamentals' },
      { code: 'AERO 300', name: 'Flight Dynamics & Control', grade: 'B+', credits: 4, competency: 'systemsThinking' },
      { code: 'ENGR 150', name: 'Matlab for Aerospace Applications', grade: 'A', credits: 3, competency: 'programming' },
    ]
  },
  'Civil & Environmental Engineering': {
    label: 'Civil & Environmental Engineering',
    defaultScores: {
      technicalFundamentals: 60,
      programming: 30,
      prototyping: 45,
      systemsThinking: 70,
      communication: 65,
      learningAgility: 55
    },
    commonCourses: [
      { code: 'CEE 210', name: 'Structural Analysis & Design', grade: 'A', credits: 4, competency: 'technicalFundamentals' },
      { code: 'CEE 240', name: 'Urban Infrastructure Systems', grade: 'A-', credits: 3, competency: 'systemsThinking' },
      { code: 'CEE 180', name: 'GIS & Spatial Data Modeling', grade: 'B+', credits: 3, competency: 'programming' },
    ]
  }
};

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'q1',
    question: 'How comfortable are you writing a basic Python script (e.g., loops, functions, data handling)?',
    competency: 'programming',
    weight: 0.25,
    format: 'slider',
    options: ['1 - Never coded', '2 - Basic syntax', '3 - Comfortable', '4 - Advanced scripts', '5 - Production-grade expert'],
    hint: 'Think about scripting automation, NumPy, Pandas, or quick prototyping scripts.'
  },
  {
    id: 'q2',
    question: 'Rate your confidence in solving differential equations, vector calculus, or linear algebra problems.',
    competency: 'technicalFundamentals',
    weight: 0.20,
    format: 'slider',
    options: ['1 - Not confident', '2 - Somewhat confident', '3 - Confident with notes', '4 - Very confident', '5 - Effortless mastery'],
    hint: 'Foundational mathematics and physics applied to engineering systems.'
  },
  {
    id: 'q3',
    question: 'Have you ever built a physical prototype (e.g., Arduino, 3D print, breadboard circuit, welded frame)? Describe your experience.',
    competency: 'prototyping',
    weight: 0.25,
    format: 'open-ended',
    placeholder: 'e.g., In ME250, I CAD-modeled a planetary gearbox in SolidWorks and 3D printed the housing. I wired an Arduino Uno with an ultrasonic sensor to test rotational speed...',
    suggestedSnippets: [
      'Built a motorized rover with Arduino and laser-cut chassis',
      'Soldered custom PCB for environmental sensor data logging',
      'Designed and 3D printed mechanical assembly with snap-fit parts'
    ]
  },
  {
    id: 'q4',
    question: 'Describe a project or coursework where you had to apply math or physics concepts to solve a real engineering challenge.',
    competency: 'technicalFundamentals',
    weight: 0.20,
    format: 'open-ended',
    placeholder: 'e.g., Calculated stress concentrations in a cantilever beam under cyclical load using Mohr circle analysis, validating our finite element model against empirical strain gauge readings...',
    suggestedSnippets: [
      'Modeled heat transfer and insulation for a thermoelectric cooler',
      'Applied kinematics equations to calculate projectile launch trajectory',
      'Optimized beam cross-section for maximum stiffness-to-weight ratio'
    ]
  },
  {
    id: 'q5',
    question: 'How often do you work in team-based multidisciplinary engineering projects, and what role do you usually take?',
    competency: 'communication',
    weight: 0.15,
    format: 'multiple-choice',
    options: [
      'Rarely work in teams — prefer solo independent tasks',
      'Contributor — execute assigned sub-tasks with guidance',
      'Active Collaborator — coordinate cross-subsystems and code reviews',
      'Lead / Coordinator — align technical roadmap and team deliverables',
      'Team Lead & Presenter — synthesize engineering specs and present to stakeholders'
    ],
    hint: 'Communication and teamwork are critical for engineering career acceleration.'
  },
  {
    id: 'q6',
    question: 'Describe a complex problem you solved that required understanding how multiple subsystems (software, hardware, physics) interacted.',
    competency: 'systemsThinking',
    weight: 0.20,
    format: 'open-ended',
    placeholder: 'e.g., When our motor heated up, the software PID controller oscillated uncontrollably. I traced the root cause to thermal voltage drop affecting the sensor ADC readings and added a low-pass filter...',
    suggestedSnippets: [
      'Debugged sensor noise caused by inductive kickback from high-power motors',
      'Balanced battery capacity vs total vehicle payload weight in UAV design',
      'Implemented closed-loop feedback control between thermal sensors and fan speeds'
    ]
  },
  {
    id: 'q7',
    question: 'When learning an unfamiliar engineering tool or library (e.g., ROS2, PyTorch, FEA software), what is your natural approach?',
    competency: 'learningAgility',
    weight: 0.10,
    format: 'multiple-choice',
    options: [
      'I usually wait until it is formally taught in class',
      'I read tutorials and follow step-by-step guides when required',
      'I build a quick toy example on my own to break and understand it',
      'I dive deep into documentation, source code, and community forums proactively',
      'I master it rapidly, synthesize notes, and teach/onboard others'
    ],
    hint: 'Engineers who self-direct their learning advance 2.5x faster in first-year roles.'
  },
  {
    id: 'q8',
    question: 'Have you used CAD software (SolidWorks/Fusion360), 3D printers, CNC machines, or electronics lab equipment?',
    competency: 'prototyping',
    weight: 0.15,
    format: 'multiple-choice',
    options: [
      'No hands-on experience yet',
      'Beginner — basic shapes or watched lab demonstrations',
      'Intermediate — completed multiple classroom lab assignments',
      'Proficient — regularly design, fabricate, and assemble custom parts',
      'Advanced — expert in GD&T, CNC machining, PCB layout, and DFM'
    ]
  },
  {
    id: 'q9',
    question: 'Tell us about a technical presentation, design review, or engineering report you delivered. What made it clear and compelling?',
    competency: 'communication',
    weight: 0.10,
    format: 'open-ended',
    placeholder: 'e.g., In our capstone interim review, I created high-contrast CAD render animations and data flow charts instead of text-heavy slides, which helped professors quickly understand our gear transmission...',
    suggestedSnippets: [
      'Visualized experimental stress-strain data with clean interactive plots',
      'Structured design review into Problem, Trade-offs, Feasibility, and Timeline',
      'Authored concise 4-page whitepaper that secured $1,500 student project grant'
    ]
  },
  {
    id: 'q10',
    question: 'Rate your ability to break down a large, ambiguous engineering challenge into modular, testable sub-tasks.',
    competency: 'systemsThinking',
    weight: 0.15,
    format: 'slider',
    options: ['1 - Feel overwhelmed', '2 - Need significant guidance', '3 - Can break into broad milestones', '4 - Confident modular planning', '5 - Master of systems decomposition & FMEA'],
    hint: 'Decomposing complex requirements into iterative engineering sprints.'
  }
];

export const MOCK_PORTRAIT: ReflectionPortrait = {
  supported_strengths: [
    {
      id: 'p1',
      signal: 'PS1',
      label: 'Systems Thinking & Problem Framing',
      evidence: 'Validated by your systematic problem breakdown and multi-subsystem engineering reflections.',
      explanation: 'Your confidence in Systems Thinking is well supported by your responses, demonstrating solid, dependable engineering problem-solving.',
      competency: 'systemsThinking',
      classification: 'supported_strength',
      student_self_view: 'high',
      experience_strength: 0.85,
      state_confidence: 0.82,
      supporting_sources: ['Q01:A', 'Q13:B', 'Q14:A'],
      userFeedback: 'none'
    },
    {
      id: 'p2',
      signal: 'PS2',
      label: 'Troubleshooting & Root-Cause Analysis',
      evidence: 'Strong empirical foundation in isolating fault conditions and systematic debugging.',
      explanation: 'Your technical troubleshooting instincts are clearly evidenced by your concrete project examples and diagnostic responses.',
      competency: 'technicalFundamentals',
      classification: 'supported_strength',
      student_self_view: 'high',
      experience_strength: 0.80,
      state_confidence: 0.78,
      supporting_sources: ['Q02:D', 'Q14:D'],
      userFeedback: 'none'
    }
  ],
  possible_hidden_strengths: [
    {
      id: 'p3',
      signal: 'LEARN1',
      label: 'Learning Agility & Adaptation',
      evidence: 'You actively self-direct when encountering unfamiliar tools based on your diagnostic learning approach.',
      explanation: 'You described your learning speed cautiously, but your responses indicate rapid self-directed mastery of new tools. This may be an area where your capability is stronger than you give yourself credit for.',
      competency: 'learningAgility',
      classification: 'possible_hidden_strength',
      student_self_view: 'low',
      experience_strength: 0.78,
      state_confidence: 0.74,
      supporting_sources: ['Q20:C', 'Q21:B'],
      userFeedback: 'none'
    }
  ],
  areas_to_validate: [
    {
      id: 'p4',
      signal: 'COM1',
      label: 'Technical Idea Communication',
      evidence: 'Reflections suggest promising leadership potential and willingness to explain complex concepts.',
      explanation: 'You feel confident in articulating technical ideas. As you tackle larger interdisciplinary presentations, you will have great opportunities to validate and sharpen this.',
      competency: 'communication',
      classification: 'worth_validating',
      student_self_view: 'high',
      experience_strength: 0.55,
      state_confidence: 0.60,
      supporting_sources: ['Q34:A'],
      userFeedback: 'none'
    }
  ],
  developing_picture: [
    {
      id: 'p5',
      signal: 'EXEC1',
      label: 'Applied Prototyping & Independence',
      evidence: 'Demonstrated emerging experience in turning design specs into functional physical builds.',
      explanation: 'You have shown promising initial experience in hands-on fabrication. Continuing to build and test prototypes will solidify this capability.',
      competency: 'prototyping',
      classification: 'developing_picture',
      student_self_view: 'moderate',
      experience_strength: 0.62,
      state_confidence: 0.65,
      supporting_sources: ['Q27:B'],
      userFeedback: 'none'
    }
  ],
  still_taking_shape: [
    {
      id: 'p6',
      signal: 'MGMT1',
      label: 'Project Prioritisation & Resource Management',
      evidence: 'Limited direct behavioral evidence collected so far across formal project planning.',
      explanation: 'We have limited observations for project resource management so far. This represents an open growth runway as you lead larger initiatives.',
      competency: 'systemsThinking',
      classification: 'still_taking_shape',
      student_self_view: 'none',
      experience_strength: 0.30,
      state_confidence: 0.35,
      supporting_sources: [],
      userFeedback: 'none'
    }
  ],
  summary_narration: 'Here is your evidence-aware engineering portrait. It reflects how you see yourself, what your demonstrated experiences currently suggest, and where potential hidden strengths lie.'
};

export const MOCK_ACTION_PLAN: ActionPlan = {
  shortTerm: [
    {
      id: 'a1',
      title: 'Complete "Python for Engineers" (Coursera / edX)',
      description: 'Build foundational programming skills with focus on NumPy, Matplotlib, and ROS2 Python interfaces for automated control.',
      timeCommitment: '2 hours/week for 4 weeks',
      resourceLink: 'https://www.coursera.org/learn/python-for-engineers',
      provider: 'Coursera & Vanderbilt',
      completed: false,
      saved: true
    },
    {
      id: 'a2',
      title: 'Build a Simple Arduino Sensor & Motor Testbed',
      description: 'Create an ultrasonic obstacle-avoiding robotic chassis with telemetry data logging to gain direct hands-on prototyping experience.',
      timeCommitment: '3 hours total (Weekend Sprint)',
      resourceLink: 'https://www.arduino.cc/projects',
      provider: 'Arduino Project Hub',
      completed: false,
      saved: true
    },
    {
      id: 'a3',
      title: 'Join University Robotics / IEEE Student Chapter',
      description: 'Attend 2 workshops, introduce yourself to sub-team leads (firmware or mechanical chassis), and contribute to a competition robot.',
      timeCommitment: '1 session/week (Ongoing)',
      resourceLink: 'https://youruniversity.edu/robotics-club',
      provider: 'Campus Student Orgs',
      completed: false,
      saved: true
    }
  ],
  longTerm: [
    { id: 'l1', title: 'Declare Robotics / Mechatronics Minor', timeline: 'By Year 2 Spring', completed: true, notes: 'Completed advising consultation' },
    { id: 'l2', title: 'Secure Summer Automation & Robotics Internship', timeline: 'Summer Year 3', completed: false, notes: 'Targeting Boston Dynamics / ABB / Tesla' },
    { id: 'l3', title: 'Build Portfolio of 3 Verified Physical Projects', timeline: 'By Graduation', completed: false, notes: '1 completed, 2 in progress' },
    { id: 'l4', title: 'Publish or Present Capstone at IEEE Conference', timeline: 'Year 4 Fall', completed: false, notes: 'Autonomous navigation research paper' },
    { id: 'l5', title: 'Network with 5 Industry Robotics Engineers on LinkedIn', timeline: 'Ongoing', completed: true, notes: 'Connected with 3 alumni' }
  ],
  savedAt: '2026-08-18'
};

export const MOCK_DASHBOARD: DashboardData = {
  confidenceScore: 72,
  confidenceRanking: 'High',
  completedMilestones: 2,
  totalMilestones: 5,
  growthScore: 18,
  baselineMatch: 42,
  mentorTip: 'Outstanding momentum! Your recent Arduino sensor verification moved your Prototyping score from 45 → 62. Focusing on your next 4-week Python action will unlock full readiness for Summer Robotics internships.',
  evidenceSubmissions: [
    {
      id: 'e1',
      type: 'certificate',
      title: 'Python for Engineers Certificate (Coursera)',
      link: 'https://coursera.org/cert/PY-882194',
      submittedAt: '2026-08-10',
      status: 'approved',
      competencyBoost: 'programming',
      notes: 'Verified 40-hour syllabus and final project grade of 98%.'
    },
    {
      id: 'e2',
      type: 'github',
      title: 'Arduino Temperature Sensor & Motor Controller',
      link: 'https://github.com/student/arduino-telemetry-controller',
      submittedAt: '2026-08-15',
      status: 'approved',
      competencyBoost: 'prototyping',
      notes: 'Solid circuit schematic and modular C++ firmware structure.'
    },
    {
      id: 'e3',
      type: 'grades',
      title: 'Official Fall Transcript (ME 201 A-, CS 101 B+)',
      link: 'https://university.edu/records/transcript-2026.pdf',
      submittedAt: '2026-08-17',
      status: 'pending',
      competencyBoost: 'technicalFundamentals',
      notes: 'Under review for prerequisite course waiver.'
    }
  ]
};

export const DEMO_PROFILES = [
  {
    id: 'demo-sophia',
    name: 'Sophia Chen',
    year: 2,
    major: 'Mechanical Engineering',
    dreamJobId: 'robotics',
    tag: 'Sophomore MechE → Robotics Engineer',
    scores: {
      technicalFundamentals: 78,
      programming: 48,
      prototyping: 62,
      systemsThinking: 75,
      communication: 65,
      learningAgility: 72
    }
  },
  {
    id: 'demo-marcus',
    name: 'Marcus Vance',
    year: 3,
    major: 'Electrical & Computer Engineering',
    dreamJobId: 'ai-hardware',
    tag: 'Junior ECE → AI Hardware Designer',
    scores: {
      technicalFundamentals: 82,
      programming: 75,
      prototyping: 68,
      systemsThinking: 78,
      communication: 60,
      learningAgility: 80
    }
  },
  {
    id: 'demo-elena',
    name: 'Elena Rostova',
    year: 1,
    major: 'Computer Science',
    dreamJobId: 'sustainable',
    tag: 'Freshman CS → Sustainable Energy Analyst',
    scores: {
      technicalFundamentals: 60,
      programming: 70,
      prototyping: 45,
      systemsThinking: 68,
      communication: 72,
      learningAgility: 75
    }
  }
];
