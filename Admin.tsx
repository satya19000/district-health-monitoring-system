/**
 * Health indicator catalogue. `direction: 'lower'` means a lower value is
 * better (e.g. mortality rates); `'higher'` means higher is better (coverage).
 * `target` is a reference value used to colour-code performance.
 */

export type IndicatorDirection = 'higher' | 'lower';

export interface IndicatorDef {
  key: string;
  label: string;
  full: string;
  unit: string;
  direction: IndicatorDirection;
  target: number;
  group: 'maternal' | 'child' | 'disease' | 'coverage' | 'surveillance';
}

export const INDICATORS: IndicatorDef[] = [
  { key: 'MMR', label: 'MMR', full: 'Maternal Mortality Ratio', unit: 'per 100k', direction: 'lower', target: 70, group: 'maternal' },
  { key: 'IMR', label: 'IMR', full: 'Infant Mortality Rate', unit: 'per 1k', direction: 'lower', target: 28, group: 'child' },
  { key: 'U5MR', label: 'U5MR', full: 'Under-5 Mortality Rate', unit: 'per 1k', direction: 'lower', target: 25, group: 'child' },
  { key: 'ANC', label: 'ANC', full: 'Antenatal Care Coverage', unit: '%', direction: 'higher', target: 95, group: 'maternal' },
  { key: 'PNC', label: 'PNC', full: 'Postnatal Care Coverage', unit: '%', direction: 'higher', target: 90, group: 'maternal' },
  { key: 'IMMUNIZATION', label: 'Immunization', full: 'Full Immunization Coverage', unit: '%', direction: 'higher', target: 90, group: 'coverage' },
  { key: 'TB', label: 'TB', full: 'TB Treatment Success Rate', unit: '%', direction: 'higher', target: 90, group: 'disease' },
  { key: 'NCD', label: 'NCD', full: 'NCD Screening Coverage', unit: '%', direction: 'higher', target: 80, group: 'disease' },
  { key: 'IDSP', label: 'IDSP', full: 'IDSP Reporting Completeness', unit: '%', direction: 'higher', target: 90, group: 'surveillance' },
  { key: 'MATERNAL_HEALTH', label: 'Maternal Health', full: 'Maternal Health Composite Index', unit: 'index', direction: 'higher', target: 80, group: 'maternal' },
  { key: 'CHILD_HEALTH', label: 'Child Health', full: 'Child Health Composite Index', unit: 'index', direction: 'higher', target: 80, group: 'child' },
];

export const INDICATOR_MAP: Record<string, IndicatorDef> = Object.fromEntries(
  INDICATORS.map((i) => [i.key, i])
);

export type Performance = 'good' | 'warn' | 'bad' | 'unknown';

/** Classify a value against an indicator's target, respecting its direction. */
export function classify(def: IndicatorDef | undefined, value: number | null | undefined): Performance {
  if (!def || value == null || Number.isNaN(value)) return 'unknown';
  const ratio = value / def.target;
  if (def.direction === 'higher') {
    if (ratio >= 0.98) return 'good';
    if (ratio >= 0.85) return 'warn';
    return 'bad';
  } else {
    if (ratio <= 1.0) return 'good';
    if (ratio <= 1.25) return 'warn';
    return 'bad';
  }
}

export function normalizeIndicatorKey(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]+/g, '_');
}
