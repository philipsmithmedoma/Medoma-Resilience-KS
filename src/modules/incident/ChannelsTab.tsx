import { useNavigate } from 'react-router-dom';
import { MessageSquareIcon } from 'lucide-react';
import type { Incident } from '@/data/types';
import { INCIDENT } from '@/data/vocab';
import { IconTile } from '@/components/Card';

/** SPEC.md § 6.2.3 Channels: list with member roles and message count; click → /incident/channels/:channelId. */
export function ChannelsTab({ incident }: { incident: Incident }) {
  const navigate = useNavigate();
  return (
    <ul className="divide-y divide-border border-y border-border">
      {incident.channels.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => navigate(`/incident/channels/${c.id}`)}
            className="flex w-full items-center gap-4 py-2 text-left hover:bg-bg-muted"
          >
            <IconTile icon={MessageSquareIcon} iconClass="text-primary" tileClass="bg-indigo-light" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{c.name}</span>
              <span className="block text-small text-text-secondary">{INCIDENT.members(c.memberRoles)}</span>
            </span>
            <span className="tabular text-text-secondary">{INCIDENT.messages(c.messages.length)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
