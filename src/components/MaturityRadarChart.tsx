import React, { useState } from 'react';
import { DMM_PILLARS } from '../data/benchmarks';
import { PillarId, PillarScores } from '../types/dmm';

interface MaturityRadarChartProps {
  currentScores: PillarScores;
  peerScores: PillarScores;
  targetScores: PillarScores;
  selectedPillar: PillarId | null;
  onSelectPillar: (pillar: PillarId) => void;
}

const CENTER = 190;
const MAX_RADIUS = 132;
const LEVELS = [1, 2, 3, 4, 5];

function getPoint(index: number, value: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
  const normalized = Math.max(0, Math.min(1, (value - 1) / 4));
  const radius = 24 + normalized * (MAX_RADIUS - 24);
  return {
    x: Number((CENTER + radius * Math.cos(angle)).toFixed(2)),
    y: Number((CENTER + radius * Math.sin(angle)).toFixed(2)),
  };
}

function buildPolygonPoints(scores: PillarScores): string {
  return DMM_PILLARS.map((pillar, idx) => {
    const pt = getPoint(idx, scores[pillar.id]);
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

export const MaturityRadarChart: React.FC<MaturityRadarChartProps> = ({
  currentScores,
  peerScores,
  targetScores,
  selectedPillar,
  onSelectPillar,
}) => {
  const [hoveredPillar, setHoveredPillar] = useState<PillarId | null>(null);
  const activeId = hoveredPillar ?? selectedPillar;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 380 380"
        className="w-full max-w-[380px] h-auto select-none"
        role="img"
        aria-label="5-Pillar Digital Maturity Radar Chart"
      >
        {/* Concentric pentagon grid rings */}
        {LEVELS.map((lvl) => {
          const pts = DMM_PILLARS.map((_, idx) => {
            const p = getPoint(idx, lvl);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="#1E293B"
              strokeWidth={lvl === 5 ? 1.25 : 1}
              strokeDasharray={lvl === 3 ? '3 3' : undefined}
            />
          );
        })}

        {/* Radial axis spokes */}
        {DMM_PILLARS.map((pillar, idx) => {
          const outer = getPoint(idx, 5);
          const isActive = activeId === pillar.id;
          return (
            <line
              key={pillar.id}
              x1={CENTER}
              y1={CENTER}
              x2={outer.x}
              y2={outer.y}
              stroke={isActive ? '#3B82F6' : '#1E293B'}
              strokeWidth={isActive ? 1.5 : 1}
            />
          );
        })}

        {/* Top-Quartile Target Maturity Polygon (#10B981 Vibrant Emerald) */}
        <polygon
          points={buildPolygonPoints(targetScores)}
          fill="rgba(16, 185, 129, 0.08)"
          stroke="#10B981"
          strokeWidth={1.75}
          strokeDasharray="5 3"
        />

        {/* Industry Peer Baseline Polygon */}
        <polygon
          points={buildPolygonPoints(peerScores)}
          fill="rgba(148, 163, 184, 0.06)"
          stroke="#94A3B8"
          strokeWidth={1.5}
          strokeDasharray="2 3"
        />

        {/* Current Enterprise Maturity Polygon (#3B82F6 Neon Electric Blue) */}
        <polygon
          points={buildPolygonPoints(currentScores)}
          fill="rgba(59, 130, 246, 0.22)"
          stroke="#3B82F6"
          strokeWidth={2.25}
        />

        {/* Interactive Vertex Nodes & Axis Labels */}
        {DMM_PILLARS.map((pillar, idx) => {
          const currentPt = getPoint(idx, currentScores[pillar.id]);
          const targetPt = getPoint(idx, targetScores[pillar.id]);
          const labelPt = getPoint(idx, 5.65);
          const isActive = activeId === pillar.id;

          let textAnchor: 'middle' | 'start' | 'end' = 'middle';
          if (labelPt.x < CENTER - 20) textAnchor = 'end';
          else if (labelPt.x > CENTER + 20) textAnchor = 'start';

          return (
            <g
              key={pillar.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPillar(pillar.id)}
              onMouseLeave={() => setHoveredPillar(null)}
              onClick={() => onSelectPillar(pillar.id)}
            >
              {/* Target vertex indicator */}
              <circle cx={targetPt.x} cy={targetPt.y} r={3} fill="#10B981" />

              {/* Current enterprise vertex node */}
              <circle
                cx={currentPt.x}
                cy={currentPt.y}
                r={isActive ? 6 : 4.5}
                fill="#3B82F6"
                stroke="#06080F"
                strokeWidth={2}
              />

              {/* Axis label */}
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className={`text-[11px] font-medium transition-colors ${
                  isActive ? 'fill-white' : 'fill-slate-400'
                }`}
              >
                {pillar.shortName}
              </text>
              <text
                x={labelPt.x}
                y={labelPt.y + 14}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-[10px] font-mono-tabular fill-[#3B82F6]"
              >
                {currentScores[pillar.id].toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Clean Legend without pill boxes */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-0.5 bg-[#3B82F6]" />
          <span>Enterprise Current</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-0.5 bg-slate-400 border-b border-dashed border-slate-400" />
          <span>Sector Peer Avg</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-0.5 bg-[#10B981]" />
          <span>Top-Quartile Target</span>
        </div>
      </div>
    </div>
  );
};
