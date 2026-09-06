import { useState } from 'react';
import { toast } from 'sonner';
import type { Message } from '@/data/types';
import { useStore } from '@/data/store';
import { INCIDENT } from '@/data/vocab';
import { parseMessage, type ParsedRequest } from '@/lib/parse';
import { MessageThread } from '@/components/MessageThread';
import { NewRequestDialog } from './NewRequestDialog';

/** SPEC.md § 6.4.3 – the message thread of node messages; received messages carry "Create request". */
export function FromMessageTab() {
  const messages = useStore((s) => s.messagesFromNodes);
  const addNodeMessage = useStore((s) => s.addNodeMessage);
  const [prefill, setPrefill] = useState<ParsedRequest | null>(null);
  const [open, setOpen] = useState(false);

  const onCreateRequest = (m: Message) => {
    setPrefill(parseMessage(m));
    setOpen(true);
  };

  return (
    <>
      <MessageThread
        messages={messages}
        className="h-[calc(100vh-260px)] min-h-[360px] max-w-[900px]"
        onSend={(text) => {
          addNodeMessage(text);
          toast(INCIDENT.messageSent);
        }}
        onCreateRequest={onCreateRequest}
      />
      <NewRequestDialog open={open} onOpenChange={setOpen} prefill={prefill} />
    </>
  );
}
