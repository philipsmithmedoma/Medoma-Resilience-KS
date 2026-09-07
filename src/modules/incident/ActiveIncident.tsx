import { useState } from 'react';
import { toast } from 'sonner';
import type { BeredskapsLage, Incident } from '@/data/types';
import { useStore } from '@/data/store';
import { INCIDENT, LABELS, LAGEN } from '@/data/vocab';
import { taskCounts } from '@/lib/incident';
import { PageTitle } from '@/components/PageTitle';
import { StatusChip } from '@/components/Chip';
import { SubTabs } from '@/components/SubTabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OverviewTab } from './OverviewTab';
import { TasksTab } from './TasksTab';
import { ChannelsTab } from './ChannelsTab';
import { AuditTable } from '@/components/AuditTable';
import { AddTaskDialog } from './AddTaskDialog';
import { CloseIncidentDialog } from './CloseIncidentDialog';

type TabKey = 'overview' | 'tasks' | 'channels' | 'log';

/** SPEC.md § 6.6 – header with beredskapsläge chip and "Ändra", chips and the four sub-tabs. */
export function ActiveIncident({ incident }: { incident: Incident }) {
  const log = useStore((s) => s.log);
  const setLage = useStore((s) => s.setLage);
  const [tab, setTab] = useState<TabKey>('overview');
  const [addOpen, setAddOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [editingLage, setEditingLage] = useState(false);
  const counts = taskCounts(incident.tasks);
  const startIndex = incident.logStartId ? log.findIndex((e) => e.id === incident.logStartId) : 0;
  const incidentLog = log.slice(Math.max(0, startIndex));

  const tabs = [
    { key: 'overview', label: INCIDENT.tabs.overview },
    { key: 'tasks', label: `${INCIDENT.tabs.tasks} (${counts.done}/${counts.total})` },
    { key: 'channels', label: `${INCIDENT.tabs.channels} (${incident.channels.length})` },
    { key: 'log', label: `${INCIDENT.tabs.log} (${incidentLog.length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <PageTitle title={incident.name}>
            {editingLage ? (
              <Select
                value={incident.lage}
                defaultOpen
                onValueChange={(v) => {
                  setLage(v as BeredskapsLage);
                  setEditingLage(false);
                  toast(INCIDENT.lageChanged);
                }}
              >
                <SelectTrigger className="w-56" aria-label={INCIDENT.lage} size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAGEN.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <StatusChip status={incident.lage} />
                <button type="button" className="text-small text-primary hover:text-primary-hover hover:underline" onClick={() => setEditingLage(true)}>
                  {LABELS.change}
                </button>
              </>
            )}
            <StatusChip status="Active" label={INCIDENT.active} />
          </PageTitle>
          <div className="flex items-center gap-4">
            <Button variant="tertiary" onClick={() => setAddOpen(true)}>
              {INCIDENT.addTask}
            </Button>
            <Button variant="destructive" onClick={() => setCloseOpen(true)}>
              {LABELS.closeIncident}
            </Button>
          </div>
        </div>
        <p className="text-text-secondary">{INCIDENT.activatedLine(incident.activatedAt, incident.activatedBy, incident.commander)}</p>
        {incident.note ? <p className="text-text-secondary">{incident.note}</p> : null}
      </div>

      <SubTabs tabs={tabs} active={tab} onChange={(k) => setTab(k as TabKey)} label={INCIDENT.title} />

      {tab === 'overview' ? <OverviewTab incident={incident} /> : null}
      {tab === 'tasks' ? <TasksTab incident={incident} /> : null}
      {tab === 'channels' ? <ChannelsTab incident={incident} /> : null}
      {tab === 'log' ? <AuditTable entries={incidentLog} /> : null}

      <AddTaskDialog incident={incident} open={addOpen} onOpenChange={setAddOpen} />
      <CloseIncidentDialog open={closeOpen} onOpenChange={setCloseOpen} />
    </div>
  );
}
