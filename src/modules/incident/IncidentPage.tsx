import { useStore } from '@/data/store';
import { INCIDENT } from '@/data/vocab';
import { PageTitle } from '@/components/PageTitle';
import { PlaybooksTable } from './PlaybooksTable';
import { PreviousIncidents } from './PreviousIncidents';
import { ActiveIncident } from './ActiveIncident';

/** SPEC.md § 6.6 – state decides whether the playbook list or the active incident is shown. */
export function IncidentPage() {
  const incident = useStore((s) => s.incident);
  if (incident) return <ActiveIncident incident={incident} />;
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <PageTitle title={INCIDENT.title} />
        <p>{INCIDENT.noActive}</p>
      </div>
      <PlaybooksTable />
      <PreviousIncidents />
    </div>
  );
}
