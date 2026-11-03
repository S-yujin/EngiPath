import { LocalizedText, uiAttr, translateUi } from '../../i18n/uiText';
import { useApp } from '../../context/AppContext';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Network,
  Info,
  Search,
  ArrowRight,
  Activity,
  Zap,
  Layers
} from 'lucide-react';
import { DreamJob, CompetencyScores, UserProfile, ActionPlan } from '../../types';

interface LatticeNode {
  id: string;
  label: string;
  category: 'role' | 'core_competency' | 'skill' | 'course' | 'sprint';
  competencyKey?: keyof CompetencyScores;
  cluster: number;
  x3d: number;
  y3d: number;
  z3d: number;
  radius: number;
  color: string;
  proficiency?: number;
  source?: string;
  description: string;
  connections: string[];
}

interface LatticeEdge {
  sourceId: string;
  targetId: string;
  weight: number;
  color?: string;
}

interface SkillLatticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJob: DreamJob | null;
  profile: UserProfile;
  actionPlan: ActionPlan;
  currentScores: CompetencyScores;
}

export const SkillLatticeModal: React.FC<SkillLatticeModalProps> = ({
  isOpen,
  onClose,
  selectedJob,
  profile,
  actionPlan,
  currentScores
}) => {
  const { language } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction State
  const [rotationX, setRotationX] = useState<number>(0.15);
  const [rotationY, setRotationY] = useState<number>(0.4);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Construct Structured, Sparse, Non-overlapping Knowledge Graph
  const { nodes, edges } = useMemo(() => {
    const jobTitle = selectedJob?.title || 'Robotics Systems Engineer';

    const rawNodes: LatticeNode[] = [];
    const rawEdges: LatticeEdge[] = [];

    // Central Core Hub: Target Dream Job (Nucleus)
    rawNodes.push({
      id: 'target-role',
      label: jobTitle,
      category: 'role',
      cluster: 0,
      x3d: 0,
      y3d: 0,
      z3d: 0,
      radius: 18,
      color: '#14b8a6', // Teal
      proficiency: 90,
      source: 'Target Goal',
      description: `Target objective. All competencies, sprint artifacts, and coursework feed directly into this role benchmark.`,
      connections: []
    });

    // 6 Primary Competency Hubs (Arranged in a wide, sparse ring)
    const competencyDefs: Array<{
      key: keyof CompetencyScores;
      label: string;
      color: string;
      angle: number;
      yOffset: number;
    }> = [
      { key: 'programming', label: 'Programming & CS', color: '#38bdf8', angle: 0, yOffset: -20 },
      { key: 'prototyping', label: 'Physical Prototyping', color: '#fbbf24', angle: (Math.PI * 2) / 6, yOffset: 25 },
      { key: 'technicalFundamentals', label: 'Technical Fundamentals', color: '#818cf8', angle: ((Math.PI * 2) / 6) * 2, yOffset: -30 },
      { key: 'systemsThinking', label: 'Systems Thinking', color: '#34d399', angle: ((Math.PI * 2) / 6) * 3, yOffset: 20 },
      { key: 'learningAgility', label: 'Learning Agility', color: '#f472b6', angle: ((Math.PI * 2) / 6) * 4, yOffset: -15 },
      { key: 'communication', label: 'Communication & Teamwork', color: '#a78bfa', angle: ((Math.PI * 2) / 6) * 5, yOffset: 30 }
    ];

    const ringRadius = 155; // Expanded sparse radius
    competencyDefs.forEach((comp, idx) => {
      const x = Math.cos(comp.angle) * ringRadius;
      const y = comp.yOffset;
      const z = Math.sin(comp.angle) * ringRadius;

      rawNodes.push({
        id: `comp-${comp.key}`,
        label: comp.label,
        category: 'core_competency',
        competencyKey: comp.key,
        cluster: idx + 1,
        x3d: x,
        y3d: y,
        z3d: z,
        radius: 12,
        color: comp.color,
        proficiency: currentScores[comp.key] || 75,
        source: 'Core Competency Pillar',
        description: `Score: ${currentScores[comp.key] || 75}/100. Core pillar validating engineering foundation.`,
        connections: ['target-role']
      });

      rawEdges.push({
        sourceId: 'target-role',
        targetId: `comp-${comp.key}`,
        weight: 3.5,
        color: comp.color
      });
    });

    // Outer Leaf Skills (Sparsely positioned around their parent competency)
    const skillClusters: Record<string, Array<{ id: string; label: string; desc: string }>> = {
      programming: [
        { id: 'skill-ros', label: 'ROS2 Architecture', desc: 'Distributed robotic nodes, pub-sub telemetry, and services.' },
        { id: 'skill-cpp', label: 'C++ Firmware', desc: 'Real-time motor drivers, pointer safety, and deterministic loops.' },
        { id: 'skill-python', label: 'Python Automation', desc: 'Data parsing, test scripts, and regression verification.' }
      ],
      prototyping: [
        { id: 'skill-cad', label: 'SolidWorks CAD', desc: 'Parametric modeling, GD&T tolerance fit, and stress FEA.' },
        { id: 'skill-fab', label: '3D Fabrication', desc: 'Additive rapid prototyping and laser-cut custom chassis.' },
        { id: 'skill-pcb', label: 'Actuator Circuits', desc: 'PWM H-bridge drivers, sensor telemetry, and power rails.' }
      ],
      technicalFundamentals: [
        { id: 'skill-dyn', label: 'State-Space Dynamics', desc: 'Feedback stability, Laplace transforms, and PID loops.' },
        { id: 'skill-thermo', label: 'Thermodynamics', desc: 'Heat dissipation modeling and mechanical boundary stresses.' }
      ],
      systemsThinking: [
        { id: 'skill-sys', label: 'Interface Architecture', desc: 'Modular cross-subsystem budgets, trade-offs, and signal routing.' },
        { id: 'skill-ci', label: 'Automated CI/CD', desc: 'Automated build tests and continuous regression pipelines.' }
      ],
      learningAgility: [
        { id: 'skill-toy', label: 'Toy Prototyping', desc: 'Rapidly building minimal standalone spikes to master new stacks.' }
      ],
      communication: [
        { id: 'skill-doc', label: 'Technical Specs', desc: 'Engineering documentation, block diagrams, and team syncs.' }
      ]
    };

    Object.entries(skillClusters).forEach(([compKey, skills]) => {
      const parentNode = rawNodes.find((n) => n.id === `comp-${compKey}`);
      if (!parentNode) return;

      const subRingDist = 80;
      skills.forEach((s, sIdx) => {
        const spreadAngle = (sIdx - (skills.length - 1) / 2) * 0.7;
        const baseAngle = Math.atan2(parentNode.z3d, parentNode.x3d);
        const nodeAngle = baseAngle + spreadAngle;

        const x = parentNode.x3d + Math.cos(nodeAngle) * subRingDist;
        const y = parentNode.y3d + (sIdx % 2 === 0 ? 35 : -35);
        const z = parentNode.z3d + Math.sin(nodeAngle) * subRingDist;

        rawNodes.push({
          id: s.id,
          label: s.label,
          category: 'skill',
          competencyKey: compKey as any,
          cluster: parentNode.cluster,
          x3d: x,
          y3d: y,
          z3d: z,
          radius: 7,
          color: parentNode.color,
          proficiency: 84,
          source: 'Demonstrated Sub-Skill',
          description: s.desc,
          connections: [parentNode.id]
        });

        rawEdges.push({
          sourceId: parentNode.id,
          targetId: s.id,
          weight: 1.6,
          color: parentNode.color
        });
      });
    });

    // Transcript Courses (Arranged above in upper hemisphere)
    const courses = profile.transcriptData?.courses || [
      { code: 'ME 320', name: 'Dynamic Systems & Feedback Control', competency: 'systemsThinking' as const, grade: 'A' },
      { code: 'CS 210', name: 'Data Structures & Algorithms', competency: 'programming' as const, grade: 'A' },
      { code: 'ENGR 250', name: 'CAD Prototyping Lab', competency: 'prototyping' as const, grade: 'A-' }
    ];

    courses.slice(0, 3).forEach((c, cIdx) => {
      const parentComp = `comp-${c.competency}`;
      const parentNode = rawNodes.find((n) => n.id === parentComp);
      const x = (parentNode?.x3d || 0) * 0.8;
      const y = -135 - cIdx * 25;
      const z = (parentNode?.z3d || 0) * 0.8;

      const courseId = `course-${c.code.replace(/\s+/g, '-').toLowerCase()}`;
      rawNodes.push({
        id: courseId,
        label: `${c.code}: ${c.name}`,
        category: 'course',
        competencyKey: c.competency,
        cluster: parentNode?.cluster || 1,
        x3d: x,
        y3d: y,
        z3d: z,
        radius: 6,
        color: '#e2e8f0',
        source: `Transcript Verified (Grade: ${c.grade})`,
        description: `Academic foundation validating theoretical rigor in ${c.name}.`,
        connections: [parentComp]
      });

      rawEdges.push({
        sourceId: parentComp,
        targetId: courseId,
        weight: 1.4,
        color: '#cbd5e1'
      });
    });

    // Active 4–8 Week Sprints (Arranged below in lower hemisphere)
    actionPlan.shortTerm.forEach((action, aIdx) => {
      const sprintId = `sprint-${action.id}`;
      const angle = (aIdx * (Math.PI * 2)) / Math.max(1, actionPlan.shortTerm.length) + 0.5;
      const dist = 120;
      const x = Math.cos(angle) * dist;
      const y = 125 + aIdx * 20;
      const z = Math.sin(angle) * dist;

      rawNodes.push({
        id: sprintId,
        label: `Sprint: ${action.title}`,
        category: 'sprint',
        cluster: 9,
        x3d: x,
        y3d: y,
        z3d: z,
        radius: 9,
        color: action.completed ? '#10b981' : '#f59e0b',
        source: action.completed ? 'Completed Sprint Deliverable' : 'Active 4–8 Wk Sprint',
        description: action.description || 'Tangible milestone artifact feeding directly into target job readiness.',
        connections: ['target-role', 'comp-prototyping', 'comp-programming']
      });

      rawEdges.push({
        sourceId: 'target-role',
        targetId: sprintId,
        weight: 2.5,
        color: action.completed ? '#10b981' : '#f59e0b'
      });

      if (aIdx === 0) {
        rawEdges.push({ sourceId: sprintId, targetId: 'skill-ros', weight: 1.5, color: '#14b8a6' });
      }
    });

    return { nodes: rawNodes, edges: rawEdges };
  }, [selectedJob, profile, actionPlan, currentScores]);

  // Filtered nodes
  const filteredNodeIds = useMemo(() => {
    return new Set(
      nodes
        .filter((n) => {
          if (selectedClusterFilter !== 'all' && n.category !== 'role') {
            if (n.category !== selectedClusterFilter && n.competencyKey !== selectedClusterFilter) {
              return false;
            }
          }
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q);
          }
          return true;
        })
        .map((n) => n.id)
    );
  }, [nodes, selectedClusterFilter, searchQuery]);

  // 2. 3D Canvas Projection with Slow Stable Orbit & Knowledge Feedback Flow
  useEffect(() => {
    if (!isOpen) return;

    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let currentRotX = rotationX;
    let currentRotY = rotationY;

    const render = () => {
      // Very slow, subtle gentle orbit (0.0006)
      if (autoRotate && !isDragging) {
        currentRotY += 0.0006;
        setRotationY(currentRotY);
      } else {
        currentRotX = rotationX;
        currentRotY = rotationY;
      }

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Subtle cyber matrix grid
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.03)';
      ctx.lineWidth = 1;
      const gridStep = 48;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3D Matrix Math
      const cosY = Math.cos(currentRotY);
      const sinY = Math.sin(currentRotY);
      const cosX = Math.cos(currentRotX);
      const sinX = Math.sin(currentRotX);
      const fov = 480 * zoom;

      const projectedNodes = nodes.map((node) => {
        const x1 = node.x3d * cosY - node.z3d * sinY;
        const z1 = node.z3d * cosY + node.x3d * sinY;
        const y2 = node.y3d * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y3d * sinX;

        const distance = 420 + z2;
        const scale = fov / Math.max(80, distance);
        const projX = centerX + x1 * scale;
        const projY = centerY + y2 * scale;
        const radius = Math.max(3, node.radius * scale * 0.85);
        const depthAlpha = Math.max(0.2, Math.min(1, (z2 + 280) / 500));

        return {
          ...node,
          projX,
          projY,
          radius,
          zDepth: z2,
          depthAlpha,
          isVisible: filteredNodeIds.has(node.id)
        };
      });

      projectedNodes.sort((a, b) => a.zDepth - b.zDepth);
      const projectedMap = new Map(projectedNodes.map((p) => [p.id, p]));

      const now = Date.now();

      // Render Edges with Continuous Knowledge Feedback Flow
      edges.forEach((edge, eIdx) => {
        const source = projectedMap.get(edge.sourceId);
        const target = projectedMap.get(edge.targetId);
        if (!source || !target) return;

        const isHighlighted =
          hoveredNodeId === edge.sourceId ||
          hoveredNodeId === edge.targetId ||
          selectedNodeId === edge.sourceId ||
          selectedNodeId === edge.targetId;

        const isFilteredOut = !source.isVisible || !target.isVisible;
        const baseAlpha = isFilteredOut ? 0.04 : Math.min(source.depthAlpha, target.depthAlpha) * 0.45;
        const edgeAlpha = isHighlighted ? 0.95 : baseAlpha;

        ctx.beginPath();
        ctx.moveTo(source.projX, source.projY);
        ctx.lineTo(target.projX, target.projY);
        ctx.strokeStyle = isHighlighted ? '#2dd4bf' : edge.color || 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = isHighlighted ? 2.5 : Math.max(0.6, edge.weight * 0.75);
        ctx.globalAlpha = edgeAlpha;
        ctx.stroke();

        // Knowledge Feeding Back Particles (Continuous flow from leaves -> core -> target hub)
        if (!isFilteredOut) {
          const speed = 2400;
          const particleProgress = ((now + eIdx * 380) % speed) / speed;
          // Reverse direction: feed inwards toward target or parent
          const pX = target.projX + (source.projX - target.projX) * particleProgress;
          const pY = target.projY + (source.projY - target.projY) * particleProgress;

          ctx.beginPath();
          ctx.arc(pX, pY, isHighlighted ? 3 : 1.8, 0, Math.PI * 2);
          ctx.fillStyle = isHighlighted ? '#5eead4' : '#2dd4bf';
          ctx.globalAlpha = isHighlighted ? 0.95 : edgeAlpha * 0.85;
          ctx.shadowColor = '#2dd4bf';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Render Nodes (Clean Spheres + Halos)
      projectedNodes.forEach((node) => {
        const isHovered = hoveredNodeId === node.id;
        const isSelected = selectedNodeId === node.id;
        const nodeAlpha = node.isVisible ? (isHovered || isSelected ? 1 : node.depthAlpha) : 0.08;

        ctx.globalAlpha = nodeAlpha;

        // Concentric Radiating Feedback Rings for Master Hub
        if (node.category === 'role') {
          const ringScale = ((now % 3000) / 3000) * 28 + node.radius;
          const ringAlpha = (1 - (now % 3000) / 3000) * 0.4;
          ctx.beginPath();
          ctx.arc(node.projX, node.projY, ringScale, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(45, 212, 191, ${ringAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Halo
        if (isHovered || isSelected || node.category === 'role') {
          ctx.beginPath();
          ctx.arc(node.projX, node.projY, node.radius * 2.2, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            node.projX,
            node.projY,
            node.radius * 0.4,
            node.projX,
            node.projY,
            node.radius * 2.2
          );
          gradient.addColorStop(0, node.color);
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Inner Core Sphere
        ctx.beginPath();
        ctx.arc(node.projX, node.projY, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isHovered || isSelected ? 16 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(node.projX, node.projY, node.radius, 0, Math.PI * 2);
        ctx.lineWidth = isSelected ? 2.5 : 1;
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        // Node Typography
        const shouldShowLabel =
          node.radius > 5.5 &&
          node.isVisible &&
          (isHovered || isSelected || node.category === 'role' || node.category === 'core_competency' || zoom > 1.15);

        if (shouldShowLabel) {
          ctx.font = `${node.category === 'role' ? 'bold 12px' : node.category === 'core_competency' ? 'bold 10px' : '9px'} "Inter", system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          const textMetrics = ctx.measureText(node.label);
          const textWidth = textMetrics.width;
          const labelY = node.projY + node.radius + 4;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.fillRect(node.projX - textWidth / 2 - 4, labelY - 1, textWidth + 8, 14);

          ctx.fillStyle = isHovered || isSelected ? '#ffffff' : node.category === 'role' ? '#2dd4bf' : '#e2e8f0';
          ctx.fillText(node.label, node.projX, labelY);
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, nodes, edges, rotationX, rotationY, zoom, autoRotate, isDragging, hoveredNodeId, selectedNodeId, filteredNodeIds]);

  // Drag & Click Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getContext('2d')?.canvas.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setRotationY((prev) => prev + deltaX * 0.007);
      setRotationX((prev) => Math.max(-1.1, Math.min(1.1, prev + deltaY * 0.007)));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      const fov = 480 * zoom;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);

      let foundNode: string | null = null;
      for (const node of nodes) {
        const x1 = node.x3d * cosY - node.z3d * sinY;
        const z1 = node.z3d * cosY + node.x3d * sinY;
        const y2 = node.y3d * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y3d * sinX;
        const scale = fov / Math.max(80, 420 + z2);
        const projX = centerX + x1 * scale;
        const projY = centerY + y2 * scale;
        const hitRadius = Math.max(12, node.radius * scale + 4);

        const dist = Math.hypot(mouseX - projX, mouseY - projY);
        if (dist < hitRadius) {
          foundNode = node.id;
          break;
        }
      }
      setHoveredNodeId(foundNode);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = () => {
    if (hoveredNodeId) {
      setSelectedNodeId(hoveredNodeId === selectedNodeId ? null : hoveredNodeId);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.6, Math.min(2.2, prev - e.deltaY * 0.001)));
  };

  const activeNodeDetails = useMemo(() => {
    return nodes.find((n) => n.id === (selectedNodeId || hoveredNodeId));
  }, [selectedNodeId, hoveredNodeId, nodes]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 pt-16 sm:pt-20 bg-slate-950/90 backdrop-blur-2xl animate-fadeIn font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-6xl h-[calc(100vh-5.5rem)] max-h-[820px] rounded-3xl bg-slate-950 border border-teal-500/30 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 text-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span><LocalizedText en={"3D Competency & Skill Synapse Lattice"} /></span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono border border-teal-500/30 flex items-center gap-1">
                    <Activity className="w-3 h-3 animate-pulse" />
                    <span><LocalizedText en={"Knowledge Feedback Active"} /></span>
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  <LocalizedText en={"Visualizing how your courses, sprints, and sub-skills continuously converge into"} />{' '}{selectedJob?.title || 'Target Role'}
                </p>
              </div>
            </div>

            {/* Quick Filter & Close */}
            <div className="flex items-center gap-2.5">
              <div className="relative hidden md:block">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={uiAttr("Filter nodes...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-44"
                />
              </div>

              <select
                value={selectedClusterFilter}
                onChange={(e) => setSelectedClusterFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 font-bold focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all"><LocalizedText en={"All Clusters ("} />{nodes.length} <LocalizedText en={"Nodes)"} /></option>
                <option value="programming"><LocalizedText en={"Programming & CS"} /></option>
                <option value="prototyping"><LocalizedText en={"Physical Prototyping"} /></option>
                <option value="technicalFundamentals"><LocalizedText en={"Technical Fundamentals"} /></option>
                <option value="systemsThinking"><LocalizedText en={"Systems Thinking"} /></option>
                <option value="sprint"><LocalizedText en={"Active Sprints"} /></option>
                <option value="course"><LocalizedText en={"Transcript Courses"} /></option>
              </select>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={uiAttr("Close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main 3D Canvas Area */}
          <div className="relative flex-1 bg-slate-950 overflow-hidden select-none">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={handleCanvasClick}
              onWheel={handleWheel}
              className="w-full h-full cursor-grab active:cursor-grabbing block"
            />

            {/* Top Left Floating Graph Controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              <div className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col gap-1 text-slate-300 text-xs">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
                  className="p-2 hover:bg-slate-800 rounded-lg hover:text-teal-300 transition-colors cursor-pointer"
                  title={uiAttr("Zoom In")}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                  className="p-2 hover:bg-slate-800 rounded-lg hover:text-teal-300 transition-colors cursor-pointer"
                  title={uiAttr("Zoom Out")}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRotationX(0.15);
                    setRotationY(0.4);
                    setZoom(1.0);
                    setAutoRotate(true);
                  }}
                  className="p-2 hover:bg-slate-800 rounded-lg hover:text-teal-300 transition-colors cursor-pointer"
                  title={uiAttr("Reset Orientation")}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setAutoRotate(!autoRotate)}
                className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold transition-all border ${
                  autoRotate
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800'
                }`}
              >
                {autoRotate ? translateUi('Drift: On', language) : translateUi('Drift: Paused', language)}
              </button>
            </div>

            {/* Bottom Left Legend */}
            <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-md text-[10px] text-slate-400 font-mono space-y-1.5 hidden sm:block pointer-events-none">
              <span className="font-bold text-slate-200 uppercase tracking-wider block mb-1 text-[9px]">
                <LocalizedText en={"Knowledge Lattice Hierarchy"} />{' '}</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-400" />
                <span><LocalizedText en={"Target Role Master Hub"} /></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span><LocalizedText en={"6 Core Competency Pillars"} /></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span><LocalizedText en={"Active 4–8 Wk Sprint Artifacts"} /></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span><LocalizedText en={"Coursework & Technical Sub-Skills"} /></span>
              </div>
            </div>

            {/* Right Side: Selected Node Inspector Panel */}
            <AnimatePresence>
              {activeNodeDetails && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-4 right-4 w-72 sm:w-80 p-4 rounded-2xl bg-slate-900/95 border border-teal-500/40 backdrop-blur-xl shadow-2xl text-xs space-y-3 z-10 font-sans"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: activeNodeDetails.color }}
                      />
                      <div>
                        <h4 className="font-extrabold text-white text-sm leading-tight">
                          {activeNodeDetails.label}
                        </h4>
                        <span className="text-[10px] text-teal-400 font-mono uppercase tracking-wider">
                          {activeNodeDetails.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNodeId(null);
                        setHoveredNodeId(null);
                      }}
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        <LocalizedText en={"Source Evidence"} />{' '}</span>
                      <p className="text-slate-200 text-xs font-semibold mt-0.5">
                        {activeNodeDetails.source || 'Session Model Calibration'}
                      </p>
                    </div>

                    {activeNodeDetails.proficiency !== undefined && (
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span><LocalizedText en={"Triangulated Strength"} /></span>
                          <span className="font-bold text-teal-300">{activeNodeDetails.proficiency}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
                            style={{ width: `${activeNodeDetails.proficiency}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        <LocalizedText en={"Role Convergence Context"} />{' '}</span>
                      <p className="text-slate-300 text-xs leading-relaxed mt-0.5">
                        {activeNodeDetails.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span><LocalizedText en={"Direct Synaptic Links:"} />{' '}{activeNodeDetails.connections.length + 1}</span>
                    <span className="text-teal-400 flex items-center gap-0.5">
                      <span><LocalizedText en={"Knowledge feeding inward"} /></span>
                      <Zap className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Guide */}
          <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-400" />
              <span><LocalizedText en={"Particles continuously flow along synaptic edges to show knowledge integration into the target role"} /></span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all text-xs cursor-pointer shadow-sm"
            >
              <LocalizedText en={"Done Exploring"} />{' '}</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
