import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { Message } from '@/data/types';
import { useStore } from '@/data/store';
import { INCIDENT } from '@/data/vocab';
import { parseMessage, type ParsedRequest } from '@/lib/parse';
import { PageTitle } from '@/components/PageTitle';
import { MessageThread } from '@/components/MessageThread';
import { StubPage } from '@/components/StubPage';
import { NewRequestDialog } from '@/modules/resources/NewRequestDialog';

/** SPEC.md § 6.2.3 – channel thread view; received messages carry "Create request" (§ 6.4.3). */
export function ChannelPage() {
  const { channelId } = useParams();
  const incident = useStore((s) => s.incident);
  const sendChannelMessage = useStore((s) => s.sendChannelMessage);
  const channel = incident?.channels.find((c) => c.id === channelId);
  const [prefill, setPrefill] = useState<ParsedRequest | null>(null);
  const [creating, setCreating] = useState(false);

  if (!incident || !channel) {
    return <StubPage title={INCIDENT.title} sentence={INCIDENT.noActive} linkTo="/incident" linkLabel={INCIDENT.backToIncident} />;
  }

  const onCreateRequest = (m: Message) => {
    setPrefill(parseMessage(m));
    setCreating(true);
  };

  return (
    <div className="space-y-4">
      <Link to="/incident" className="text-primary hover:text-primary-hover hover:underline">
        {INCIDENT.backToIncident}
      </Link>
      <PageTitle title={channel.name} scope={incident.name} />
      <p className="text-small text-text-secondary">{INCIDENT.members(channel.memberRoles)}</p>
      <MessageThread
        messages={channel.messages}
        className="h-[calc(100vh-300px)] min-h-[360px] max-w-[900px]"
        onSend={(text) => {
          sendChannelMessage(channel.id, text);
          toast(INCIDENT.messageSent);
        }}
        onCreateRequest={onCreateRequest}
      />
      <NewRequestDialog open={creating} onOpenChange={setCreating} prefill={prefill} />
    </div>
  );
}
