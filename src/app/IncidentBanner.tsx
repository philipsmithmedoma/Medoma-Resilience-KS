import { Link } from 'react-router-dom';
import { useStore } from '@/data/store';
import { LABELS } from '@/data/vocab';
import { cn } from '@/lib/utils';

interface IncidentBannerProps {
  onClose: () => void;
}

/** SPEC.md § 2.5 / DESIGN.md § 3 – shown under the nav whenever an incident is active. */
export function IncidentBanner({ onClose }: IncidentBannerProps) {
  const incident = useStore((s) => s.incident);
  if (!incident) return null;
  const level3 = incident.level === 3;
  return (
    <div
      role="status"
      className={cn(
        'flex h-10 items-center justify-between border-y px-6 text-body font-medium text-text',
        level3 ? 'border-red-icon bg-red-light' : 'border-orange bg-orange-light',
      )}
    >
      <span>{LABELS.incidentBanner(incident.name, incident.activatedAt, incident.activatedBy, incident.commander)}</span>
      <span className="flex items-center gap-6">
        <Link to="/incident" className="text-primary hover:text-primary-hover hover:underline">
          {LABELS.openIncident}
        </Link>
        <button type="button" onClick={onClose} className="text-primary hover:text-primary-hover hover:underline">
          {LABELS.closeIncident}
        </button>
      </span>
    </div>
  );
}
