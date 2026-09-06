import type { ReactElement } from 'react';
import { ExistingModuleStub } from '@/modules/existing/ExistingModuleStub';
import { CommandCenterPage } from '@/modules/command-center/CommandCenterPage';
import { IncidentPage } from '@/modules/incident/IncidentPage';
import { ChannelPage } from '@/modules/incident/ChannelPage';
import { EvacuationPage } from '@/modules/evacuation/EvacuationPage';
import { ResourcesPage } from '@/modules/resources/ResourcesPage';
import { NetworkPage } from '@/modules/network/NetworkPage';
import { NodeDetailPage } from '@/modules/network/NodeDetailPage';

export interface RouteDef {
  path: string;
  element: ReactElement;
}

/** SPEC.md § 2.1 routes (hash-based). */
export const routes: RouteDef[] = [
  { path: '/patients', element: <ExistingModuleStub title="Patients" /> },
  { path: '/activities', element: <ExistingModuleStub title="Activities" /> },
  { path: '/planning', element: <ExistingModuleStub title="Planning" /> },
  { path: '/employees', element: <ExistingModuleStub title="Employees" /> },
  { path: '/reporting', element: <ExistingModuleStub title="Reporting" /> },
  { path: '/command-center', element: <CommandCenterPage /> },
  { path: '/incident', element: <IncidentPage /> },
  { path: '/incident/channels/:channelId', element: <ChannelPage /> },
  { path: '/evacuation', element: <EvacuationPage /> },
  { path: '/resources', element: <ResourcesPage tab="requests" /> },
  { path: '/resources/inventory', element: <ResourcesPage tab="inventory" /> },
  { path: '/resources/from-message', element: <ResourcesPage tab="from-message" /> },
  { path: '/network', element: <NetworkPage /> },
  { path: '/network/:nodeId', element: <NodeDetailPage /> },
];
