import {
  AiIntervention,
  PillarId,
  PillarScores,
  RoadmapMilestone,
  RoiComparisonResult,
  SavedScenario,
  SectorId,
} from '../types/dmm';
import { clampNumber } from './dmmEngine';

const STORAGE_KEY = 'meridian_dmm_scenarios_v1';
const VALID_PILLARS: PillarId[] = ['data', 'cloud', 'workflows', 'culture', 'customer'];
const VALID_SECTORS: SectorId[] = ['finserv', 'healthcare', 'retail', 'manufacturing'];

/**
 * Prevents CSV formula injection (CWE-1236) by prefixing dangerous leading characters
 * with a single quote and applying RFC-4180 double-quote escaping.
 */
export function sanitizeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = String(value ?? '');
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  const escaped = neutralized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportScenarioToCsv(
  scenarioName: string,
  sectorId: SectorId,
  scores: PillarScores,
  roi: RoiComparisonResult,
  milestones: RoadmapMilestone[]
): string {
  const lines: string[] = [];
  lines.push(['Section', 'Metric / Item', 'Category / Horizon', 'Value / Status', 'Notes'].map(sanitizeCsvCell).join(','));

  lines.push(['Metadata', 'Scenario Name', 'General', scenarioName, `Sector: ${sectorId}`].map(sanitizeCsvCell).join(','));

  for (const pillar of VALID_PILLARS) {
    lines.push(['DMM Audit', pillar.toUpperCase(), 'Pillar Score (1-5)', scores[pillar].toFixed(2), ''].map(sanitizeCsvCell).join(','));
  }

  for (const p of roi.projections) {
    lines.push(
      [
        '3-Year ROI',
        `Year ${p.year} Operating Margin`,
        `Baseline: ${p.baselineMarginPct}%`,
        `${p.projectedMarginPct}%`,
        `Target: ${p.fullTargetMarginPct}% | Net Benefit: $${p.netCumulativeBenefitM}M`,
      ]
        .map(sanitizeCsvCell)
        .join(',')
    );
  }

  lines.push(
    ['3-Year ROI', 'Net 3-Year ROI %', 'Summary', `${roi.threeYearRoiPct}%`, `Investment: $${roi.totalInvestmentM}M | EBITDA Lift: $${roi.threeYearEbitdaLiftM}M`]
      .map(sanitizeCsvCell)
      .join(',')
  );

  for (const m of milestones) {
    lines.push(
      ['Roadmap', m.title, `${m.horizon.toUpperCase()} (${m.timelineLabel})`, `${m.priority} - ${m.status}`, `Kotter Step ${m.kotterStep} | ${m.linkedIntervention}`]
        .map(sanitizeCsvCell)
        .join(',')
    );
  }

  return lines.join('\n');
}

export function validateAndParseScenarioJson(rawJson: string): SavedScenario {
  if (rawJson.length > 500_000) {
    throw new Error('Scenario file exceeds maximum allowed size (500KB).');
  }

  const parsed = JSON.parse(rawJson, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }
    return value;
  });

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON structure.');
  }

  const sector: SectorId = VALID_SECTORS.includes(parsed.sector) ? parsed.sector : 'finserv';
  const name =
    typeof parsed.name === 'string' && parsed.name.trim().length > 0
      ? parsed.name.trim().slice(0, 80)
      : 'Imported Scenario';

  const pillarScores: PillarScores = {
    data: clampNumber(Number(parsed.pillarScores?.data ?? 2.8), 1.0, 5.0),
    cloud: clampNumber(Number(parsed.pillarScores?.cloud ?? 2.9), 1.0, 5.0),
    workflows: clampNumber(Number(parsed.pillarScores?.workflows ?? 2.5), 1.0, 5.0),
    culture: clampNumber(Number(parsed.pillarScores?.culture ?? 2.4), 1.0, 5.0),
    customer: clampNumber(Number(parsed.pillarScores?.customer ?? 3.0), 1.0, 5.0),
  };

  const interventions: AiIntervention[] = Array.isArray(parsed.interventions)
    ? parsed.interventions.slice(0, 25).map((item: Record<string, unknown>, idx: number) => ({
        id: typeof item.id === 'string' ? item.id.slice(0, 40) : `imp-${idx}`,
        name: typeof item.name === 'string' ? item.name.slice(0, 100) : `Intervention ${idx + 1}`,
        targetPillar: VALID_PILLARS.includes(item.targetPillar as PillarId)
          ? (item.targetPillar as PillarId)
          : 'workflows',
        enabled: Boolean(item.enabled),
        adoptionRate: clampNumber(Number(item.adoptionRate ?? 50), 0, 100),
        implementationCostM: clampNumber(Number(item.implementationCostM ?? 2.0), 0, 250),
        maxMarginLiftBps: clampNumber(Number(item.maxMarginLiftBps ?? 50), 1, 500),
        rampQuarters: clampNumber(Number(item.rampQuarters ?? 4), 1, 8),
        isCustom: Boolean(item.isCustom),
      }))
    : [];

  const roiParams = {
    annualRevenueM: clampNumber(Number(parsed.roiParams?.annualRevenueM ?? 2400), 10, 500000),
    baselineMarginPct: clampNumber(Number(parsed.roiParams?.baselineMarginPct ?? 20), 1, 80),
    governanceReadiness: clampNumber(Number(parsed.roiParams?.governanceReadiness ?? 3.0), 1, 5),
    upskillingVelocity: clampNumber(Number(parsed.roiParams?.upskillingVelocity ?? 3.0), 1, 5),
  };

  const milestones: RoadmapMilestone[] = Array.isArray(parsed.milestones)
    ? parsed.milestones.slice(0, 40).map((m: Record<string, unknown>, idx: number) => ({
        id: typeof m.id === 'string' ? m.id.slice(0, 40) : `rm-${idx}`,
        title: typeof m.title === 'string' ? m.title.slice(0, 140) : `Milestone ${idx + 1}`,
        horizon:
          m.horizon === 'year1' || m.horizon === 'year2' || m.horizon === 'year3'
            ? m.horizon
            : 'year1',
        timelineLabel:
          typeof m.timelineLabel === 'string' ? m.timelineLabel.slice(0, 30) : 'Q1–Q2 Year 1',
        kotterStep: clampNumber(Math.round(Number(m.kotterStep ?? 1)), 1, 8),
        pillar: VALID_PILLARS.includes(m.pillar as PillarId) ? (m.pillar as PillarId) : 'workflows',
        linkedIntervention:
          typeof m.linkedIntervention === 'string'
            ? m.linkedIntervention.slice(0, 100)
            : 'Core Transformation',
        priority:
          m.priority === 'P1' || m.priority === 'P2' || m.priority === 'P3' ? m.priority : 'P2',
        status:
          m.status === 'planned' || m.status === 'in-progress' || m.status === 'completed'
            ? m.status
            : 'planned',
        isCustom: Boolean(m.isCustom),
      }))
    : [];

  return {
    id: typeof parsed.id === 'string' ? parsed.id.slice(0, 50) : `sc-${Date.now()}`,
    name,
    updatedAt: new Date().toISOString(),
    sector,
    pillarScores,
    interventions,
    roiParams,
    milestones,
  };
}

export function loadScenariosFromStorage(): SavedScenario[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .slice(0, 15)
      .map((item) => {
        try {
          return validateAndParseScenarioJson(JSON.stringify(item));
        } catch {
          return null;
        }
      })
      .filter((x): x is SavedScenario => x !== null);
  } catch {
    return [];
  }
}

export function saveScenariosToStorage(scenarios: SavedScenario[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios.slice(0, 15)));
  } catch {
    // Ignore quota exceeded in restricted environments
  }
}
