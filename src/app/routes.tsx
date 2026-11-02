import type { ReactElement } from 'react';
import { StartPage } from '@/modules/start/StartPage';
import { FlowPage } from '@/modules/flow/FlowPage';
import { CapacityPage } from '@/modules/capacity/CapacityPage';
import { IncidentPage } from '@/modules/incident/IncidentPage';
import { ChannelPage } from '@/modules/incident/ChannelPage';
import { EvacuationPage } from '@/modules/evacuation/EvacuationPage';
import { ResourcesPage } from '@/modules/resources/ResourcesPage';
import { NetworkPage } from '@/modules/network/NetworkPage';
import { NodeDetailPage } from '@/modules/network/NodeDetailPage';
import { HomePage } from '@/modules/home/HomePage';
import { PlatformStubPage } from '@/modules/home/PlatformStubPage';
import { PLATFORM_DEFS } from '@/data/vocab';
import { RootRedirect } from './RootRedirect';
import { SourcesPage } from '@/modules/sources/SourcesPage';

export interface RouteDef {
  path: string;
  element: ReactElement;
}

/** SPEC.md § 3 routes (hash-based). */
export const routes: RouteDef[] = [
  // The root decides by the preparedness state: Start in preparedness mode, the first platform module otherwise.
  { path: '/', element: <RootRedirect /> },
  { path: '/start', element: <StartPage /> },
  { path: '/laget-nu', element: <FlowPage tab="overview" /> },
  { path: '/laget-nu/placering', element: <FlowPage tab="placement" /> },
  { path: '/laget-nu/prognos', element: <FlowPage tab="forecast" /> },
  { path: '/laget-nu/utskrivningsklara', element: <FlowPage tab="discharge" /> },
  { path: '/home', element: <HomePage /> },
  { path: '/kapacitet', element: <CapacityPage /> },
  { path: '/incident', element: <IncidentPage /> },
  { path: '/incident/kanaler/:channelId', element: <ChannelPage /> },
  { path: '/evakuering', element: <EvacuationPage /> },
  { path: '/resurser', element: <ResourcesPage tab="requests" /> },
  { path: '/resurser/lager', element: <ResourcesPage tab="inventory" /> },
  { path: '/resurser/meddelanden', element: <ResourcesPage tab="from-message" /> },
  { path: '/natverk', element: <NetworkPage /> },
  { path: '/natverk/:nodeId', element: <NodeDetailPage /> },
  { path: '/kallor', element: <SourcesPage /> },
  // SPEC.md § 11.2: the five platform modules render a stub page that links to Hospital at Home.
  ...PLATFORM_DEFS.map((m) => ({ path: m.path, element: <PlatformStubPage module={m} /> })),
];

/** Old routes of the first prototype redirect to their new equivalent or to Start (SPEC.md § 3). */
export const redirects: Array<{ from: string; to: string }> = [
  { from: '/command-center', to: '/kapacitet' },
  { from: '/incident/channels/:channelId', to: '/incident' },
  { from: '/evacuation', to: '/evakuering' },
  { from: '/resources', to: '/resurser' },
  { from: '/resources/inventory', to: '/resurser/lager' },
  { from: '/resources/from-message', to: '/resurser/meddelanden' },
  { from: '/network', to: '/natverk' },
  { from: '/network/:nodeId', to: '/natverk' },
];
