import { LocalizedText, uiAttr, translateUi } from '../../i18n/uiText';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { Sparkles, X, ChevronRight, Heart, MessageSquare, Send, Bot, User, Minimize2, Globe, Languages } from 'lucide-react';

export type RobotMood = 'normal' | 'love' | 'angry' | 'excited' | 'starstruck' | 'sleepy';

export interface FloatingRobotAvatarProps {
  /** Optional custom image URL for the robot body/character layer */
  customBodyImg?: string;
  /** Optional custom PNG URL for the left eye overlay */
  customLeftEyeImg?: string;
  /** Optional custom PNG URL for the right eye overlay */
  customRightEyeImg?: string;
  className?: string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

const STEP_TIPS: Record<number, string[]> = {
  1: [
    'Tell us your academic story! Every course calibrates your baseline. ✨',
    '💡 Quick Tip: You can fill in your name, degree, about you, skills & interests in multiple languages (中文, English, etc.)!',
    'Uploading transcript or coursework sharpens diagnostic accuracy! 📚',
    'I\'m Engipath, your AI career coach! Chat with me anytime in any language. 🚀'
  ],
  2: [
    'Swipe through your curated career directions! 🎯',
    'Click on cards to preview target score benchmarks! 🔍',
    'Choose a role you love to begin your tailored diagnostic! 💫'
  ],
  3: [
    'Diagnostic assessment active! Go with your genuine instincts. 💡',
    'There are no wrong answers — only authentic insights! 🧠',
    'Each answer calibrates your multidimensional portrait! ⚡'
  ],
  4: [
    'Your reflection portrait is generated! 🌟',
    'Click items to give feedback or discover hidden strengths! 💬',
    'Notice where your self-view aligns with demonstrated signals! 💎'
  ],
  5: [
    'Your personalized 3-step action roadmap is ready! 📋',
    'Check off tasks as you accomplish them! ✅',
    'Save your blueprint to track ongoing career growth! 💾'
  ],
  6: [
    'Here is your live role readiness dashboard! 🏆',
    'Milestone accomplished! Great work on your journey! 🎓',
    'Keep leveling up and reviewing action milestones! 🔥'
  ]
};

const GAZE_PRESETS = [
  { x: 0, y: 0 },         // straight ahead
  { x: 7, y: -4 },        // glance upper right
  { x: -7, y: -3 },       // glance upper left
  { x: 8, y: 3 },         // glance lower right
  { x: -6, y: 4 },        // glance lower left
  { x: 0, y: 5 },         // glance down
  { x: 0, y: -5 },        // glance up
  { x: 5, y: 0 },         // glance right
  { x: -5, y: 0 }         // glance left
];

const SUGGESTED_QUESTIONS = [
  'What should I focus on next?',
  'How does the diagnostic scoring work?',
  'Tips for leveling up my skills'
];

export const FloatingRobotAvatar: React.FC<FloatingRobotAvatarProps> = ({
  customBodyImg,
  customLeftEyeImg,
  customRightEyeImg,
  className = ''
}) => {
  const {
    currentStep,
    studentId,
    isAutoPilotRunning,
    autoPilotStep,
    autoPilotTargetId,
    autoPilotSpeech,
    runDemoAutoPilot,
    cancelDemoAutoPilot,
    language
  } = useApp();
  const avatarRef = useRef<HTMLDivElement>(null);
  const visorEmitterRef = useRef<HTMLDivElement>(null);

  // Interaction & emotion states
  const [mood, setMood] = useState<RobotMood>('normal');
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(true);
  const [bubbleTextIndex, setBubbleTextIndex] = useState<number>(0);

  // ✈️ EVE Auto-Pilot Flight Coordinates & Laser Target Tracking
  const [autoPilotPos, setAutoPilotPos] = useState<{
    x: number;
    y: number;
    rotate: number;
    targetRect?: DOMRect;
  } | null>(null);

  // 60fps Dynamic Laser Beam Coordinate State
  const [laserData, setLaserData] = useState<{
    visible: boolean;
    startX: number;
    startY: number;
    targetLeft: number;
    targetTop: number;
    targetWidth: number;
    targetHeight: number;
    targetRight: number;
    targetBottom: number;
    sweepX: number;
    sweepY: number;
  } | null>(null);

  // Auto-Pilot flight orchestrator (Smooth EVE from WALL-E physics)
  useEffect(() => {
    if (!isAutoPilotRunning || !autoPilotTargetId) {
      setAutoPilotPos(null);
      return;
    }

    const targetEl = document.getElementById(autoPilotTargetId);
    if (!targetEl) return;

    // Smoothly scroll target into view
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const updateFlightTarget = () => {
      const rect = targetEl.getBoundingClientRect();
      const originX = window.innerWidth - 80;
      const originY = window.innerHeight - 80;

      let targetX: number;
      let targetY: number;
      let rotate: number;

      if (autoPilotStep === 'submit') {
        // Hover right above the submit button in a celebratory stance
        targetX = rect.left + rect.width / 2 - originX;
        targetY = rect.top - 80 - originY;
        rotate = 0;
        setMood('starstruck');
      } else {
        // Float gracefully to the right/above-right of the input field
        const hoverX = Math.min(window.innerWidth - 130, rect.right + 25);
        const hoverY = rect.top + rect.height / 2 - 20;
        targetX = hoverX - originX;
        targetY = hoverY - originY;
        // Natural gentle banking tilt toward the field
        rotate = -8;
        setMood('excited');
      }

      setAutoPilotPos({ x: targetX, y: targetY, rotate, targetRect: rect });
      setShowSpeechBubble(true);
    };

    updateFlightTarget();
    const handleScrollOrResize = () => updateFlightTarget();
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isAutoPilotRunning, autoPilotTargetId, autoPilotStep]);

  // 🛰️ Real-Time 60fps Visor-Locked Laser Beam Synchronizer
  useEffect(() => {
    if (!isAutoPilotRunning || !autoPilotTargetId || autoPilotStep === 'submit') {
      setLaserData(null);
      return;
    }

    let animId: number;
    let isMounted = true;
    // Activate laser beam 450ms after arriving so Engipath glides smoothly first
    const laserStartTime = Date.now() + 450;

    const trackLaser = () => {
      if (!isMounted) return;

      const targetEl = document.getElementById(autoPilotTargetId);
      const visorEl = visorEmitterRef.current;

      if (targetEl && visorEl && Date.now() >= laserStartTime) {
        const visorRect = visorEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const startX = visorRect.left + visorRect.width * 0.35;
        const startY = visorRect.top + visorRect.height * 0.5;

        const time = Date.now() / 380;
        const sweepProgress = (Math.sin(time) + 1) / 2;
        const sweepX = targetRect.left + 10 + sweepProgress * Math.max(20, targetRect.width - 20);
        const sweepY = targetRect.top + targetRect.height / 2;

        setLaserData({
          visible: true,
          startX,
          startY,
          targetLeft: targetRect.left,
          targetTop: targetRect.top,
          targetWidth: targetRect.width,
          targetHeight: targetRect.height,
          targetRight: targetRect.right,
          targetBottom: targetRect.bottom,
          sweepX,
          sweepY
        });
      } else {
        setLaserData(null);
      }

      animId = requestAnimationFrame(trackLaser);
    };

    animId = requestAnimationFrame(trackLaser);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
    };
  }, [isAutoPilotRunning, autoPilotTargetId, autoPilotStep]);

  // Global Keyboard Shortcuts: Ctrl+Shift+D / Alt+D for Demo, ESC to Cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) ||
        (e.altKey && (e.key === 'D' || e.key === 'd'))
      ) {
        e.preventDefault();
        runDemoAutoPilot();
      } else if (e.key === 'Escape' && isAutoPilotRunning) {
        e.preventDefault();
        cancelDemoAutoPilot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runDemoAutoPilot, cancelDemoAutoPilot, isAutoPilotRunning]);

  // Antenna Triple-Click detector for secret demo launch
  const antennaClickCountRef = useRef<number>(0);
  const lastAntennaClickTimeRef = useRef<number>(0);

  const handleAntennaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastAntennaClickTimeRef.current < 600) {
      antennaClickCountRef.current++;
      if (antennaClickCountRef.current >= 3) {
        antennaClickCountRef.current = 0;
        runDemoAutoPilot();
        return;
      }
    } else {
      antennaClickCountRef.current = 1;
    }
    lastAntennaClickTimeRef.current = now;
  };

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [dockSide, setDockSide] = useState<'right' | 'left'>('right');
  const [chatInput, setChatInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isFlickedOff, setIsFlickedOff] = useState<boolean>(false);
  const [flickVector, setFlickVector] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [windowBounds, setWindowBounds] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const updateBounds = () => {
      setWindowBounds({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Auto-cycle speech bubble tips at a set interval (every 6.5 seconds)
  useEffect(() => {
    if (!showSpeechBubble || isChatOpen || mood !== 'normal' || isHovered || isAutoPilotRunning) return;

    const interval = setInterval(() => {
      setBubbleTextIndex((prev) => {
        const tips = STEP_TIPS[currentStep] || STEP_TIPS[1];
        return (prev + 1) % tips.length;
      });
    }, 6500);

    return () => clearInterval(interval);
  }, [showSpeechBubble, isChatOpen, mood, isHovered, currentStep, isAutoPilotRunning]);

  // Reset tip index when switching steps
  useEffect(() => {
    setBubbleTextIndex(0);
  }, [currentStep]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hi! I'm Engipath, your AI career coach. Ask me anything! (💡 Tip: You can fill in your onboarding fields or chat with me in multiple languages — 中文, English, etc.)",
      timestamp: 'Just now'
    }
  ]);
  // Welcome is translated at render time so switching language never resets the chat.
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Open Chat with automatic corner docking
  const handleOpenChat = useCallback(() => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const closerToLeft = centerX < window.innerWidth / 2;
      setDockSide(closerToLeft ? 'left' : 'right');
    }
    setIsChatOpen(true);
  }, []);

  // 5s Click latency / cooldown tracking
  const lastClickTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const shakeHistoryRef = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const isWakingUpRef = useRef<boolean>(false);

  // ⚡ Wake-up Sequence: Play red eyes ('angry') mood + shake, then restore normal eyes and tips
  const triggerWakeUpSequence = useCallback(() => {
    if (isWakingUpRef.current) return;
    isWakingUpRef.current = true;

    // 1. Trigger angry mood (red eyes & vibration)
    setMood('angry');
    shakeHistoryRef.current = [];

    // 2. Play red-eyes animation for 1.8 seconds, then wake up to normal and show tips
    setTimeout(() => {
      setMood('normal');
      setShowSpeechBubble(true);
      setBubbleTextIndex(0);
      isWakingUpRef.current = false;
    }, 1800);
  }, []);

  // 🌪️ Detect holding and shaking Engipath to wake him up
  const handleDrag = (_: any, info: any) => {
    const now = Date.now();
    // Keep recent 750ms of drag points
    shakeHistoryRef.current = shakeHistoryRef.current.filter((p) => now - p.time < 750);
    shakeHistoryRef.current.push({ x: info.point.x, y: info.point.y, time: now });

    if (shakeHistoryRef.current.length >= 4 && !isWakingUpRef.current) {
      let xReversals = 0;
      let yReversals = 0;
      let prevXSign = 0;
      let prevYSign = 0;
      let totalDistance = 0;

      for (let i = 1; i < shakeHistoryRef.current.length; i++) {
        const dx = shakeHistoryRef.current[i].x - shakeHistoryRef.current[i - 1].x;
        const dy = shakeHistoryRef.current[i].y - shakeHistoryRef.current[i - 1].y;
        totalDistance += Math.hypot(dx, dy);

        if (Math.abs(dx) > 6) {
          const sign = Math.sign(dx);
          if (prevXSign !== 0 && sign !== prevXSign) xReversals++;
          prevXSign = sign;
        }
        if (Math.abs(dy) > 6) {
          const sign = Math.sign(dy);
          if (prevYSign !== 0 && sign !== prevYSign) yReversals++;
          prevYSign = sign;
        }
      }

      // Shaking detected: 3+ reversals OR 2+ reversals with rapid total displacement (>180px)
      if (xReversals >= 3 || yReversals >= 3 || (totalDistance > 180 && (xReversals >= 2 || yReversals >= 2))) {
        triggerWakeUpSequence();
      }
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    shakeHistoryRef.current = [];
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);

    const vx = info.velocity.x;
    const vy = info.velocity.y;
    const speed = Math.hypot(vx, vy);

    // If flicked with high velocity (> 550)
    if (speed > 550) {
      const angle = Math.atan2(vy, vx);
      const flingDist = Math.max(window.innerWidth, window.innerHeight) * 1.2;
      setFlickVector({
        x: Math.cos(angle) * flingDist,
        y: Math.sin(angle) * flingDist
      });
      setIsFlickedOff(true);
      setShowSpeechBubble(false);
      return;
    }

    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      setDockSide(centerX < window.innerWidth / 2 ? 'left' : 'right');
    }
  };

  // Raw Motion values for smooth gaze tracking
  const rawEyeX = useMotionValue(0);
  const rawEyeY = useMotionValue(0);

  // Spring physics for ultra-smooth, organic eye following
  const springConfig = { damping: 22, stiffness: 170, mass: 0.65 };
  const smoothEyeX = useSpring(rawEyeX, springConfig);
  const smoothEyeY = useSpring(rawEyeY, springConfig);

  // Dynamic head & body tilt derived from eye tracking
  const headTilt = useTransform(smoothEyeX, [-12, 12], [-5, 5]);
  const bodyTilt = useTransform(smoothEyeX, [-12, 12], [-2.5, 2.5]);

  // Idle wander gaze vs Mouse tracking
  const isMouseActiveRef = useRef<boolean>(false);
  const idleTimerRef = useRef<any>(null);
  const wanderIntervalRef = useRef<any>(null);

  // Auto scroll chat to bottom when messages update
  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping, isChatOpen]);

  // Track global cursor coordinates and calculate relative eye offset
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      isMouseActiveRef.current = true;

      // Clear any pending idle wander
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (wanderIntervalRef.current) clearInterval(wanderIntervalRef.current);

      if (avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect();
        const avatarCenterX = rect.left + rect.width / 2;
        const avatarCenterY = rect.top + rect.height * 0.32; // center on eyes

        const deltaX = e.clientX - avatarCenterX;
        const deltaY = e.clientY - avatarCenterY;
        const distance = Math.hypot(deltaX, deltaY);

        // Max pupil travel radius inside the large expressive visor (in pixels)
        const maxRadius = 10;
        const sensitivity = 0.04;

        // Clamping logic: calculate angle and clamp distance
        const angle = Math.atan2(deltaY, deltaX);
        const clampedDistance = Math.min(distance * sensitivity, maxRadius);

        const targetX = Math.cos(angle) * clampedDistance;
        const targetY = Math.sin(angle) * clampedDistance;

        rawEyeX.set(targetX);
        rawEyeY.set(targetY);
      }

      // Schedule idle wander mode if mouse stops moving for 1.8s
      idleTimerRef.current = setTimeout(() => {
        isMouseActiveRef.current = false;
        startIdleWander();
      }, 1800);
    };

    const startIdleWander = () => {
      if (wanderIntervalRef.current) clearInterval(wanderIntervalRef.current);

      const pickRandomGaze = () => {
        if (isMouseActiveRef.current) return;
        const randomPreset = GAZE_PRESETS[Math.floor(Math.random() * GAZE_PRESETS.length)];
        rawEyeX.set(randomPreset.x);
        rawEyeY.set(randomPreset.y);
      };

      pickRandomGaze();
      wanderIntervalRef.current = setInterval(pickRandomGaze, 2600);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Initial idle wander if user hasn't moved mouse yet
    idleTimerRef.current = setTimeout(() => {
      startIdleWander();
    }, 1200);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (wanderIntervalRef.current) clearInterval(wanderIntervalRef.current);
    };
  }, [rawEyeX, rawEyeY]);

  // Periodic natural blinking cycle (only in normal mood)
  useEffect(() => {
    if (mood !== 'normal') return;
    let blinkTimer: any;
    const scheduleNextBlink = () => {
      const delay = Math.random() * 3200 + 2000;
      blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 130);
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(blinkTimer);
  }, [mood]);

  // Auto return to normal mood after 3.6 seconds
  useEffect(() => {
    if (mood === 'normal') return;
    const timer = setTimeout(() => {
      setMood('normal');
    }, 3600);
    return () => clearTimeout(timer);
  }, [mood]);

  // Update speech bubble prompt based on step changes
  useEffect(() => {
    setBubbleTextIndex(0);
    setShowSpeechBubble(true);
  }, [currentStep]);

  // Click handler: 5s Latency / Cooldown + Emotional Reactions (love, angry, excited, starstruck, sleepy)
  // If tips were dismissed, clicking him wakes him up with red eyes and brings back tips!
  const handleAvatarClick = useCallback(() => {
    if (isDraggingRef.current || isChatOpen) {
      return;
    }

    // If tip was dismissed, wake him up immediately!
    if (!showSpeechBubble) {
      triggerWakeUpSequence();
      return;
    }

    const now = Date.now();
    // 5-second latency / cooldown between emotion triggers
    if (now - lastClickTimeRef.current < 5000) {
      return;
    }
    lastClickTimeRef.current = now;

    // Emotions pool: love, angry, excited, starstruck, sleepy
    const moodPool: RobotMood[] = ['love', 'angry', 'excited', 'starstruck', 'sleepy'];
    const nextMood = moodPool[Math.floor(Math.random() * moodPool.length)];
    setMood(nextMood);
  }, [isChatOpen, showSpeechBubble, triggerWakeUpSequence]);

  // Handle chatbot send message — WanTu career coach (real backend AI)
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || chatInput).trim();
    if (!messageText || isTyping) return;

    // Demo Command Check
    const lower = messageText.toLowerCase();
    if (lower.includes('/demo') || lower.includes('run demo') || lower.includes('autopilot')) {
      setIsChatOpen(false);
      setTimeout(() => {
        runDemoAutoPilot();
      }, 300);
      return;
    }

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Send the conversation history (excludes the message just added,
    // which the backend appends itself as the current user turn).
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = chatMessages
      .filter((m) => m.id !== 'welcome')
      .slice(-20)
      .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

    try {
      const { reply } = await apiService.sendChatMessage(messageText, history, studentId);
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: translateUi('I can only answer career related questions.', language),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Current career milestone tip for normal mode or live auto-pilot speech
  const activeStepTip = useMemo(() => {
    if (isAutoPilotRunning && autoPilotSpeech) {
      return autoPilotSpeech;
    }
    const tips = STEP_TIPS[currentStep] || STEP_TIPS[1];
    return translateUi(tips[bubbleTextIndex % tips.length], language);
  }, [currentStep, bubbleTextIndex, isAutoPilotRunning, autoPilotSpeech, language]);

  // Hidden on Hero landing screen (Step 0)
  if (currentStep === 0) {
    return null;
  }

  // Antenna color based on mood
  const antennaColor =
    mood === 'love'
      ? '#F472B6'
      : mood === 'angry'
      ? '#EF4444'
      : mood === 'starstruck'
      ? '#FBBF24'
      : mood === 'sleepy'
      ? '#818CF8'
      : mood === 'excited'
      ? '#06B6D4'
      : isHovered
      ? '#10B981'
      : '#06B6D4';

  return (
    <>
      {/* 🌟 EVE Holographic Scanning Laser Beam (60fps Visor Locked) */}
      <AnimatePresence>
        {isAutoPilotRunning && laserData?.visible && (
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none z-30 w-full h-full"
            style={{ overflow: 'visible' }}
          >
            <defs>
              {/* Visor Origin Glowing Radial */}
              <radialGradient id="visorOriginGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
              </radialGradient>

              {/* Holographic Fan Gradient */}
              <linearGradient id="hologramFanGrad" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="rgba(6, 182, 212, 0.85)" />
                <stop offset="50%" stopColor="rgba(34, 211, 238, 0.35)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.02)" />
              </linearGradient>

              {/* Sci-Fi Glow Filter */}
              <filter id="laserSciFiGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur1" />
                <feGaussianBlur stdDeviation="7" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g filter="url(#laserSciFiGlow)">
              {/* 1. Holographic Soft Scanning Cone (Visor to Target Box) */}
              <polygon
                points={`
                  ${laserData.startX},${laserData.startY}
                  ${laserData.targetLeft},${laserData.targetTop}
                  ${laserData.targetLeft},${laserData.targetBottom}
                `}
                fill="url(#hologramFanGrad)"
                opacity="0.35"
              />

              {/* 2. Primary Focused Laser Beam */}
              <line
                x1={laserData.startX}
                y1={laserData.startY}
                x2={laserData.sweepX}
                y2={laserData.sweepY}
                stroke="#22d3ee"
                strokeWidth="2"
                opacity="0.9"
              />

              {/* 3. Visor Emitter Glow */}
              <circle
                cx={laserData.startX}
                cy={laserData.startY}
                r="5"
                fill="url(#visorOriginGlow)"
              />

              {/* 4. Target Input Box Typing Indicator Dot */}
              <circle
                cx={laserData.sweepX}
                cy={laserData.sweepY}
                r="3"
                fill="#22d3ee"
              />
              <circle
                cx={laserData.sweepX}
                cy={laserData.sweepY}
                r="1.5"
                fill="#ffffff"
              />
            </g>
          </motion.svg>
        )}
      </AnimatePresence>

      {/* 🚀 Floating Summon Button when AI Assistant is flicked off screen */}
      <AnimatePresence>
        {isFlickedOff && (
          <motion.button
            key="summon-coach-btn"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsFlickedOff(false);
              setFlickVector({ x: 0, y: 0 });
              setShowSpeechBubble(true);
            }}
            className="fixed bottom-5 right-5 z-40 px-4 py-2.5 rounded-2xl bg-slate-900/95 hover:bg-slate-900 text-teal-300 border border-teal-500/40 shadow-2xl shadow-slate-950/60 backdrop-blur-xl flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-950 shadow-sm group-hover:rotate-12 transition-transform">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-white text-[11px] font-extrabold"><LocalizedText en={"Engipath AI Coach"} /></span>
              <span className="text-[9px] text-teal-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-brand-gold animate-pulse" />
                <LocalizedText en={"Click to summon"} />{' '}</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isFlickedOff && (
          <motion.div
            key="robot-main-container"
            layout
            drag={!isChatOpen && !isAutoPilotRunning}
            dragMomentum={true}
            dragElastic={0.15}
            dragConstraints={{
              left: -(windowBounds.width - 140),
              right: 0,
              top: -(windowBounds.height - 160),
              bottom: 0
            }}
            onDragStart={() => {
              isDraggingRef.current = true;
              shakeHistoryRef.current = [];
            }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={
              isAutoPilotRunning && autoPilotPos
                ? {
                    opacity: 1,
                    scale: 0.92,
                    x: autoPilotPos.x,
                    y: autoPilotPos.y,
                    rotate: autoPilotPos.rotate
                  }
                : isChatOpen
                ? { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
                : { opacity: 1, scale: 1, rotate: 0 }
            }
            exit={{
              opacity: 0,
              scale: 0.4,
              x: flickVector.x,
              y: flickVector.y,
              transition: { duration: 0.4, ease: 'easeIn' }
            }}
            transition={
              isAutoPilotRunning
                ? { type: 'spring', damping: 28, stiffness: 110, mass: 0.85 }
                : { type: 'spring', damping: 25, stiffness: 280 }
            }
            className={`fixed z-40 flex flex-col select-none pointer-events-auto right-5 sm:right-7 bottom-5 sm:bottom-6 items-end ${
              isChatOpen || isAutoPilotRunning ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
            } ${className}`}
          >
      {/* 💬 FLOATING CHATBOT WINDOW (Placeholder AI Coach Interface) */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            className={`mb-3 w-[300px] sm:w-[340px] h-[400px] rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-teal-500/30 shadow-2xl shadow-slate-950/60 flex flex-col overflow-hidden text-white z-50 ${
              dockSide === 'left' ? 'origin-bottom-left self-start' : 'origin-bottom-right self-end'
            }`}
          >
            {/* Chatbot Header */}
            <div className="px-4 py-3 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center shadow-md">
                  <Bot className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span><LocalizedText en={"Engipath AI Assistant"} /></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-teal-300 font-medium"><LocalizedText en={"Online • Step"} />{' '}{currentStep} <LocalizedText en={"Coach"} /></div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title={uiAttr("Close chat")}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Chatbot Messages List */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      msg.sender === 'user'
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-slate-800 border border-teal-500/40 text-teal-300'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-800/90 text-slate-200 border border-white/5 rounded-tl-none'
                    }`}
                  >
                    {msg.id === 'welcome' ? translateUi(msg.text, language) : msg.text}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs pl-8">
                  <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-full border border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Suggestion Chips */}
            <div className="px-3 py-1.5 bg-slate-950/40 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(translateUi(q, language))}
                  className="whitespace-nowrap text-[10px] bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1 rounded-full border border-teal-500/20 transition-colors"
                >
                  {translateUi(q, language)}
                </button>
              ))}
            </div>

            {/* Multilingual Tip Bar */}
            <div className="px-3 py-1 bg-slate-950/80 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-teal-300/80">
              <Globe className="w-3 h-3 text-teal-400 flex-shrink-0" />
              <span><LocalizedText en={"Tip: You can ask questions in any language (中文, English, etc.)"} /></span>
            </div>

            {/* Chatbot Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-2.5 bg-slate-800/90 border-t border-white/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={uiAttr("Ask Engipath anything (in any language)...")}
                className="flex-1 bg-slate-900/80 border border-slate-700 text-white placeholder-slate-400 text-xs px-3 py-2 rounded-xl focus:outline-hidden focus:border-teal-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💬 Theme-Matched Sleek Glassmorphism Speech / Tip Bubble (Visible in Normal Mode or during AutoPilot) */}
      <AnimatePresence>
        {!isChatOpen && showSpeechBubble && (mood === 'normal' || isAutoPilotRunning) && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            className={`mb-3 max-w-[260px] sm:max-w-[300px] relative pointer-events-auto ${
              dockSide === 'left' ? 'origin-bottom-left self-start' : 'origin-bottom-right self-end'
            }`}
          >
            <div className="relative rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-brand-navy/95 backdrop-blur-xl p-3.5 sm:p-4 shadow-2xl border border-teal-500/30 text-white shadow-teal-950/30 group">
              {/* Subtle ambient interior glow */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-xl pointer-events-none bg-teal-400/10" />

              {/* Bubble Header */}
              <div className="flex items-center justify-between gap-2 mb-1.5 relative z-10">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center bg-teal-400/20 border border-teal-400/40">
                    <Sparkles className="w-3 h-3 text-brand-teal" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-teal">
                    <LocalizedText en={"Engipath AI Coach"} />{' '}</span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Progress dots */}
                  <div className="flex items-center gap-1 mr-1">
                    {(STEP_TIPS[currentStep] || STEP_TIPS[1]).map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === bubbleTextIndex % (STEP_TIPS[currentStep] || STEP_TIPS[1]).length
                            ? 'bg-brand-teal w-3'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSpeechBubble(false);
                    }}
                    className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-full"
                    title={uiAttr("Dismiss tip")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tip Text with Smooth Transition on Interval Change */}
              <div className="relative z-10 min-h-[38px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${currentStep}-${bubbleTextIndex}`}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="text-xs text-slate-200 font-medium leading-relaxed tracking-tight"
                  >
                    {activeStepTip}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Bottom Actions: Cycle Tips & Open Chatbot */}
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-semibold">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setBubbleTextIndex((prev) => (prev + 1) % (STEP_TIPS[currentStep] || STEP_TIPS[1]).length);
                  }}
                  className="text-slate-400 hover:text-brand-teal cursor-pointer transition-colors flex items-center gap-1"
                >
                  <span><LocalizedText en={"Cycle tip"} /></span>
                  <ChevronRight className="w-3 h-3" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenChat();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 flex items-center gap-1 transition-all"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span><LocalizedText en={"Chat AI"} /></span>
                </button>
              </div>

              {/* Caret Tail */}
              <div
                className={`absolute -bottom-1.5 w-3.5 h-3.5 bg-slate-950 border-b border-teal-500/30 rotate-45 ${
                  dockSide === 'left' ? 'left-10 border-l' : 'right-10 border-r'
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🤖 Main Full-Bodied Robot Container (wrapped in a scale so it sits
          slightly smaller — the inner mood animations are unaffected) */}
      <div style={{ transform: 'scale(0.85)', transformOrigin: 'center bottom' }}>
      <motion.div
        ref={avatarRef}
        onClick={handleAvatarClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group flex flex-col items-center select-none"
        animate={
          mood === 'angry'
            ? {
                x: [-4, 4, -4, 4, -2, 2, 0],
                y: [0, -3, 0, -3, 0],
                rotate: [-2, 2, -2, 2, 0]
              }
            : mood === 'love'
            ? {
                y: [-4, -10, -4],
                scale: [1, 1.08, 1]
              }
            : mood === 'excited'
            ? {
                y: [0, -18, 0, -10, 0],
                scale: [1, 1.12, 1]
              }
            : mood === 'starstruck'
            ? {
                y: -12,
                scale: 1.08
              }
            : mood === 'sleepy'
            ? {
                y: [0, 4, 0],
                scaleY: [1, 0.96, 1]
              }
            : {
                y: isHovered ? -10 : [0, -8, 0],
                scale: isHovered ? 1.05 : 1
              }
        }
        transition={
          mood === 'angry'
            ? { duration: 0.5, repeat: 2 }
            : mood === 'love'
            ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
            : mood === 'excited'
            ? { duration: 0.7, repeat: 2, ease: 'easeOut' }
            : mood === 'sleepy'
            ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
            : isHovered
            ? { type: 'spring', stiffness: 260, damping: 15 }
            : { y: { repeat: Infinity, duration: 3.4, ease: 'easeInOut' } }
        }
      >
        {/* 🏷️ HEAD SECTION */}
        <motion.div
          style={{ rotate: headTilt }}
          className="relative flex flex-col items-center z-20"
        >
          {/* Top Antenna Beacon */}
          <div
            onClick={handleAntennaClick}
            title={uiAttr("Triple-click antenna to launch demo auto-pilot")}
            className="flex flex-col items-center -mb-1 relative z-10 cursor-pointer"
          >
            <motion.div
              animate={{
                scale: isHovered || mood !== 'normal' ? [1, 1.3, 1] : [1, 1.1, 1],
                backgroundColor: antennaColor
              }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_14px_rgba(6,182,212,0.9)] relative flex items-center justify-center"
              style={{ backgroundColor: antennaColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span
                className="animate-ping absolute inset-0 rounded-full opacity-60 pointer-events-none"
                style={{ backgroundColor: antennaColor }}
              />
            </motion.div>
            <div className="w-1 h-3 bg-slate-300 border-x border-slate-400/60 rounded-xs" />
          </div>

          {/* Head Chassis with Side Earphone Rings */}
          <div className="relative flex items-center">
            {/* Left Earphone Ring */}
            <div className="w-3.5 h-9 rounded-l-2xl bg-gradient-to-r from-slate-200 to-white border-2 border-r-0 border-slate-300/80 shadow-xs flex items-center justify-center -mr-0.5 z-0">
              <div
                className="w-1.5 h-5 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.85)] transition-colors duration-300"
                style={{ backgroundColor: antennaColor }}
              />
            </div>

            {/* Main Head Chassis */}
            <div className="relative w-34 h-26 sm:w-38 sm:h-28 rounded-[2.2rem] bg-white border-[3.5px] border-white shadow-[0_16px_36px_rgba(15,23,42,0.2),0_4px_12px_rgba(0,0,0,0.05),inset_0_-4px_8px_rgba(0,0,0,0.03)] overflow-hidden flex items-center justify-center p-2.5 z-10 transition-shadow group-hover:shadow-[0_22px_44px_rgba(15,23,42,0.25)]">
              {/* Optional Custom User Head Image */}
              {customBodyImg ? (
                <img
                  src={customBodyImg}
                  alt={uiAttr("Robot Mascot")}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                /* Built-in Deep Glossy Visor Screen */
                <div
                  ref={visorEmitterRef}
                  className="w-full h-full rounded-[1.6rem] bg-gradient-to-b from-slate-900 via-slate-950 to-brand-navy border border-slate-700/80 relative flex flex-col items-center justify-center p-2.5 shadow-inner overflow-hidden"
                >
                  {/* Glossy Diagonal Visor Reflection */}
                  <div className="absolute -top-10 -left-10 w-36 h-20 bg-white/12 rounded-full rotate-25 blur-xs pointer-events-none" />

                  {/* 🏷️ EXPRESSIVE, HIGH-CONTRAST EYES (Love, Angry, Excited, Starstruck, Sleepy, Normal) */}
                  <div className="w-full flex items-center justify-around relative z-20 px-3 mt-1">
                    {/* LEFT EYE */}
                    <div className="w-9 h-10 sm:w-10 sm:h-11 flex items-center justify-center relative">
                      {customLeftEyeImg ? (
                        <motion.img
                          src={customLeftEyeImg}
                          alt={uiAttr("Left Eye")}
                          className="w-full h-full object-contain pointer-events-none"
                          style={{ x: smoothEyeX, y: smoothEyeY }}
                        />
                      ) : mood === 'love' ? (
                        /* ❤️ Love: Glowing Heart Eye */
                        <motion.div
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="text-pink-400 drop-shadow-[0_0_12px_rgba(244,114,182,1)]"
                        >
                          <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-pink-400 text-pink-300" />
                        </motion.div>
                      ) : mood === 'angry' ? (
                        /* 😤 Angry: Slanted Fierce LED Brow Eye */
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          className="w-7 h-4 bg-gradient-to-r from-red-500 to-amber-400 rounded-sm shadow-[0_0_14px_rgba(239,68,68,1)] rotate-15 border-t-2 border-white"
                        />
                      ) : mood === 'excited' ? (
                        /* 🚀 Excited: Cheerful Glowing Upward Arcs */
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.4 }}
                          className="w-7 h-4 border-t-[4px] border-cyan-300 rounded-t-full shadow-[0_0_16px_rgba(6,182,212,1)]"
                        />
                      ) : mood === 'starstruck' ? (
                        /* ⭐ Starstruck: Sparkling Golden Star Eye */
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="text-2xl sm:text-3xl text-amber-300 drop-shadow-[0_0_16px_rgba(251,191,36,1)] leading-none font-bold"
                        >
                          ★
                        </motion.div>
                      ) : mood === 'sleepy' ? (
                        /* 💤 Sleepy: Droopy Relaxed Slit Eyes */
                        <motion.div
                          animate={{ scaleX: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2.5 }}
                          className="w-7 h-1.5 bg-indigo-300 rounded-full shadow-[0_0_8px_rgba(129,140,248,1)]"
                        />
                      ) : isHovered ? (
                        /* (^_^) Happy Hover Crescent Eye */
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="w-7 h-4 border-t-[4px] border-cyan-300 rounded-t-full shadow-[0_0_16px_rgba(6,182,212,1)]"
                        />
                      ) : (
                        /* 😊 NORMAL BOLD, VIBRANT GLOWING CYAN PUPIL */
                        <div className="w-8 h-9 sm:w-9 sm:h-10 rounded-[1.2rem] bg-slate-950/80 border border-cyan-500/40 flex items-center justify-center relative overflow-hidden shadow-inner">
                          <motion.div
                            style={{ x: smoothEyeX, y: smoothEyeY }}
                            animate={{ scaleY: isBlinking ? 0.08 : 1 }}
                            transition={{ duration: 0.07 }}
                            className="w-6 h-7 sm:w-7 sm:h-8 rounded-[0.9rem] bg-gradient-to-b from-cyan-200 via-cyan-400 to-teal-400 shadow-[0_0_18px_rgba(6,182,212,1)] border-2 border-white/80 flex items-center justify-center relative"
                          >
                            {/* Inner Iris Depth */}
                            <div className="w-3.5 h-4.5 rounded-full bg-cyan-900/60 shadow-inner flex items-center justify-center relative" />
                            {/* Primary Top Specular Twinkle Highlight */}
                            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                            {/* Secondary Bottom Specular Highlight */}
                            <div className="absolute bottom-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/90" />
                          </motion.div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT EYE */}
                    <div className="w-9 h-10 sm:w-10 sm:h-11 flex items-center justify-center relative">
                      {customRightEyeImg ? (
                        <motion.img
                          src={customRightEyeImg}
                          alt={uiAttr("Right Eye")}
                          className="w-full h-full object-contain pointer-events-none"
                          style={{ x: smoothEyeX, y: smoothEyeY }}
                        />
                      ) : mood === 'love' ? (
                        /* ❤️ Love: Glowing Heart Eye */
                        <motion.div
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: 0.1 }}
                          className="text-pink-400 drop-shadow-[0_0_12px_rgba(244,114,182,1)]"
                        >
                          <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-pink-400 text-pink-300" />
                        </motion.div>
                      ) : mood === 'angry' ? (
                        /* 😤 Angry: Slanted Fierce LED Brow Eye */
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          className="w-7 h-4 bg-gradient-to-l from-red-500 to-amber-400 rounded-sm shadow-[0_0_14px_rgba(239,68,68,1)] -rotate-15 border-t-2 border-white"
                        />
                      ) : mood === 'excited' ? (
                        /* 🚀 Excited: Cheerful Glowing Upward Arcs */
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.4, delay: 0.05 }}
                          className="w-7 h-4 border-t-[4px] border-cyan-300 rounded-t-full shadow-[0_0_16px_rgba(6,182,212,1)]"
                        />
                      ) : mood === 'starstruck' ? (
                        /* ⭐ Starstruck: Sparkling Golden Star Eye */
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], rotate: [0, -15, 15, 0] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.1 }}
                          className="text-2xl sm:text-3xl text-amber-300 drop-shadow-[0_0_16px_rgba(251,191,36,1)] leading-none font-bold"
                        >
                          ★
                        </motion.div>
                      ) : mood === 'sleepy' ? (
                        /* 💤 Sleepy: Droopy Relaxed Slit Eyes */
                        <motion.div
                          animate={{ scaleX: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2.5, delay: 0.1 }}
                          className="w-7 h-1.5 bg-indigo-300 rounded-full shadow-[0_0_8px_rgba(129,140,248,1)]"
                        />
                      ) : isHovered ? (
                        /* (^_^) Happy Hover Crescent Eye */
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="w-7 h-4 border-t-[4px] border-cyan-300 rounded-t-full shadow-[0_0_16px_rgba(6,182,212,1)]"
                        />
                      ) : (
                        /* 😊 NORMAL BOLD, VIBRANT GLOWING CYAN PUPIL */
                        <div className="w-8 h-9 sm:w-9 sm:h-10 rounded-[1.2rem] bg-slate-950/80 border border-cyan-500/40 flex items-center justify-center relative overflow-hidden shadow-inner">
                          <motion.div
                            style={{ x: smoothEyeX, y: smoothEyeY }}
                            animate={{ scaleY: isBlinking ? 0.08 : 1 }}
                            transition={{ duration: 0.07 }}
                            className="w-6 h-7 sm:w-7 sm:h-8 rounded-[0.9rem] bg-gradient-to-b from-cyan-200 via-cyan-400 to-teal-400 shadow-[0_0_18px_rgba(6,182,212,1)] border-2 border-white/80 flex items-center justify-center relative"
                          >
                            {/* Inner Iris Depth */}
                            <div className="w-3.5 h-4.5 rounded-full bg-cyan-900/60 shadow-inner flex items-center justify-center relative" />
                            {/* Primary Top Specular Twinkle Highlight */}
                            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                            {/* Secondary Bottom Specular Highlight */}
                            <div className="absolute bottom-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/90" />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 🏷️ Cute Rosy Blushing Cheeks */}
                  <div className="w-full flex items-center justify-between px-3 mt-1.5 z-10">
                    <motion.div
                      animate={{
                        opacity: mood === 'love' ? 1 : isHovered ? 0.9 : 0.45,
                        scale: mood === 'love' ? 1.4 : isHovered ? 1.2 : 1,
                        backgroundColor: mood === 'angry' ? '#F97316' : '#FB7185'
                      }}
                      className="w-4 h-2 rounded-full blur-[0.6px] shadow-[0_0_8px_rgba(251,113,133,0.85)]"
                    />
                    <motion.div
                      animate={{
                        opacity: mood === 'love' ? 1 : isHovered ? 0.9 : 0.45,
                        scale: mood === 'love' ? 1.4 : isHovered ? 1.2 : 1,
                        backgroundColor: mood === 'angry' ? '#F97316' : '#FB7185'
                      }}
                      className="w-4 h-2 rounded-full blur-[0.6px] shadow-[0_0_8px_rgba(251,113,133,0.85)]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Earphone Ring */}
            <div className="w-3.5 h-9 rounded-r-2xl bg-gradient-to-l from-slate-200 to-white border-2 border-l-0 border-slate-300/80 shadow-xs flex items-center justify-center -ml-0.5 z-0">
              <div
                className="w-1.5 h-5 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.85)] transition-colors duration-300"
                style={{ backgroundColor: antennaColor }}
              />
            </div>
          </div>
        </motion.div>

        {/* Flexible Robotic Neck Joint */}
        <div className="w-6 h-2 bg-slate-300 border-x-2 border-slate-400/80 rounded-full -my-0.5 z-15 shadow-inner" />

        {/* 🏷️ SLEEK SIMPLIFIED CAPSULE TORSO WITH FLOATING MITTEN HANDS */}
        <motion.div
          style={{ rotate: bodyTilt }}
          className="relative flex items-center justify-center z-10"
        >
          {/* Left Magnetic Floating Mitten Hand */}
          <motion.div
            animate={
              mood === 'excited'
                ? { y: [-6, -16, -6], rotate: -30 }
                : mood === 'sleepy'
                ? { y: 2, rotate: -4 }
                : {
                    y: isHovered ? [0, -4, 0] : [-2, 3, -2],
                    rotate: isHovered ? -12 : -6
                  }
            }
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="w-5 h-8 sm:w-6 sm:h-9 rounded-2xl bg-white border-2 border-slate-200 shadow-md flex items-center justify-center -mr-2.5 z-0"
          >
            <div
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.7)] transition-colors"
              style={{ backgroundColor: antennaColor }}
            />
          </motion.div>

          {/* Sleek Minimalist Egg/Capsule Torso */}
          <div className="relative w-22 h-18 sm:w-26 sm:h-22 rounded-[1.8rem] rounded-b-[2.2rem] bg-white border-[3px] border-white shadow-[0_12px_28px_rgba(15,23,42,0.16),0_3px_8px_rgba(0,0,0,0.04),inset_0_-4px_8px_rgba(0,0,0,0.03)] overflow-hidden flex items-center justify-center p-2 z-10">
            <div className="w-full h-full rounded-[1.4rem] rounded-b-[1.8rem] bg-gradient-to-b from-slate-50 via-white to-slate-100/90 border border-slate-200/90 flex flex-col items-center justify-center relative shadow-inner p-2">
              {/* Sleek Minimalist Glowing Power Core Dot */}
              <motion.div
                animate={{
                  scale: mood !== 'normal' || isHovered ? [1, 1.35, 1] : [1, 1.15, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-4 h-4 rounded-full border-2 border-white shadow-[0_0_10px_rgba(6,182,212,0.85)] flex items-center justify-center transition-colors"
                style={{ backgroundColor: antennaColor }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </motion.div>

              {/* Minimal Subtle Accent Light Line */}
              <div
                className="w-8 h-1 rounded-full mt-2 shadow-[0_0_6px_rgba(6,182,212,0.4)] transition-colors"
                style={{ backgroundColor: `${antennaColor}80` }}
              />
            </div>
          </div>

          {/* Right Magnetic Floating Mitten Hand */}
          <motion.div
            animate={
              mood === 'excited'
                ? { y: [-6, -16, -6], rotate: 30 }
                : mood === 'sleepy'
                ? { y: 2, rotate: 4 }
                : isHovered
                ? { y: [-3, 3, -3], rotate: [20, -25, 20], scale: 1.15 }
                : { y: [2, -3, 2], rotate: 6 }
            }
            transition={
              isHovered
                ? { repeat: Infinity, duration: 0.45 }
                : { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
            }
            className="w-5 h-8 sm:w-6 sm:h-9 rounded-2xl bg-white border-2 border-slate-200 shadow-md flex items-center justify-center -ml-2.5 z-0 origin-bottom"
          >
            <div
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.7)] transition-colors"
              style={{ backgroundColor: antennaColor }}
            />
          </motion.div>
        </motion.div>

        {/* Sleek Little Hover Thruster Pod Base */}
        <div className="flex items-center gap-3 -mt-1 z-5">
          <div className="w-4 h-2 rounded-full bg-slate-200 border border-slate-300 shadow-xs flex items-center justify-center">
            <div
              className="w-2 h-1 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.9)] transition-colors"
              style={{ backgroundColor: antennaColor }}
            />
          </div>
          <div className="w-4 h-2 rounded-full bg-slate-200 border border-slate-300 shadow-xs flex items-center justify-center">
            <div
              className="w-2 h-1 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.9)] transition-colors"
              style={{ backgroundColor: antennaColor }}
            />
          </div>
        </div>

        {/* 🏷️ Responsive Ground Drop Shadow */}
        <motion.div
          animate={{
            scale: isHovered || mood !== 'normal' ? 0.7 : [1, 0.85, 1],
            opacity: isHovered ? 0.2 : [0.35, 0.2, 0.35]
          }}
          transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut' }}
          className="w-24 sm:w-28 h-3 bg-slate-950 rounded-full blur-xs mt-2 pointer-events-none"
        />
      </motion.div>
      </div>
    </motion.div>
    )}
  </AnimatePresence>
  </>
  );
};
