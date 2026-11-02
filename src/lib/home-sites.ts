// The sites of the active home pack (SPEC.md § 14.5): Karolinska's two follow the scope selector, SUS Lund's one site does not.
import type { CareNode, DataPack, HomePackId, NodeId } from '@/data/types';
import { homePacks } from '@/data/packs/home-packs';
import { t, tm } from '@/lib/i18n';
import { sitesInScope } from './scope';

/** The sites reachability runs from: with the Lund pack the one site and the scope ignored, else the sites in scope. */
export function homeSitesInScope(packId: HomePackId, scope: NodeId): string[] {
  return packId === 'karolinska' ? sitesInScope(scope) : homePacks[packId].sites.map((s) => s.id);
}

/** A site's display name: "Karolinska Solna" through the scope labels, else the pack's own site name. */
export function homeSiteName(packId: HomePackId, siteId: string): string {
  if (packId === 'karolinska') return (tm('SCOPE_LABELS') as Record<string, string>)[siteId] ?? siteId;
  return homePacks[packId].sites.find((s) => s.id === siteId)?.name ?? siteId;
}

/** The sites as map nodes: Karolinska's are care nodes of the hospital data; another pack's are built from its site list. */
export function homeSiteNodes(pack: Pick<DataPack, 'homePackId'>, careNodes: CareNode[]): CareNode[] {
  const id = pack.homePackId;
  if (id === 'karolinska') return careNodes.filter((n) => n.id === 'solna' || n.id === 'huddinge');
  return homePacks[id].sites.map((s) => ({
    id: s.id, name: s.name, shortName: s.name, type: 'Hospital', status: 'Operational', lead: '', place: s.name, lat: s.lat, lng: s.lng,
    sharing: 'Full', sync: 'Synced', lastSync: '', accepts: ['Ward'],
  }));
}

/** "Fiktiva patientuppgifter": the marking of the home pages, naming the hospital whose data it is not (SPEC.md § 11, § 14.5). */
export function fictionalMarking(packId: HomePackId): string {
  return packId === 'karolinska' ? t('LABELS.fictionalPatients') : t('LABELS.fictionalPatientsLund');
}

/** The basis text of an illustrative patient count. */
export function fictionalBasis(packId: HomePackId): string {
  return packId === 'karolinska' ? t('HOME.impact.basis') : t('HOME.impact.basisLund');
}
