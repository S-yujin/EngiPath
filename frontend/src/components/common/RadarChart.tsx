import { LocalizedText, uiAttr, translateUi } from '../../i18n/uiText';
import { localizeCareerTitle } from '../../i18n/careerLocalization';
import { useApp } from '../../context/AppContext';
import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { CompetencyScores, DreamJob } from '../../types';
import { Eye, TrendingUp, Target, Layers } from 'lucide-react';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  currentScores: CompetencyScores;
  previousScores?: CompetencyScores | null;
  targetJob?: DreamJob | null;
  height?: number;
  showLegend?: boolean;
  showFilterTabs?: boolean;
  className?: string;
  cycleNumber?: number;
  darkMode?: boolean;
}

type ViewMode = 'all' | 'growth' | 'target';

export const RadarChart: React.FC<RadarChartProps> = ({
  currentScores,
  previousScores,
  targetJob,
  height = 340,
  showLegend = true,
  showFilterTabs = true,
  className = '',
  cycleNumber = 1,
  darkMode = false,
}) => {
  const { language } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [hiddenLayers, setHiddenLayers] = useState<{ [key: string]: boolean }>({});

  const hasPrevious = Boolean(previousScores && cycleNumber > 1);

  const toggleLayer = (layerKey: string) => {
    setHiddenLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const labels = [
    'Technical Fundamentals',
    'Programming',
    'Prototyping',
    'Systems Thinking',
    'Communication',
    'Learning Agility'
  ].map((label) => translateUi(label, language));
  const currentLabel = cycleNumber > 1
    ? (language === 'ko' ? `현재 역량 (${cycleNumber}회차)` : `Current (Cycle ${cycleNumber})`)
    : translateUi('Your Current Vector', language);
  const targetLabel = targetJob
    ? (language === 'ko' ? `목표: ${localizeCareerTitle(targetJob.id, targetJob.title, language)}` : `Target: ${targetJob.title}`)
    : translateUi('Target Competency', language);

  const currentData = [
    currentScores.technicalFundamentals,
    currentScores.programming,
    currentScores.prototyping,
    currentScores.systemsThinking,
    currentScores.communication,
    currentScores.learningAgility
  ];

  const targetData = targetJob
    ? [
        targetJob.targetScores.technicalFundamentals,
        targetJob.targetScores.programming,
        targetJob.targetScores.prototyping,
        targetJob.targetScores.systemsThinking,
        targetJob.targetScores.communication,
        targetJob.targetScores.learningAgility
      ]
    : [85, 80, 75, 80, 70, 75];

  const previousData = previousScores
    ? [
        previousScores.technicalFundamentals,
        previousScores.programming,
        previousScores.prototyping,
        previousScores.systemsThinking,
        previousScores.communication,
        previousScores.learningAgility
      ]
    : null;

  const datasets = useMemo(() => {
    const list: any[] = [];

    // 1. Current Cycle (Always vibrant solid teal with translucent fill)
    if (!hiddenLayers['current']) {
      list.push({
        label: currentLabel,
        data: currentData,
        backgroundColor: darkMode ? 'rgba(45, 212, 191, 0.32)' : 'rgba(13, 148, 136, 0.22)',
        borderColor: darkMode ? '#2dd4bf' : '#0D9488',
        borderWidth: 3,
        pointStyle: 'circle',
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: darkMode ? '#2dd4bf' : '#0D9488',
        pointBorderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 7,
        order: 1
      });
    }

    // 2. Initial / Prior Baseline (Optional Layer: Crisp Indigo Dashed Outline)
    if (hasPrevious && viewMode !== 'target' && !hiddenLayers['baseline']) {
      list.push({
        label: language === 'ko' ? '초기 기준 (1회차)' : 'Initial Baseline (Cycle 1)',
        data: previousData,
        backgroundColor: 'transparent',
        borderColor: '#818cf8',
        borderWidth: 2.2,
        borderDash: [4, 4],
        pointStyle: 'circle',
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#818cf8',
        pointBorderWidth: 2.5,
        pointRadius: 4.5,
        pointHoverRadius: 6.5,
        order: 2
      });
    }

    // 3. Target Competency: Crisp Amber Dashed Outline, ZERO background fill to avoid yellow tint!
    if (viewMode !== 'growth' && !hiddenLayers['target']) {
      list.push({
        label: targetLabel,
        data: targetData,
        backgroundColor: 'transparent',
        borderColor: '#fbbf24',
        borderWidth: 2.2,
        borderDash: [6, 4],
        pointStyle: 'rectRot',
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5,
        pointRadius: 5,
        pointHoverRadius: 7,
        order: 3
      });
    }

    return list;
  }, [currentData, previousData, targetData, hasPrevious, cycleNumber, viewMode, hiddenLayers, targetJob, darkMode, language, currentLabel, targetLabel]);

  const data = {
    labels,
    datasets
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // We use our custom high-contrast interactive legend below
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: {
          family: 'Inter',
          size: 12,
          weight: 'bold'
        },
        bodyFont: {
          family: 'Inter',
          size: 11
        },
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (context) => {
            const val = context.raw as number;
            const idx = context.dataIndex;
            let label = ` ${context.dataset.label}: ${val}%`;

            // If hovering on current score and prior baseline exists, display growth delta
            if (hasPrevious && previousData && context.dataset.label === currentLabel) {
              const prev = previousData[idx] || 0;
              const delta = val - prev;
              if (delta !== 0) {
                label += language === 'ko' ? ` (초기 대비 ${delta > 0 ? `+${delta}` : delta}%p)` : ` (${delta > 0 ? `+${delta}` : delta}% vs C1)`;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          display: false,
          backdropColor: 'transparent'
        },
        angleLines: {
          color: darkMode ? 'rgba(255, 255, 255, 0.22)' : 'rgba(203, 213, 225, 0.6)',
          lineWidth: 1
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(226, 232, 240, 0.8)',
          lineWidth: 1
        },
        pointLabels: {
          font: {
            family: 'Inter',
            size: 11,
            weight: 700
          },
          color: darkMode ? '#ffffff' : '#334155'
        }
      }
    },
    animation: {
      duration: 500,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className={`space-y-3 w-full ${className}`}>
      {/* Interactive View Filter Tabs (When prior cycle baseline exists) */}
      {hasPrevious && showFilterTabs && (
        <div
          className={`flex items-center justify-center gap-1.5 p-1 rounded-xl border text-[11px] font-bold ${
            darkMode
              ? 'bg-slate-800/90 border-slate-700/80 text-slate-300'
              : 'bg-slate-100/90 border-slate-200/80 text-slate-600'
          }`}
        >
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'all'
                ? darkMode
                  ? 'bg-slate-700 text-white shadow-xs ring-1 ring-slate-600'
                  : 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : darkMode
                ? 'text-slate-400 hover:text-white'
                : 'hover:text-slate-900 text-slate-500'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span><LocalizedText en={"All Overlays"} /></span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('growth')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'growth'
                ? darkMode
                  ? 'bg-teal-950/80 text-teal-300 shadow-xs ring-1 ring-teal-500/50'
                  : 'bg-white text-teal-700 shadow-xs ring-1 ring-teal-200'
                : darkMode
                ? 'text-slate-400 hover:text-teal-300'
                : 'hover:text-slate-900 text-slate-500'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-teal-500" />
            <span><LocalizedText en={"Growth (C"} />{cycleNumber} <LocalizedText en={"vs C1)"} /></span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('target')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'target'
                ? darkMode
                  ? 'bg-amber-950/80 text-amber-300 shadow-xs ring-1 ring-amber-500/50'
                  : 'bg-white text-amber-700 shadow-xs ring-1 ring-amber-200'
                : darkMode
                ? 'text-slate-400 hover:text-amber-300'
                : 'hover:text-slate-900 text-slate-500'
            }`}
          >
            <Target className="w-3 h-3 text-amber-500" />
            <span><LocalizedText en={"Gap to Target"} /></span>
          </button>
        </div>
      )}

      {/* Radar Canvas */}
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <Radar data={data} options={options} />
      </div>

      {/* Custom Interactive Legend with Line Style Previews */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1 border-t border-slate-100 text-xs">
          {/* Current Cycle */}
          <button
            type="button"
            onClick={() => toggleLayer('current')}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all cursor-pointer ${
              hiddenLayers['current'] ? 'opacity-40 grayscale line-through' : 'hover:bg-slate-50'
            }`}
            title={uiAttr("Click to toggle visibility")}
          >
            <span className="flex items-center">
              <span className="w-3.5 h-1 bg-teal-600 rounded-full" />
              <span className="w-2 h-2 rounded-full bg-teal-600 border border-white -ml-1" />
            </span>
            <span className="font-bold text-slate-800">
              {cycleNumber > 1 ? currentLabel : translateUi('Your Current', language)}
            </span>
          </button>

          {/* Prior Baseline */}
          {hasPrevious && viewMode !== 'target' && (
            <button
              type="button"
              onClick={() => toggleLayer('baseline')}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                hiddenLayers['baseline'] ? 'opacity-40 grayscale line-through' : 'hover:bg-slate-50'
              }`}
              title={uiAttr("Click to toggle visibility")}
            >
              <span className="flex items-center">
                <span className="w-3.5 h-0.5 border-t-2 border-dashed border-indigo-500" />
                <span className="w-2 h-2 rounded-full bg-white border-2 border-indigo-500 -ml-1" />
              </span>
              <span className="font-semibold text-indigo-700">
                <LocalizedText en={"Initial Baseline (C1)"} />{' '}</span>
            </button>
          )}

          {/* Target */}
          {viewMode !== 'growth' && (
            <button
              type="button"
              onClick={() => toggleLayer('target')}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                hiddenLayers['target'] ? 'opacity-40 grayscale line-through' : 'hover:bg-slate-50'
              }`}
              title={uiAttr("Click to toggle visibility")}
            >
              <span className="flex items-center">
                <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-600" />
                <span className="w-2 h-2 rotate-45 bg-amber-600 border border-white -ml-1" />
              </span>
              <span className="font-semibold text-amber-800">
                {targetJob ? targetLabel : translateUi('Target Benchmark', language)}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

