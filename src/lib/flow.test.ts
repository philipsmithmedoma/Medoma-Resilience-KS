import { describe, expect, it } from 'vitest';
import { BED_REQUESTS, ED_NAME, FLOW_METRICS, NODES, WARDS } from '@/data/packs/karolinska';
import { aggregateFigure, blockStatus, FLOW_ROWS, siteBlockStatus, siteValues, type FlowInputs } from './flow';
import { INITIAL_CLOCK } from './time';

const inputs: FlowInputs = { flowMetrics: FLOW_METRICS, nodes: NODES, wards: WARDS, bedRequests: BED_REQUESTS, edName: ED_NAME, clock: INITIAL_CLOCK, outage: { ehrOutage: false, ehrOutageSince: null } };
const solna = siteValues('solna', inputs);
const huddinge = siteValues('huddinge', inputs);

describe('Läget nu values and statuses (SPEC.md § 6.1)', () => {
  it('derives beläggning, lediga, IVA lediga, IMA and the longest wait', () => {
    expect(solna.figures['beds.lediga'].value).toBe(23);
    expect(solna.figures['beds.belagda'].value).toBe(497);
    expect(solna.figures['beds.belaggning'].value).toBeCloseTo(0.956, 3);
    expect(huddinge.figures['beds.belaggning'].value).toBeCloseTo(0.984, 3);
    expect(solna.figures['iva.free'].value).toBe(2);
    expect(huddinge.figures['iva.occupied'].value).toBe(9);
    expect(solna.figures['ima.occupied'].value).toBe(11);
    expect(huddinge.figures['akuten.longestWait'].value).toBe(340);
    expect(solna.figures['akuten.longestWait'].value).toBe(190);
    expect(siteValues('huddinge', { ...inputs, clock: INITIAL_CLOCK + 5 }).figures['akuten.longestWait'].value).toBe(345);
  });

  it('baseline statuses at Karolinska scope: Ansträngt, Kritiskt, Ansträngt, Ansträngt, Kritiskt, Ansträngt', () => {
    const both = [solna, huddinge];
    expect(blockStatus('akuten', both)).toBe('Ansträngt');
    expect(blockStatus('vardplatser', both)).toBe('Kritiskt');
    expect(blockStatus('operation', both)).toBe('Ansträngt');
    expect(blockStatus('bild', both)).toBe('Ansträngt');
    expect(blockStatus('iva', both)).toBe('Kritiskt');
    expect(blockStatus('bemanning', both)).toBe('Ansträngt');
  });

  it('baseline statuses at Solna scope: Akuten Normalt, Vårdplatser Ansträngt, IVA/IMA Ansträngt', () => {
    expect(siteBlockStatus('akuten', solna)).toBe('Normalt');
    expect(siteBlockStatus('vardplatser', solna)).toBe('Ansträngt');
    expect(siteBlockStatus('iva', solna)).toBe('Ansträngt');
    expect(siteBlockStatus('akuten', huddinge)).toBe('Ansträngt');
    expect(siteBlockStatus('iva', huddinge)).toBe('Kritiskt');
  });

  it('aggregates sums and the beläggning ratio with the weakest confidence', () => {
    const rows = FLOW_ROWS.vardplatser;
    const disponibla = aggregateFigure(rows.find((r) => r.key === 'beds.disponibla')!, [solna, huddinge])!;
    expect(disponibla.value).toBe(1070);
    expect(disponibla.confidence).toBe('estimate');
    const ratio = aggregateFigure(rows.find((r) => r.key === 'beds.belaggning')!, [solna, huddinge])!;
    expect(ratio.value).toBeCloseTo(1038 / 1070, 5);
    expect(aggregateFigure(FLOW_ROWS.akuten.find((r) => r.key === 'akuten.longestWait')!, [solna, huddinge])).toBeUndefined();
    const iva = aggregateFigure(FLOW_ROWS.iva[0], [solna, huddinge])!;
    expect(iva.value).toBe(27);
    expect(iva.confidence).toBe('verified');
  });
});
