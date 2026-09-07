import { describe, expect, it } from 'vitest';
import { BED_REQUESTS, WARDS } from '@/data/packs/karolinska';
import { placeableWards, suggestWard } from './placement';

const req = (id: string) => BED_REQUESTS.find((r) => r.id === id)!;

describe('suggestWard (SPEC.md § 6.2)', () => {
  it('matches the tema in the needs at the same site: br-1 → HKN Kardiologi Huddinge, br-8 → HKN Kardiologi Solna', () => {
    expect(suggestWard(req('br-1'), WARDS)).toMatchObject({ ward: { site: 'huddinge', name: 'HKN Kardiologi' } });
    expect(suggestWard(req('br-8'), WARDS)).toMatchObject({ ward: { site: 'solna', name: 'HKN Kardiologi' } });
    expect(suggestWard(req('br-3'), WARDS).ward?.name).toBe('I&Å Internmedicin');
    expect(suggestWard(req('br-12'), WARDS).ward?.name).toBe('HKN Neurologi');
  });

  it('Isolering only qualifies ARM Infektion', () => {
    expect(suggestWard(req('br-2'), WARDS).ward?.name).toBe('ARM Infektion');
    const full = WARDS.map((w) => (w.name === 'ARM Infektion' ? { ...w, free: 0 } : w));
    expect(suggestWard(req('br-2'), full)).toMatchObject({ note: 'no-bed', label: 'Ingen plats – överväg Karolinska Solna' });
  });

  it('br-4 (ARM Kirurgi Huddinge, 0 free) → utlokalisering to the first ward with a free bed', () => {
    const s = suggestWard(req('br-4'), WARDS);
    expect(s.note).toBe('utlokalisering');
    expect(s.ward?.name).toBe('I&Å Internmedicin');
    expect(s.label).toBe('I&Å Internmedicin – utlokalisering');
  });

  it('IMA needs match the IMA only: br-11 → IMA Solna, br-6 → no bed at Huddinge', () => {
    expect(suggestWard(req('br-11'), WARDS).ward?.name).toBe('IMA Solna');
    expect(suggestWard(req('br-6'), WARDS)).toMatchObject({ note: 'no-bed', label: 'Ingen plats – överväg Karolinska Solna' });
    expect(placeableWards(req('br-6'), WARDS)).toHaveLength(0);
    expect(placeableWards(req('br-4'), WARDS).every((w) => w.site === 'huddinge' && !w.name.startsWith('IMA') && w.free > 0)).toBe(true);
  });
});
