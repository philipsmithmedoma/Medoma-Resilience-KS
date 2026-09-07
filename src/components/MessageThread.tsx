import { useId, useState, type FormEvent } from 'react';
import { SendIcon } from 'lucide-react';
import type { Message } from '@/data/types';
import { CURRENT_USER, INCIDENT, SYSTEM_ACTOR } from '@/data/vocab';
import { cn } from '@/lib/utils';

interface MessageThreadProps {
  messages: Message[];
  onSend: (text: string) => void;
  /** When set, received messages (not Eva Lind, not System) carry a "Skapa förfrågan" link. */
  onCreateRequest?: (message: Message) => void;
  emptyText?: string;
  className?: string;
}

/**
 * DESIGN.md § 4 message thread: sent messages right-aligned in primary bubbles, received left-aligned
 * in border-colour bubbles, sender line "Namn, Roll, HH:MM" above each; bg-muted input area.
 */
export function MessageThread({ messages, onSend, onCreateRequest, emptyText = INCIDENT.noMessages, className }: MessageThreadProps) {
  const [text, setText] = useState('');
  const inputId = useId();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };
  return (
    <div className={cn('flex flex-col rounded-lg border border-border', className)}>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? <p className="text-text-secondary">{emptyText}</p> : null}
        {messages.map((m) => {
          const sent = m.author === CURRENT_USER.name;
          const system = m.author === SYSTEM_ACTOR;
          const received = !sent && !system;
          return (
            <div key={m.id} className={cn('flex flex-col', sent ? 'items-end' : 'items-start')}>
              <div className="mb-1 text-small text-text-secondary">
                {m.author}, {m.role}, <span className="tabular">{m.at}</span>
              </div>
              <div className={cn('max-w-[70%] rounded-lg px-3 py-2 text-body', sent ? 'bg-primary text-primary-foreground' : 'bg-bg-muted text-text')}>{m.text}</div>
              {received && onCreateRequest ? (
                <button type="button" className="mt-1 text-small text-primary-text hover:text-primary-hover hover:underline" onClick={() => onCreateRequest(m)}>
                  {INCIDENT.createRequest}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border bg-bg-muted p-3">
        <label htmlFor={inputId} className="sr-only">
          {INCIDENT.messagePlaceholder}
        </label>
        <input
          id={inputId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={INCIDENT.messagePlaceholder}
          className="h-9 flex-1 rounded-md border border-border-input bg-surface px-3 text-body"
        />
        <button
          type="submit"
          aria-label={INCIDENT.send}
          disabled={!text.trim()}
          className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-border-input"
        >
          <SendIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      </form>
    </div>
  );
}
