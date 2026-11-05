import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DMM_PILLARS } from '../data/benchmarks';
import {
  AiIntervention,
  PillarId,
  RoiComparisonResult,
  RoiSimulationParams,
} from '../types/dmm';
import { clampNumber } from '../utils/dmmEngine';

interface RoiSimulatorPanelProps {
  interventions: AiIntervention[];
  params: RoiSimulationParams;
  roiResult: RoiComparisonResult;
  onToggleIntervention: (id: string) => void;
  onChangeAdoption: (id: string, adoptionRate: number) => void;
  onAddIntervention: (item: Omit<AiIntervention, 'id'>) => void;
  onRemoveIntervention: (id: string) => void;
  onChangeParams: (patch: Partial<RoiSimulationParams>) => void;
}

export const RoiSimulatorPanel: React.FC<RoiSimulatorPanelProps> = ({
  interventions,
  params,
  roiResult,
  onToggleIntervention,
  onChangeAdoption,
  onAddIntervention,
  onRemoveIntervention,
  onChangeParams,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPillar, setNewPillar] = useState<PillarId>('workflows');
  const [newCostM, setNewCostM] = useState('3.5');
  const [newLiftBps, setNewLiftBps] = useState('80');
  const [newAdoption, setNewAdoption] = useState('60');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    onAddIntervention({
      name: trimmed.slice(0, 90),
      targetPillar: newPillar,
      enabled: true,
      adoptionRate: clampNumber(parseFloat(newAdoption) || 60, 0, 100),
      implementationCostM: clampNumber(parseFloat(newCostM) || 3.5, 0.1, 250),
      maxMarginLiftBps: clampNumber(parseFloat(newLiftBps) || 80, 5, 500),
      rampQuarters: 3,
      isCustom: true,
    });

    setNewName('');
    setShowAddForm(false);
  };

  const year3 = roiResult.projections[2];

  // SVG Trajectory Chart coordinates
  const chartW = 540;
  const chartH = 180;
  const padX = 48;
  const padY = 24;
  const allMargins = [
    params.baselineMarginPct,
    ...roiResult.projections.flatMap((p) => [
      p.baselineMarginPct,
      p.projectedMarginPct,
      p.fullTargetMarginPct,
    ]),
  ];
  const minM = Math.max(0, Math.floor(Math.min(...allMargins) - 1));
  const maxM = Math.ceil(Math.max(...allMargins) + 1);
  const spanM = Math.max(1, maxM - minM);

  const getX = (yearIdx: number) =>
    padX + (yearIdx / 3) * (chartW - padX * 2);
  const getY = (margin: number) =>
    chartH - padY - ((margin - minM) / spanM) * (chartH - padY * 2);

  const baselinePoints = [
    `${getX(0)},${getY(params.baselineMarginPct)}`,
    ...roiResult.projections.map((p, i) => `${getX(i + 1)},${getY(p.baselineMarginPct)}`),
  ].join(' ');

  const selectedPoints = [
    `${getX(0)},${getY(params.baselineMarginPct)}`,
    ...roiResult.projections.map((p, i) => `${getX(i + 1)},${getY(p.projectedMarginPct)}`),
  ].join(' ');

  const targetPoints = [
    `${getX(0)},${getY(params.baselineMarginPct)}`,
    ...roiResult.projections.map((p, i) => `${getX(i + 1)},${getY(p.fullTargetMarginPct)}`),
  ].join(' ');

  return (
    <div className="space-y-6">
      {/* Comparative 3-Year ROI Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-4">
          <div className="text-xs text-slate-400">Net 3-Year ROI (Selected)</div>
          <div className="text-2xl font-semibold font-mono-tabular text-[#10B981] mt-1">
            {roiResult.threeYearRoiPct >= 0
              ? `+${roiResult.threeYearRoiPct}%`
              : `${roiResult.threeYearRoiPct}%`}
          </div>
          <div className="text-xs font-mono-tabular text-slate-400 mt-1">
            Full-Adoption Target: +{roiResult.fullTargetThreeYearRoiPct}%
          </div>
        </div>

        <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-4">
          <div className="text-xs text-slate-400">Year 3 Operating Margin</div>
          <div className="text-2xl font-semibold font-mono-tabular text-[#3B82F6] mt-1">
            {year3.projectedMarginPct.toFixed(2)}%
          </div>
          <div className="text-xs font-mono-tabular text-slate-400 mt-1">
            +{roiResult.year3MarginDeltaBps} bps vs {params.baselineMarginPct.toFixed(1)}% base
          </div>
        </div>

        <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-4">
          <div className="text-xs text-slate-400">3-Yr Cumulative EBITDA Lift</div>
          <div className="text-2xl font-semibold font-mono-tabular text-slate-100 mt-1">
            ${roiResult.threeYearEbitdaLiftM.toFixed(1)}M
          </div>
          <div className="text-xs font-mono-tabular text-slate-400 mt-1">
            Net Gain: ${roiResult.threeYearNetBenefitM.toFixed(1)}M
          </div>
        </div>

        <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-4">
          <div className="text-xs text-slate-400">3-Yr Investment & Payback</div>
          <div className="text-2xl font-semibold font-mono-tabular text-slate-100 mt-1">
            ${roiResult.totalInvestmentM.toFixed(1)}M
          </div>
          <div className="text-xs font-mono-tabular text-slate-400 mt-1">
            {roiResult.paybackMonths !== null
              ? `Payback: ${roiResult.paybackMonths} months`
              : 'Payback > 36 months'}
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Interventions Catalog & Comparative Margin Trajectory */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left: AI Technology Interventions & Adoption Sliders */}
        <div className="xl:col-span-7 bg-[#0C111D] border border-slate-800/90 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                AI Technology Interventions & Adoption Rates
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable interventions and tune 3-year adoption % to model operating margin lift
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#3B82F6] hover:bg-blue-500 text-white rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Intervention
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleCreate}
              className="mt-4 p-4 bg-[#06080F] border border-slate-800 rounded-md space-y-3"
            >
              <div className="text-xs font-medium text-slate-200">
                Custom AI Technology Intervention
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="e.g., Autonomous Claims Triage AI"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-2 text-xs bg-[#0C111D] border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-[#3B82F6]"
                />
                <select
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value as PillarId)}
                  aria-label="Target DMM Pillar"
                  className="px-3 py-2 text-xs bg-[#0C111D] border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-[#3B82F6]"
                >
                  {DMM_PILLARS.map((p) => (
                    <option key={p.id} value={p.id}>
                      Pillar: {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    3-Yr Cost ($M)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="250"
                    value={newCostM}
                    onChange={(e) => setNewCostM(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-[#0C111D] border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Max Lift (bps)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    max="500"
                    value={newLiftBps}
                    onChange={(e) => setNewLiftBps(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-[#0C111D] border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Adoption (%)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    max="100"
                    value={newAdoption}
                    onChange={(e) => setNewAdoption(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-[#0C111D] border border-slate-700 rounded text-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-[#10B981] hover:bg-emerald-500 text-slate-950 rounded"
                >
                  Save Intervention
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-800/70 mt-2">
            {interventions.map((item) => (
              <div key={item.id} className="py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => onToggleIntervention(item.id)}
                      className="w-4 h-4 accent-[#3B82F6] rounded cursor-pointer"
                    />
                    <div>
                      <span
                        className={`text-sm font-medium ${
                          item.enabled ? 'text-slate-100' : 'text-slate-400'
                        }`}
                      >
                        {item.name}
                      </span>
                      <div className="text-xs text-slate-400 font-mono-tabular mt-0.5">
                        Cost: ${item.implementationCostM.toFixed(1)}M · Max Lift: +
                        {item.maxMarginLiftBps} bps · Ramp: {item.rampQuarters}Q
                      </div>
                    </div>
                  </label>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-mono-tabular w-24 text-right ${
                        item.enabled ? 'text-[#3B82F6] font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {item.adoptionRate}% Adoption
                    </span>
                    {item.isCustom && (
                      <button
                        type="button"
                        onClick={() => onRemoveIntervention(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {item.enabled && (
                  <div className="mt-2 pl-7">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={item.adoptionRate}
                      aria-label={`${item.name} adoption rate`}
                      onChange={(e) =>
                        onChangeAdoption(item.id, parseInt(e.target.value, 10))
                      }
                      className="w-full cyber-slider"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Comparative 3-Year Margin Trajectory & Global Sensitivity */}
        <div className="xl:col-span-5 space-y-6 flex flex-col">
          <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-5">
            <div className="pb-3 border-b border-slate-800/80">
              <h2 className="text-base font-semibold text-slate-100">
                Comparative 3-Year Operating Margin
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Baseline vs. Selected Interventions vs. 100% Full-Adoption Target
              </p>
            </div>

            <div className="mt-4">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full h-auto"
                role="img"
                aria-label="3-Year Operating Margin Trajectory"
              >
                {/* Horizontal grid lines */}
                {[0, 0.5, 1].map((t) => {
                  const val = minM + t * spanM;
                  const y = getY(val);
                  return (
                    <g key={t}>
                      <line
                        x1={padX}
                        y1={y}
                        x2={chartW - padX}
                        y2={y}
                        stroke="#1E293B"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padX - 8}
                        y={y}
                        textAnchor="end"
                        dominantBaseline="middle"
                        className="text-[10px] font-mono-tabular fill-slate-400"
                      >
                        {val.toFixed(1)}%
                      </text>
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {['Base', 'Year 1', 'Year 2', 'Year 3'].map((lbl, idx) => (
                  <text
                    key={lbl}
                    x={getX(idx)}
                    y={chartH - 6}
                    textAnchor="middle"
                    className="text-[11px] font-mono-tabular fill-slate-400"
                  >
                    {lbl}
                  </text>
                ))}

                {/* Baseline */}
                <polyline
                  fill="none"
                  stroke="#64748B"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  points={baselinePoints}
                />

                {/* Full-Adoption Target (#10B981) */}
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={1.75}
                  strokeDasharray="5 3"
                  points={targetPoints}
                />

                {/* Selected Scenario (#3B82F6) */}
                <polyline
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  points={selectedPoints}
                />

                {/* Data points */}
                {roiResult.projections.map((p, i) => (
                  <g key={p.year}>
                    <circle
                      cx={getX(i + 1)}
                      cy={getY(p.fullTargetMarginPct)}
                      r={3.5}
                      fill="#10B981"
                    />
                    <circle
                      cx={getX(i + 1)}
                      cy={getY(p.projectedMarginPct)}
                      r={4.5}
                      fill="#3B82F6"
                      stroke="#06080F"
                      strokeWidth={1.5}
                    />
                  </g>
                ))}
              </svg>

              <div className="flex items-center justify-center gap-5 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#3B82F6]" /> Selected Scenario
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#10B981]" /> Full-Adoption Target
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-slate-500" /> Status Quo
                </span>
              </div>
            </div>

            {/* Comparative Year-by-Year Table */}
            <div className="overflow-x-auto mt-4 pt-3 border-t border-slate-800/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                    <th className="py-2">Horizon</th>
                    <th className="py-2 text-right">Baseline</th>
                    <th className="py-2 text-right">Selected</th>
                    <th className="py-2 text-right">Full Target</th>
                    <th className="py-2 text-right">Net Benefit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-tabular">
                  {roiResult.projections.map((p) => (
                    <tr key={p.year}>
                      <td className="py-2.5 text-slate-200 font-sans font-medium">
                        Year {p.year}
                      </td>
                      <td className="py-2.5 text-right text-slate-400">
                        {p.baselineMarginPct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 text-right text-[#3B82F6] font-semibold">
                        {p.projectedMarginPct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 text-right text-[#10B981]">
                        {p.fullTargetMarginPct.toFixed(2)}%
                      </td>
                      <td
                        className={`py-2.5 text-right ${
                          p.netCumulativeBenefitM >= 0 ? 'text-[#10B981]' : 'text-amber-400'
                        }`}
                      >
                        {p.netCumulativeBenefitM >= 0
                          ? `+$${p.netCumulativeBenefitM.toFixed(1)}M`
                          : `-$${Math.abs(p.netCumulativeBenefitM).toFixed(1)}M`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Global Execution Sensitivity Controls */}
          <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">
              Enterprise Financial & Execution Sensitivity
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Annual Revenue ($M)
                </label>
                <input
                  type="number"
                  min={10}
                  max={500000}
                  step={50}
                  value={params.annualRevenueM}
                  onChange={(e) =>
                    onChangeParams({
                      annualRevenueM: clampNumber(parseFloat(e.target.value) || 100, 10, 500000),
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono-tabular bg-[#06080F] border border-slate-700 rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Baseline Margin (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={80}
                  step={0.5}
                  value={params.baselineMarginPct}
                  onChange={(e) =>
                    onChangeParams({
                      baselineMarginPct: clampNumber(parseFloat(e.target.value) || 10, 1, 80),
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono-tabular bg-[#06080F] border border-slate-700 rounded text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">AI Governance & Data Readiness</span>
                <span className="font-mono-tabular text-[#3B82F6]">
                  {params.governanceReadiness.toFixed(1)} / 5.0
                </span>
              </div>
              <input
                type="range"
                min={1.0}
                max={5.0}
                step={0.1}
                value={params.governanceReadiness}
                onChange={(e) =>
                  onChangeParams({ governanceReadiness: parseFloat(e.target.value) })
                }
                className="w-full cyber-slider"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Workforce Upskilling Velocity</span>
                <span className="font-mono-tabular text-[#3B82F6]">
                  {params.upskillingVelocity.toFixed(1)} / 5.0
                </span>
              </div>
              <input
                type="range"
                min={1.0}
                max={5.0}
                step={0.1}
                value={params.upskillingVelocity}
                onChange={(e) =>
                  onChangeParams({ upskillingVelocity: parseFloat(e.target.value) })
                }
                className="w-full cyber-slider"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
