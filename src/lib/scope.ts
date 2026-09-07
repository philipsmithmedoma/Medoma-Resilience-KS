// Scope helpers – SPEC.md § 2. Scope is Karolinska (both sites), one site, the region or a stood-up node.
import type { CareNode, NodeId, SiteId } from '@/data/types';
import { KAROLINSKA_ID, REGION_ID } from '@/data/vocab';
import { getLocale, t, tm } from '@/lib/i18n';

export const SITES: SiteId[] = ['solna', 'huddinge'];

export function isRegion(scope: NodeId): boolean {
  return scope === REGION_ID;
}

export function isKarolinska(scope: NodeId): boolean {
  return scope === KAROLINSKA_ID;
}

export function isSite(scope: NodeId): scope is SiteId {
  return scope === 'solna' || scope === 'huddinge';
}

/** True for scopes that show hospital figures (Karolinska, a site or the region). */
export function isHospitalScope(scope: NodeId): boolean {
  return isKarolinska(scope) || isSite(scope) || isRegion(scope);
}

/** The sites whose figures the scope covers; the region and Karolinska cover both, a stood-up node none. */
export function sitesInScope(scope: NodeId): SiteId[] {
  if (isSite(scope)) return [scope];
  if (isKarolinska(scope) || isRegion(scope)) return SITES;
  return [];
}

export function scopeName(scope: NodeId, nodes: CareNode[]): string {
  if (isKarolinska(scope)) return t('SCOPE_LABELS.karolinska');
  if (isRegion(scope)) return t('SCOPE_LABELS.region');
  if (isSite(scope)) return tm('SCOPE_LABELS')[scope];
  const node = nodes.find((n) => n.id === scope);
  return node ? nodeLabel(node) : t('SCOPE_LABELS.karolinska');
}

/** A node's display name: capacity classes and the transport node get their English descriptor in English mode (DESIGN-LANG.md § 4). */
export function nodeLabel(node: Pick<CareNode, 'name' | 'descriptorEn'>): string {
  return getLocale() === 'en' && node.descriptorEn ? `${node.name} (${node.descriptorEn})` : node.name;
}

export function siteName(site: SiteId): string {
  return tm('SCOPE_LABELS')[site];
}

/** The other Karolinska site. */
export function otherSite(site: SiteId): SiteId {
  return site === 'solna' ? 'huddinge' : 'solna';
}

/** Evacuation source site for a scope: a site, or Huddinge for Karolinska and region (SPEC.md § 2). */
export function defaultEvacuationSite(scope: NodeId): SiteId {
  return isSite(scope) ? scope : 'huddinge';
}
