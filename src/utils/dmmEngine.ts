import { DMM_PILLARS } from '../data/benchmarks';
import {
  AiIntervention,
  BottleneckItem,
  HorizonId,
  PillarId,
  PillarScores,
  PriorityLevel,
  RoadmapMilestone,
  RoiComparisonResult,
  RoiSimulationParams,
  SectorBenchmark,
  YearlyProjection,
} from '../types/dmm';

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function calculateDigitalMaturityIndex(scores: PillarScores): {
  dmiScore: number;
  dmiPercentage: number;
} {
  const weightedSum = DMM_PILLARS.reduce((acc, pillar) => {
    const score = clampNumber(scores[pillar.id] ?? 1.0, 1.0, 5.0);
    return acc + score * pillar.weight;
  }, 0);

  const dmiScore = Number((weightedSum + 1e-9).toFixed(2));
  const dmiPercentage = Math.round(((dmiScore - 1.0) / 4.0) * 100);
  return { dmiScore, dmiPercentage };
}

export function computeBottlenecks(
  scores: PillarScores,
  sector: SectorBenchmark
): BottleneckItem[] {
  const pillarMap = Object.fromEntries(DMM_PILLARS.map((p) => [p.id, p]));

  const items: BottleneckItem[] = sector.bottlenecks.map((tpl) => {
    const currentScore = clampNumber(scores[tpl.pillar], 1.0, 5.0);
    const peerScore = sector.peerAverage[tpl.pillar];
    const targetScore = sector.topQuartileTarget[tpl.pillar];
    const gapToTarget = Number(Math.max(0, targetScore - currentScore).toFixed(2));
    const peerDeficit = Math.max(0, peerScore - currentScore);

    const rawSeverity = (gapToTarget * 1.35 + peerDeficit * 0.85) * tpl.baseSeverity;
    const severityScore = Number(rawSeverity.toFixed(2));

    let severityLevel: BottleneckItem['severityLevel'] = 'Moderate';
    if (severityScore >= 2.2) severityLevel = 'Critical';
    else if (severityScore >= 1.35) severityLevel = 'High';

    return {
      id: tpl.id,
      title: tpl.title,
      pillar: tpl.pillar,
      pillarName: pillarMap[tpl.pillar]?.name ?? tpl.pillar,
      currentScore,
      peerScore,
      gapToTarget,
      severityScore,
      severityLevel,
      remediationSummary: tpl.remediationSummary,
    };
  });

  return items.sort((a, b) => b.severityScore - a.severityScore);
}

export function simulateThreeYearRoi(
  scores: PillarScores,
  _sector: SectorBenchmark,
  interventions: AiIntervention[],
  params: RoiSimulationParams
): RoiComparisonResult {
  const revenue = clampNumber(params.annualRevenueM, 10, 500000);
  const baseMargin = clampNumber(params.baselineMarginPct, 1, 80);
  const govFactor = 0.7 + 0.3 * ((clampNumber(params.governanceReadiness, 1, 5) - 1) / 4);
  const upskillFactor = 0.75 + 0.25 * ((clampNumber(params.upskillingVelocity, 1, 5) - 1) / 4);

  const active = interventions.filter((item) => item.enabled);
  const totalInvestmentM = Number(
    active.reduce((sum, item) => sum + clampNumber(item.implementationCostM, 0, 500), 0).toFixed(2)
  );

  // Cost phasing: 50% Year 1, 30% Year 2, 20% Year 3
  const costWeights = [0.5, 0.3, 0.2];
  const projections: YearlyProjection[] = [];

  let cumulativeEbitdaLiftM = 0;
  let cumulativeCostM = 0;
  let fullTargetCumulativeLiftM = 0;

  for (let yearIdx = 0; yearIdx < 3; yearIdx++) {
    const year = (yearIdx + 1) as 1 | 2 | 3;
    const startQ = yearIdx * 4 + 1;
    const endQ = startQ + 3;

    let yearSelectedBps = 0;
    let yearFullTargetBps = 0;

    for (const item of active) {
      const adoption = clampNumber(item.adoptionRate, 0, 100) / 100;
      const pillarScore = clampNumber(scores[item.targetPillar] ?? 2.5, 1, 5);
      const pillarReadiness = 0.55 + 0.45 * ((pillarScore - 1) / 4);
      const fullReadiness = 0.95; // Top-quartile readiness at full target

      const ramp = clampNumber(item.rampQuarters, 1, 8);
      let avgRampInYear = 0;
      for (let q = startQ; q <= endQ; q++) {
        avgRampInYear += Math.min(1, q / ramp);
      }
      avgRampInYear /= 4;

      yearSelectedBps +=
        item.maxMarginLiftBps * adoption * pillarReadiness * govFactor * upskillFactor * avgRampInYear;
      yearFullTargetBps += item.maxMarginLiftBps * 1.0 * fullReadiness * avgRampInYear;
    }

    const projectedMarginPct = Number((baseMargin + yearSelectedBps / 100).toFixed(2));
    const fullTargetMarginPct = Number((baseMargin + yearFullTargetBps / 100).toFixed(2));

    const annualEbitdaLiftM = Number(((revenue * (yearSelectedBps / 100)) / 100).toFixed(2));
    const fullAnnualLiftM = (revenue * (yearFullTargetBps / 100)) / 100;

    cumulativeEbitdaLiftM = Number((cumulativeEbitdaLiftM + annualEbitdaLiftM).toFixed(2));
    fullTargetCumulativeLiftM += fullAnnualLiftM;
    cumulativeCostM = Number((cumulativeCostM + totalInvestmentM * costWeights[yearIdx]).toFixed(2));
    const netCumulativeBenefitM = Number((cumulativeEbitdaLiftM - cumulativeCostM).toFixed(2));

    projections.push({
      year,
      baselineMarginPct: Number(baseMargin.toFixed(2)),
      projectedMarginPct,
      fullTargetMarginPct,
      annualEbitdaLiftM,
      cumulativeEbitdaLiftM,
      cumulativeCostM,
      netCumulativeBenefitM,
    });
  }

  const threeYearEbitdaLiftM = cumulativeEbitdaLiftM;
  const threeYearNetBenefitM = Number((threeYearEbitdaLiftM - totalInvestmentM).toFixed(2));
  const threeYearRoiPct =
    totalInvestmentM > 0 ? Math.round((threeYearNetBenefitM / totalInvestmentM) * 100) : 0;
  const fullTargetThreeYearRoiPct =
    totalInvestmentM > 0
      ? Math.round(((fullTargetCumulativeLiftM - totalInvestmentM) / totalInvestmentM) * 100)
      : 0;

  // Estimate payback in months
  let paybackMonths: number | null = null;
  if (totalInvestmentM > 0 && threeYearEbitdaLiftM > totalInvestmentM) {
    let prevNet = 0;
    for (let i = 0; i < projections.length; i++) {
      const p = projections[i];
      if (p.netCumulativeBenefitM >= 0) {
        const gainInYear = p.netCumulativeBenefitM - prevNet;
        const fraction = gainInYear > 0 ? Math.abs(prevNet) / gainInYear : 0;
        paybackMonths = Math.max(1, Math.round(i * 12 + fraction * 12));
        break;
      }
      prevNet = p.netCumulativeBenefitM;
    }
  } else if (totalInvestmentM === 0 && threeYearEbitdaLiftM > 0) {
    paybackMonths = 1;
  }

  const year3 = projections[2];
  const year3MarginDeltaBps = Math.round((year3.projectedMarginPct - year3.baselineMarginPct) * 100);
  const fullTargetMarginDeltaBps = Math.round(
    (year3.fullTargetMarginPct - year3.baselineMarginPct) * 100
  );

  return {
    projections,
    totalInvestmentM,
    threeYearEbitdaLiftM,
    threeYearNetBenefitM,
    threeYearRoiPct,
    fullTargetThreeYearRoiPct,
    paybackMonths,
    year3MarginDeltaBps,
    fullTargetMarginDeltaBps,
  };
}

export function generateTransformationRoadmap(
  scores: PillarScores,
  sector: SectorBenchmark,
  interventions: AiIntervention[]
): RoadmapMilestone[] {
  const pillarMap = Object.fromEntries(DMM_PILLARS.map((p) => [p.id, p]));

  // Sort pillars by largest gap to top-quartile target
  const sortedPillars = [...DMM_PILLARS].sort((a, b) => {
    const gapA = sector.topQuartileTarget[a.id] - scores[a.id];
    const gapB = sector.topQuartileTarget[b.id] - scores[b.id];
    return gapB - gapA;
  });

  const enabledInterventions = interventions.filter((i) => i.enabled);
  const milestones: RoadmapMilestone[] = [];

  // Horizon 1 (Year 1): Kotter Steps 1-3 + Top 2 maturity gaps
  const topGap1 = sortedPillars[0];
  const topGap2 = sortedPillars[1];

  milestones.push({
    id: 'rm-1',
    title: `Establish ${sector.shortLabel} AI Transformation Charter & Executive Coalition`,
    horizon: 'year1',
    timelineLabel: 'Q1 Year 1',
    kotterStep: 1,
    pillar: topGap1.id,
    linkedIntervention: 'Enterprise Governance & Baseline Audit',
    priority: 'P1',
    status: 'in-progress',
  });

  milestones.push({
    id: 'rm-2',
    title: `Remediate ${topGap1.name} Deficit (Current ${scores[topGap1.id].toFixed(1)} → ${(
      scores[topGap1.id] + 0.8
    ).toFixed(1)})`,
    horizon: 'year1',
    timelineLabel: 'Q1–Q2 Year 1',
    kotterStep: 3,
    pillar: topGap1.id,
    linkedIntervention:
      enabledInterventions.find((i) => i.targetPillar === topGap1.id)?.name ??
      'Core Data & Platform Modernization',
    priority: 'P1',
    status: 'planned',
  });

  milestones.push({
    id: 'rm-3',
    title: `Launch ${topGap2.name} Volunteer Pods & Barrier Removal`,
    horizon: 'year1',
    timelineLabel: 'Q2–Q3 Year 1',
    kotterStep: 4,
    pillar: topGap2.id,
    linkedIntervention:
      enabledInterventions.find((i) => i.targetPillar === topGap2.id)?.name ??
      'Cross-Functional Agile Pods',
    priority: 'P1',
    status: 'planned',
  });

  // Map enabled AI interventions across Horizons 1, 2, 3
  enabledInterventions.forEach((intervention, idx) => {
    let horizon: HorizonId = 'year1';
    let timelineLabel = 'Q3–Q4 Year 1';
    let kotterStep = 6;
    let priority: PriorityLevel = 'P1';

    if (idx === 0) {
      horizon = 'year1';
      timelineLabel = 'Q3–Q4 Year 1';
      kotterStep = 6; // Short-Term Wins
      priority = 'P1';
    } else if (idx <= 2) {
      horizon = 'year2';
      timelineLabel = idx === 1 ? 'Q1–Q2 Year 2' : 'Q3–Q4 Year 2';
      kotterStep = idx === 1 ? 5 : 7;
      priority = 'P2';
    } else {
      horizon = 'year3';
      timelineLabel = 'Q1–Q2 Year 3';
      kotterStep = 7;
      priority = 'P2';
    }

    milestones.push({
      id: `rm-int-${intervention.id}`,
      title: `Deploy ${intervention.name} (${intervention.adoptionRate}% Target Adoption)`,
      horizon,
      timelineLabel,
      kotterStep,
      pillar: intervention.targetPillar,
      linkedIntervention: intervention.name,
      priority,
      status: 'planned',
    });
  });

  // Horizon 2 & 3 Culture & Autonomous Enterprise sustainment
  const culturePillar = pillarMap['culture'];
  milestones.push({
    id: 'rm-culture-y2',
    title: `Scale ${culturePillar.name} Upskilling & AI Literacy Across Business Units`,
    horizon: 'year2',
    timelineLabel: 'Q2–Q4 Year 2',
    kotterStep: 5,
    pillar: 'culture',
    linkedIntervention: 'Workforce AI Enablement Program',
    priority: 'P2',
    status: 'planned',
  });

  milestones.push({
    id: 'rm-sustain-y3',
    title: `Institutionalize Autonomous ${sector.shortLabel} Operating Model & Continuous MLOps`,
    horizon: 'year3',
    timelineLabel: 'Q2–Q4 Year 3',
    kotterStep: 8,
    pillar: sortedPillars[2]?.id ?? 'workflows',
    linkedIntervention: 'Full-Scale Autonomous Governance',
    priority: 'P3',
    status: 'planned',
  });

  return milestones;
}
