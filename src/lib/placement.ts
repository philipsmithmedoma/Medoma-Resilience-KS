// Bed-request placement rule – SPEC.md § 6.2. Pure.
import type { BedRequest, Ward } from '@/data/types';
import { t, tm } from '@/lib/i18n';
import { otherSite } from './scope';

export interface PlacementSuggestion {
  ward?: Ward;
  note?: 'utlokalisering' | 'no-bed';
  label: string; // ward name, "{ward} – utlokalisering" or "Ingen plats – överväg {other site}"
}

const ISOLATION = 'Isolering';
const ISOLATION_WARD = 'ARM Infektion';
const IMA = 'IMA';

export function isImaWard(w: Pick<Ward, 'name'>): boolean {
  return w.name.startsWith('IMA');
}

/**
 * First ward at the same site whose name contains the tema of the request's needs and has free > 0.
 * "Isolering" only qualifies ARM Infektion; "IMA" only the site's IMA (see DECISIONS.md). If none: any
 * ward at the site with free > 0 → note `utlokalisering`; else `no-bed` with "Ingen plats – överväg {other site}".
 */
export function suggestWard(request: Pick<BedRequest, 'site' | 'needs'>, wards: Ward[]): PlacementSuggestion {
  const atSite = wards.filter((w) => w.site === request.site);
  const noBed = (): PlacementSuggestion => ({ note: 'no-bed', label: t('FLOW.placement.noBed', { other: tm('SCOPE_LABELS')[otherSite(request.site)] }) });
  if (request.needs.includes(ISOLATION)) {
    const ward = atSite.find((w) => w.name.includes(ISOLATION_WARD) && w.free > 0);
    return ward ? { ward, label: ward.name } : noBed();
  }
  if (request.needs.includes(IMA)) {
    const ward = atSite.find((w) => isImaWard(w) && w.free > 0);
    return ward ? { ward, label: ward.name } : noBed();
  }
  const general = atSite.filter((w) => !isImaWard(w));
  for (const need of request.needs) {
    const ward = general.find((w) => w.name.includes(need) && w.free > 0);
    if (ward) return { ward, label: ward.name };
  }
  const any = general.find((w) => w.free > 0);
  if (any) return { ward: any, note: 'utlokalisering', label: `${any.name} – ${t('FLOW.placement.relocation').toLowerCase()}` };
  return noBed();
}

/** Wards a request may be placed in by hand: same site, free > 0, IMA only for IMA needs. */
export function placeableWards(request: Pick<BedRequest, 'site' | 'needs'>, wards: Ward[]): Ward[] {
  const ima = request.needs.includes(IMA);
  return wards.filter((w) => w.site === request.site && w.free > 0 && isImaWard(w) === ima);
}
