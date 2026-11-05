import React from 'react';
import { DMM_PILLARS } from '../data/benchmarks';
import { BottleneckItem, PillarId, PillarScores, SectorBenchmark } from '../types/dmm';

interface PillarAuditPanelProps {
  scores: PillarScores;
  sector: SectorBenchmark;
  bottlenecks: BottleneckItem[];
  selectedPillar: PillarId | null;
  onSelectPillar: (pillar: PillarId) => void;
  onChangeScore: (pillar: PillarId, value: number) => void;
}

export const PillarAuditPanel: React.FC<PillarAuditPanelProps> = ({
  scores,
  sector,
  bottlenecks,
  selectedPillar,
  onSelectPillar,
  onChangeScore,
}) => {
  return (
    <div className="space-y-6">
      {/* 5-Pillar Capability Sliders */}
      <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-5">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Five-Pillar Capability Audit
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Score enterprise readiness (1.0 Initial to 5.0 Autonomous) against {sector.name} peers
            </p>
          </div>
          <span className="text-xs font-mono-tabular text-slate-400 whitespace-nowrap shrink-0">
            Scale 1.0 – 5.0
          </span>
        </div>

        <div className="divide-y divide-slate-800/70">
          {DMM_PILLARS.map((pillar) => {
            const current = scores[pillar.id];
            const peer = sector.peerAverage[pillar.id];
            const target = sector.topQuartileTarget[pillar.id];
            const peerDelta = Number((current - peer).toFixed(1));
            const isSelected = selectedPillar === pillar.id;

            return (
              <div
                key={pillar.id}
                onClick={() => onSelectPillar(pillar.id)}
                className={`py-4 transition-colors cursor-pointer ${
                  isSelected ? 'bg-slate-900/50 -mx-5 px-5' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-slate-100">{pillar.name}</span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-400">{pillar.mckinseyDimension}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{pillar.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div className="text-xs font-mono-tabular text-slate-400">
                      Peer {peer.toFixed(1)} · Target{' '}
                      <span className="text-[#10B981]">{target.toFixed(1)}</span>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-base font-semibold font-mono-tabular text-[#3B82F6]">
                        {current.toFixed(1)}
                      </span>
                      <span
                        className={`block text-[11px] font-mono-tabular ${
                          peerDelta >= 0 ? 'text-[#10B981]' : 'text-amber-400'
                        }`}
                      >
                        {peerDelta >= 0 ? `+${peerDelta.toFixed(1)}` : peerDelta.toFixed(1)} vs peer
                      </span>
                    </div>
                  </div>
                </div>

                <input
                  type="range"
                  min={1.0}
                  max={5.0}
                  step={0.1}
                  value={current}
                  aria-label={`${pillar.name} maturity score`}
                  onChange={(e) => onChangeScore(pillar.id, parseFloat(e.target.value))}
                  className="w-full cyber-slider"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Ranked AI Integration Bottlenecks */}
      <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-5">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              AI Integration Bottleneck Map
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Dynamically ranked by pillar deficit and {sector.shortLabel} transformation friction
            </p>
          </div>
          <span className="text-xs font-mono-tabular text-slate-400 whitespace-nowrap shrink-0">
            {bottlenecks.length} Active Constraints
          </span>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                <th className="py-2.5 pr-4">Bottleneck & Remediation</th>
                <th className="py-2.5 px-3">Pillar</th>
                <th className="py-2.5 px-3 text-right">Gap to Target</th>
                <th className="py-2.5 pl-3 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {bottlenecks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-100">{item.title}</div>
                    <div className="text-slate-400 mt-0.5">{item.remediationSummary}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                    {item.pillarName}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-tabular text-slate-300 whitespace-nowrap">
                    -{item.gapToTarget.toFixed(1)} pts
                  </td>
                  <td className="py-3 pl-3 text-right font-mono-tabular whitespace-nowrap">
                    <span
                      className={
                        item.severityLevel === 'Critical'
                          ? 'text-red-400 font-semibold'
                          : item.severityLevel === 'High'
                          ? 'text-amber-400 font-medium'
                          : 'text-slate-300'
                      }
                    >
                      {item.severityLevel} ({item.severityScore.toFixed(1)})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
