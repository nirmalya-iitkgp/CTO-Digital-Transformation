import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AI_INTERVENTIONS,
  DEFAULT_PILLAR_SCORES,
  SECTOR_BENCHMARKS,
} from '../data/benchmarks';
import {
  calculateDigitalMaturityIndex,
  clampNumber,
  computeBottlenecks,
  generateTransformationRoadmap,
  simulateThreeYearRoi,
} from '../utils/dmmEngine';
import {
  exportScenarioToCsv,
  sanitizeCsvCell,
  validateAndParseScenarioJson,
} from '../utils/security';

describe('Meridian DMM Engine — Blue-Pill Functional Tests', () => {
  it('computes weighted Digital Maturity Index (DMI) accurately', () => {
    const { dmiScore, dmiPercentage } = calculateDigitalMaturityIndex(DEFAULT_PILLAR_SCORES);
    // 2.8*0.25 + 2.9*0.20 + 2.5*0.25 + 2.4*0.15 + 3.0*0.15 = 0.70 + 0.58 + 0.625 + 0.36 + 0.45 = 2.715 -> 2.72
    expect(dmiScore).toBe(2.72);
    expect(dmiPercentage).toBe(43);
  });

  it('ranks AI integration bottlenecks by severity descending', () => {
    const finserv = SECTOR_BENCHMARKS.finserv;
    const bottlenecks = computeBottlenecks(DEFAULT_PILLAR_SCORES, finserv);
    expect(bottlenecks.length).toBe(3);
    expect(bottlenecks[0].severityScore).toBeGreaterThanOrEqual(bottlenecks[1].severityScore);
    expect(bottlenecks[1].severityScore).toBeGreaterThanOrEqual(bottlenecks[2].severityScore);
  });

  it('simulates 3-year operating margin expansion and comparative ROI', () => {
    const finserv = SECTOR_BENCHMARKS.finserv;
    const result = simulateThreeYearRoi(
      DEFAULT_PILLAR_SCORES,
      finserv,
      DEFAULT_AI_INTERVENTIONS,
      {
        annualRevenueM: 2400,
        baselineMarginPct: 24.5,
        governanceReadiness: 3.2,
        upskillingVelocity: 3.0,
      }
    );

    expect(result.projections).toHaveLength(3);
    expect(result.projections[2].projectedMarginPct).toBeGreaterThan(24.5);
    expect(result.projections[2].fullTargetMarginPct).toBeGreaterThanOrEqual(
      result.projections[2].projectedMarginPct
    );
    expect(result.threeYearRoiPct).toBeGreaterThan(0);
    expect(result.paybackMonths).not.toBeNull();
  });

  it('handles zero enabled AI interventions gracefully', () => {
    const disabled = DEFAULT_AI_INTERVENTIONS.map((i) => ({ ...i, enabled: false }));
    const result = simulateThreeYearRoi(
      DEFAULT_PILLAR_SCORES,
      SECTOR_BENCHMARKS.retail,
      disabled,
      {
        annualRevenueM: 3100,
        baselineMarginPct: 11.8,
        governanceReadiness: 3.0,
        upskillingVelocity: 3.0,
      }
    );

    expect(result.totalInvestmentM).toBe(0);
    expect(result.threeYearRoiPct).toBe(0);
    expect(result.projections[2].projectedMarginPct).toBe(11.8);
  });

  it('generates phased transformation roadmap from maturity gaps and active interventions', () => {
    const roadmap = generateTransformationRoadmap(
      DEFAULT_PILLAR_SCORES,
      SECTOR_BENCHMARKS.manufacturing,
      DEFAULT_AI_INTERVENTIONS
    );

    expect(roadmap.length).toBeGreaterThanOrEqual(6);
    expect(roadmap.some((m) => m.horizon === 'year1')).toBe(true);
    expect(roadmap.some((m) => m.horizon === 'year2')).toBe(true);
    expect(roadmap.some((m) => m.horizon === 'year3')).toBe(true);
    expect(roadmap.every((m) => m.kotterStep >= 1 && m.kotterStep <= 8)).toBe(true);
  });
});

describe('Meridian DMM Security — Red-Pill Adversarial Tests', () => {
  it('neutralizes CSV formula injection payloads (CWE-1236)', () => {
    expect(sanitizeCsvCell("=CMD|' /C calc'!A0")).toBe(`"'=CMD|' /C calc'!A0"`);
    expect(sanitizeCsvCell('+SUM(A1:A5)')).toBe(`"'+SUM(A1:A5)"`);
    expect(sanitizeCsvCell('-2+3')).toBe(`"'-2+3"`);
    expect(sanitizeCsvCell('@SUM(1+1)')).toBe(`"'@SUM(1+1)"`);
  });

  it('sanitizes malicious scenario names in full CSV export', () => {
    const roi = simulateThreeYearRoi(
      DEFAULT_PILLAR_SCORES,
      SECTOR_BENCHMARKS.finserv,
      DEFAULT_AI_INTERVENTIONS,
      {
        annualRevenueM: 2400,
        baselineMarginPct: 24.5,
        governanceReadiness: 3.0,
        upskillingVelocity: 3.0,
      }
    );
    const csv = exportScenarioToCsv(
      '=HYPERLINK("http://evil.example","Click")',
      'finserv',
      DEFAULT_PILLAR_SCORES,
      roi,
      []
    );
    expect(csv).toContain(`"'=HYPERLINK(""http://evil.example"",""Click"")"`);
  });

  it('clamps out-of-bounds numeric inputs and strips prototype pollution keys on JSON import', () => {
    const maliciousJson = JSON.stringify({
      name: '   Board Scenario   ',
      sector: 'unknown_sector',
      __proto__: { polluted: true },
      pillarScores: {
        data: 999,
        cloud: -50,
        workflows: 'NaN',
        culture: 3.5,
        customer: 4.2,
      },
      interventions: [
        {
          id: 'x1',
          name: 'Test AI',
          targetPillar: 'data',
          enabled: true,
          adoptionRate: 250,
          implementationCostM: -10,
          maxMarginLiftBps: 9000,
          rampQuarters: 99,
        },
      ],
    });

    const parsed = validateAndParseScenarioJson(maliciousJson);
    expect(parsed.sector).toBe('finserv');
    expect(parsed.pillarScores.data).toBe(5.0);
    expect(parsed.pillarScores.cloud).toBe(1.0);
    expect(parsed.pillarScores.workflows).toBe(1.0);
    expect(parsed.interventions[0].adoptionRate).toBe(100);
    expect(parsed.interventions[0].implementationCostM).toBe(0);
    expect(parsed.interventions[0].maxMarginLiftBps).toBe(500);
    expect(parsed.interventions[0].rampQuarters).toBe(8);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('clamps non-finite numbers safely', () => {
    expect(clampNumber(Number.NaN, 1, 5)).toBe(1);
    expect(clampNumber(Infinity, 1, 5)).toBe(1);
  });
});
