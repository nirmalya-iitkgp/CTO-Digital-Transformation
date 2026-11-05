import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Download,
  FolderKanban,
  GitBranch,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { MaturityRadarChart } from './components/MaturityRadarChart';
import { PillarAuditPanel } from './components/PillarAuditPanel';
import { RoadmapGeneratorPanel } from './components/RoadmapGeneratorPanel';
import { RoiSimulatorPanel } from './components/RoiSimulatorPanel';
import { ScenarioModal } from './components/ScenarioModal';
import {
  DEFAULT_AI_INTERVENTIONS,
  DEFAULT_PILLAR_SCORES,
  DMM_PILLARS,
  SECTOR_BENCHMARKS,
} from './data/benchmarks';
import {
  ActiveView,
  AiIntervention,
  PillarId,
  PillarScores,
  RoadmapMilestone,
  RoiSimulationParams,
  SavedScenario,
  SectorId,
} from './types/dmm';
import {
  calculateDigitalMaturityIndex,
  clampNumber,
  computeBottlenecks,
  generateTransformationRoadmap,
  simulateThreeYearRoi,
} from './utils/dmmEngine';
import {
  exportScenarioToCsv,
  loadScenariosFromStorage,
  saveScenariosToStorage,
} from './utils/security';

const NAV_ITEMS: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Command Overview', icon: Activity },
  { id: 'benchmarks', label: 'Peer Benchmarking', icon: BarChart3 },
  { id: 'roi', label: 'AI ROI Simulator', icon: Layers },
  { id: 'roadmap', label: 'Roadmap Generator', icon: GitBranch },
];

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [sectorId, setSectorId] = useState<SectorId>('finserv');
  const [scenarioName, setScenarioName] = useState('Enterprise AI Transformation Baseline');
  const [pillarScores, setPillarScores] = useState<PillarScores>(DEFAULT_PILLAR_SCORES);
  const [selectedPillar, setSelectedPillar] = useState<PillarId | null>('workflows');
  const [interventions, setInterventions] = useState<AiIntervention[]>(DEFAULT_AI_INTERVENTIONS);
  const [roiParams, setRoiParams] = useState<RoiSimulationParams>({
    annualRevenueM: SECTOR_BENCHMARKS.finserv.annualRevenueM,
    baselineMarginPct: SECTOR_BENCHMARKS.finserv.baselineMarginPct,
    governanceReadiness: 3.1,
    upskillingVelocity: 2.9,
  });

  const sector = SECTOR_BENCHMARKS[sectorId];

  const [milestones, setMilestones] = useState<RoadmapMilestone[]>(() =>
    generateTransformationRoadmap(
      DEFAULT_PILLAR_SCORES,
      SECTOR_BENCHMARKS.finserv,
      DEFAULT_AI_INTERVENTIONS
    )
  );

  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() =>
    loadScenariosFromStorage()
  );
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

  // Derived deterministic calculations
  const { dmiScore, dmiPercentage } = useMemo(
    () => calculateDigitalMaturityIndex(pillarScores),
    [pillarScores]
  );

  const peerDmi = useMemo(
    () => calculateDigitalMaturityIndex(sector.peerAverage).dmiScore,
    [sector]
  );

  const targetDmi = useMemo(
    () => calculateDigitalMaturityIndex(sector.topQuartileTarget).dmiScore,
    [sector]
  );

  const bottlenecks = useMemo(
    () => computeBottlenecks(pillarScores, sector),
    [pillarScores, sector]
  );

  const roiResult = useMemo(
    () => simulateThreeYearRoi(pillarScores, sector, interventions, roiParams),
    [pillarScores, sector, interventions, roiParams]
  );

  // Handlers
  const handleSelectSector = (nextSectorId: SectorId) => {
    const nextSector = SECTOR_BENCHMARKS[nextSectorId];
    setSectorId(nextSectorId);
    setRoiParams((prev) => ({
      ...prev,
      annualRevenueM: nextSector.annualRevenueM,
      baselineMarginPct: nextSector.baselineMarginPct,
    }));
  };

  const handleChangePillarScore = (pillar: PillarId, value: number) => {
    setPillarScores((prev) => ({
      ...prev,
      [pillar]: clampNumber(Number(value.toFixed(1)), 1.0, 5.0),
    }));
  };

  const handleToggleIntervention = (id: string) => {
    setInterventions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleChangeAdoption = (id: string, adoptionRate: number) => {
    setInterventions((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, adoptionRate: clampNumber(adoptionRate, 0, 100) }
          : item
      )
    );
  };

  const handleAddIntervention = (item: Omit<AiIntervention, 'id'>) => {
    setInterventions((prev) => [
      ...prev,
      { ...item, id: `custom-${Date.now()}` },
    ]);
  };

  const handleRemoveIntervention = (id: string) => {
    setInterventions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRegenerateRoadmap = () => {
    setMilestones(generateTransformationRoadmap(pillarScores, sector, interventions));
  };

  const handleUpdateMilestone = (id: string, patch: Partial<RoadmapMilestone>) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  };

  const handleMoveMilestone = (id: string, direction: 'up' | 'down') => {
    setMilestones((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return copy;
    });
  };

  const handleAddMilestone = (item: Omit<RoadmapMilestone, 'id'>) => {
    setMilestones((prev) => [...prev, { ...item, id: `rm-custom-${Date.now()}` }]);
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSaveSnapshot = (name: string) => {
    const newSnapshot: SavedScenario = {
      id: `sc-${Date.now()}`,
      name,
      updatedAt: new Date().toISOString(),
      sector: sectorId,
      pillarScores,
      interventions,
      roiParams,
      milestones,
    };
    const updated = [newSnapshot, ...savedScenarios].slice(0, 15);
    setSavedScenarios(updated);
    saveScenariosToStorage(updated);
    setScenarioName(name);
  };

  const handleLoadSnapshot = (sc: SavedScenario) => {
    setSectorId(sc.sector);
    setScenarioName(sc.name);
    setPillarScores(sc.pillarScores);
    if (sc.interventions.length > 0) setInterventions(sc.interventions);
    setRoiParams(sc.roiParams);
    if (sc.milestones.length > 0) setMilestones(sc.milestones);
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = savedScenarios.filter((s) => s.id !== id);
    setSavedScenarios(updated);
    saveScenariosToStorage(updated);
  };

  const handleResetDefaults = () => {
    setPillarScores(DEFAULT_PILLAR_SCORES);
    setInterventions(DEFAULT_AI_INTERVENTIONS);
    setRoiParams({
      annualRevenueM: sector.annualRevenueM,
      baselineMarginPct: sector.baselineMarginPct,
      governanceReadiness: 3.1,
      upskillingVelocity: 2.9,
    });
    setMilestones(
      generateTransformationRoadmap(DEFAULT_PILLAR_SCORES, sector, DEFAULT_AI_INTERVENTIONS)
    );
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const payload: SavedScenario = {
      id: `export-${Date.now()}`,
      name: scenarioName,
      updatedAt: new Date().toISOString(),
      sector: sectorId,
      pillarScores,
      interventions,
      roiParams,
      milestones,
    };
    triggerDownload(
      JSON.stringify(payload, null, 2),
      `meridian-dmm-${sectorId}.json`,
      'application/json'
    );
  };

  const handleExportCsv = () => {
    const csv = exportScenarioToCsv(
      scenarioName,
      sectorId,
      pillarScores,
      roiResult,
      milestones
    );
    triggerDownload(csv, `meridian-dmm-${sectorId}.csv`, 'text/csv;charset=utf-8;');
  };

  const dmiDeltaVsPeer = Number((dmiScore - peerDmi).toFixed(2));

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col lg:flex-row">
      {/* Left Navigation Rail (240px) */}
      <aside className="w-full lg:w-60 bg-[#0C111D] border-b lg:border-b-0 lg:border-r border-slate-800/90 flex flex-col justify-between shrink-0">
        <div>
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center gap-3">
            <img
              src="/icon.png"
              alt="Meridian DMM"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded object-cover shrink-0"
            />
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              Meridian DMM
            </span>
          </div>

          <nav className="p-3 space-y-1" aria-label="Primary Workspace Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Industry Sector Benchmark Selector */}
          <div className="px-4 py-4 border-t border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400 mb-2">
              Industry Peer Benchmark
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
              {(Object.keys(SECTOR_BENCHMARKS) as SectorId[]).map((id) => {
                const s = SECTOR_BENCHMARKS[id];
                const active = sectorId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectSector(id)}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center justify-between ${
                      active
                        ? 'bg-slate-800 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <span>{s.shortLabel}</span>
                    <span className="font-mono-tabular text-[11px] text-slate-400">
                      {calculateDigitalMaturityIndex(s.peerAverage).dmiScore.toFixed(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800/80 hidden lg:block">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Sector Defaults
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Executive Header */}
        <header className="px-6 py-3.5 bg-[#0C111D]/80 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
            <span className="text-slate-200 font-medium truncate">{scenarioName}</span>
            <span>/</span>
            <span className="text-[#3B82F6] whitespace-nowrap">{sector.name}</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsScenarioModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <FolderKanban className="w-3.5 h-3.5 text-[#3B82F6]" />
              Scenarios ({savedScenarios.length})
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#3B82F6] hover:bg-blue-500 text-white rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </header>

        {/* Main Analytical Viewport */}
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto space-y-6">
          {/* Executive KPI Strip */}
          <section
            aria-label="Executive Maturity and ROI Summary"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-4">
              <div className="text-xs text-slate-400">Digital Maturity Index (DMI)</div>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-2xl font-semibold font-mono-tabular text-[#3B82F6]">
                  {dmiScore.toFixed(2)}
                </span>
                <span className="text-xs font-mono-tabular text-slate-400">
                  / 5.00 ({dmiPercentage}%)
                </span>
              </div>
              <div className="text-xs font-mono-tabular text-slate-400 mt-1">
                Target Top-Quartile: <span className="text-[#10B981]">{targetDmi.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-4">
              <div className="text-xs text-slate-400">{sector.shortLabel} Peer Delta</div>
              <div
                className={`text-2xl font-semibold font-mono-tabular mt-1 ${
                  dmiDeltaVsPeer >= 0 ? 'text-[#10B981]' : 'text-amber-400'
                }`}
              >
                {dmiDeltaVsPeer >= 0 ? `+${dmiDeltaVsPeer.toFixed(2)}` : dmiDeltaVsPeer.toFixed(2)}
              </div>
              <div className="text-xs font-mono-tabular text-slate-400 mt-1">
                Sector Peer Baseline: {peerDmi.toFixed(2)}
              </div>
            </div>

            <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-4">
              <div className="text-xs text-slate-400">Projected 3-Year AI ROI</div>
              <div className="text-2xl font-semibold font-mono-tabular text-[#10B981] mt-1">
                {roiResult.threeYearRoiPct >= 0
                  ? `+${roiResult.threeYearRoiPct}%`
                  : `${roiResult.threeYearRoiPct}%`}
              </div>
              <div className="text-xs font-mono-tabular text-slate-400 mt-1">
                Net Benefit: ${roiResult.threeYearNetBenefitM.toFixed(1)}M on $
                {roiResult.totalInvestmentM.toFixed(1)}M
              </div>
            </div>

            <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-4">
              <div className="text-xs text-slate-400">Year 3 Operating Margin</div>
              <div className="text-2xl font-semibold font-mono-tabular text-slate-100 mt-1">
                {roiResult.projections[2].projectedMarginPct.toFixed(2)}%
              </div>
              <div className="text-xs font-mono-tabular text-[#10B981] mt-1">
                +{roiResult.year3MarginDeltaBps} bps margin expansion
              </div>
            </div>
          </section>

          {/* View 1: Command Overview */}
          {activeView === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-5 bg-[#0C111D] border border-slate-800/90 rounded-lg p-5">
                <div className="pb-4 border-b border-slate-800/80">
                  <h1 className="text-base font-semibold text-slate-100">
                    Five-Pillar Maturity Radar
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any axis node to inspect capability gaps against {sector.name}
                  </p>
                </div>

                <div className="py-4">
                  <MaturityRadarChart
                    currentScores={pillarScores}
                    peerScores={sector.peerAverage}
                    targetScores={sector.topQuartileTarget}
                    selectedPillar={selectedPillar}
                    onSelectPillar={setSelectedPillar}
                  />
                </div>

                {selectedPillar && (
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Selected Pillar: </span>
                      <span className="font-medium text-slate-100">
                        {DMM_PILLARS.find((p) => p.id === selectedPillar)?.name}
                      </span>
                    </div>
                    <div className="font-mono-tabular">
                      <span className="text-[#3B82F6]">
                        {pillarScores[selectedPillar].toFixed(1)}
                      </span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-[#10B981]">
                        {sector.topQuartileTarget[selectedPillar].toFixed(1)} Target
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="xl:col-span-7">
                <PillarAuditPanel
                  scores={pillarScores}
                  sector={sector}
                  bottlenecks={bottlenecks}
                  selectedPillar={selectedPillar}
                  onSelectPillar={setSelectedPillar}
                  onChangeScore={handleChangePillarScore}
                />
              </div>
            </div>
          )}

          {/* View 2: Peer Benchmarking */}
          {activeView === 'benchmarks' && (
            <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-5 space-y-5">
              <div className="pb-4 border-b border-slate-800/80">
                <h1 className="text-base font-semibold text-slate-100">
                  Multi-Sector Digital Maturity Benchmark Matrix
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compare your enterprise pillar scores against FinServ, Healthcare, Retail, and
                  Manufacturing baselines
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                      <th className="py-2.5 pr-4">DMM Pillar</th>
                      <th className="py-2.5 px-3 text-right">Your Enterprise</th>
                      <th className="py-2.5 px-3 text-right">FinServ Avg</th>
                      <th className="py-2.5 px-3 text-right">Healthcare Avg</th>
                      <th className="py-2.5 px-3 text-right">Retail Avg</th>
                      <th className="py-2.5 px-3 text-right">Manufacturing Avg</th>
                      <th className="py-2.5 pl-3 text-right">{sector.shortLabel} Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono-tabular">
                    {DMM_PILLARS.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40">
                        <td className="py-3 pr-4 font-sans font-medium text-slate-100">
                          {p.name}
                        </td>
                        <td className="py-3 px-3 text-right text-[#3B82F6] font-semibold">
                          {pillarScores[p.id].toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {SECTOR_BENCHMARKS.finserv.peerAverage[p.id].toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {SECTOR_BENCHMARKS.healthcare.peerAverage[p.id].toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {SECTOR_BENCHMARKS.retail.peerAverage[p.id].toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {SECTOR_BENCHMARKS.manufacturing.peerAverage[p.id].toFixed(1)}
                        </td>
                        <td className="py-3 pl-3 text-right text-[#10B981] font-semibold">
                          {sector.topQuartileTarget[p.id].toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View 3: Automated AI Intervention ROI Simulator */}
          {activeView === 'roi' && (
            <RoiSimulatorPanel
              interventions={interventions}
              params={roiParams}
              roiResult={roiResult}
              onToggleIntervention={handleToggleIntervention}
              onChangeAdoption={handleChangeAdoption}
              onAddIntervention={handleAddIntervention}
              onRemoveIntervention={handleRemoveIntervention}
              onChangeParams={(patch) => setRoiParams((prev) => ({ ...prev, ...patch }))}
            />
          )}

          {/* View 4: Customizable Transformation Roadmap Generator */}
          {activeView === 'roadmap' && (
            <RoadmapGeneratorPanel
              milestones={milestones}
              onRegenerate={handleRegenerateRoadmap}
              onUpdateMilestone={handleUpdateMilestone}
              onMoveMilestone={handleMoveMilestone}
              onAddMilestone={handleAddMilestone}
              onDeleteMilestone={handleDeleteMilestone}
            />
          )}
        </main>
      </div>

      <ScenarioModal
        isOpen={isScenarioModalOpen}
        scenarios={savedScenarios}
        activeScenarioName={scenarioName}
        onClose={() => setIsScenarioModalOpen(false)}
        onSaveCurrent={handleSaveSnapshot}
        onLoadScenario={handleLoadSnapshot}
        onDeleteScenario={handleDeleteSnapshot}
      />
    </div>
  );
}
