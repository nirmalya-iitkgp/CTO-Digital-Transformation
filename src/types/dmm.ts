export type PillarId = 'data' | 'cloud' | 'workflows' | 'culture' | 'customer';

export type SectorId = 'finserv' | 'healthcare' | 'retail' | 'manufacturing';

export type HorizonId = 'year1' | 'year2' | 'year3';

export type PriorityLevel = 'P1' | 'P2' | 'P3';

export type MilestoneStatus = 'planned' | 'in-progress' | 'completed';

export type ActiveView = 'overview' | 'benchmarks' | 'roi' | 'roadmap';

export interface PillarDefinition {
  id: PillarId;
  name: string;
  shortName: string;
  weight: number;
  mckinseyDimension: string;
  description: string;
}

export type PillarScores = Record<PillarId, number>;

export interface BottleneckTemplate {
  id: string;
  title: string;
  pillar: PillarId;
  baseSeverity: number;
  remediationSummary: string;
}

export interface SectorBenchmark {
  id: SectorId;
  name: string;
  shortLabel: string;
  annualRevenueM: number;
  baselineMarginPct: number;
  peerAverage: PillarScores;
  topQuartileTarget: PillarScores;
  bottlenecks: BottleneckTemplate[];
}

export interface BottleneckItem {
  id: string;
  title: string;
  pillar: PillarId;
  pillarName: string;
  currentScore: number;
  peerScore: number;
  gapToTarget: number;
  severityScore: number;
  severityLevel: 'Critical' | 'High' | 'Moderate';
  remediationSummary: string;
}

export interface AiIntervention {
  id: string;
  name: string;
  targetPillar: PillarId;
  enabled: boolean;
  adoptionRate: number; // 0 to 100
  implementationCostM: number; // $M over 3 years
  maxMarginLiftBps: number; // basis points at 100% adoption & 5.0 maturity
  rampQuarters: number; // 1 to 8 quarters to reach full run-rate
  isCustom?: boolean;
}

export interface RoiSimulationParams {
  annualRevenueM: number;
  baselineMarginPct: number;
  governanceReadiness: number; // 1.0 to 5.0
  upskillingVelocity: number; // 1.0 to 5.0
}

export interface YearlyProjection {
  year: 1 | 2 | 3;
  baselineMarginPct: number;
  projectedMarginPct: number;
  fullTargetMarginPct: number;
  annualEbitdaLiftM: number;
  cumulativeEbitdaLiftM: number;
  cumulativeCostM: number;
  netCumulativeBenefitM: number;
}

export interface RoiComparisonResult {
  projections: YearlyProjection[];
  totalInvestmentM: number;
  threeYearEbitdaLiftM: number;
  threeYearNetBenefitM: number;
  threeYearRoiPct: number;
  fullTargetThreeYearRoiPct: number;
  paybackMonths: number | null;
  year3MarginDeltaBps: number;
  fullTargetMarginDeltaBps: number;
}

export interface KotterStep {
  step: number;
  title: string;
  phase: 'Create Climate' | 'Engage & Enable' | 'Implement & Sustain';
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  horizon: HorizonId;
  timelineLabel: string;
  kotterStep: number;
  pillar: PillarId;
  linkedIntervention: string;
  priority: PriorityLevel;
  status: MilestoneStatus;
  isCustom?: boolean;
}

export interface SavedScenario {
  id: string;
  name: string;
  updatedAt: string;
  sector: SectorId;
  pillarScores: PillarScores;
  interventions: AiIntervention[];
  roiParams: RoiSimulationParams;
  milestones: RoadmapMilestone[];
}
