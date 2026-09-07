import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { Message } from '@/data/types';
import { useStore } from '@/data/store';
import { lt, t } from '@/lib/i18n';
import { parseMessage, type ParsedRequest } from '@/lib/parse';
import { PageTitle } from '@/components/PageTitle';
import { MessageThread } from '@/components/MessageThread';
import { NewRequestDialog } from '@/modules/resources/NewRequestDialog';

/** SPEC.md § 6.6 – channel thread view; received messages carry "Skapa förfrågan". */
export function ChannelPage() {
  const { channelId } = useParams();
  const incident = useStore((s) => s.incident);
  const sendChannelMessage = useStore((s) => s.sendChannelMessage);
  const channel = incident?.channels.find((c) => c.id === channelId);
  const [prefill, setPrefill] = useState<ParsedRequest | null>(null);
  const [creating, setCreating] = useState(false);

  if (!incident || !channel) {
    return (
      <div className="space-y-4">
        <PageTitle title={t('INCIDENT.title')} />
        <p>{t('INCIDENT.noActive')}</p>
        <Link to="/incident" className="text-primary-text hover:text-primary-hover hover:underline">
          {t('INCIDENT.backToIncident')}
        </Link>
      </div>
    );
  }

  const onCreateRequest = (m: Message) => {
    setPrefill(parseMessage(m));
    setCreating(true);
  };

  return (
    <div className="space-y-4">
      <Link to="/incident" className="text-primary-text hover:text-primary-hover hover:underline">
        {t('INCIDENT.backToIncident')}
      </Link>
      <PageTitle title={lt(channel.name)} scope={lt(incident.name)} />
      <p className="text-small text-text-secondary">{channel.memberRoles.map((r) => lt(r)).join(', ')}</p>
      <MessageThread
        messages={channel.messages}
        className="h-[calc(100vh-300px)] min-h-[360px] max-w-[900px]"
        onSend={(text) => {
          sendChannelMessage(channel.id, text);
          toast(t('INCIDENT.messageSent'));
        }}
        onCreateRequest={onCreateRequest}
      />
      <NewRequestDialog open={creating} onOpenChange={setCreating} prefill={prefill} />
    </div>
  );
}
