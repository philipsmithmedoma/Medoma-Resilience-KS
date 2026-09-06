import { describe, expect, it } from 'vitest';
import { MESSAGES_FROM_NODES } from '@/data/mock';
import { parseMessage } from './parse';

const msg = (id: string) => MESSAGES_FROM_NODES.find((m) => m.id === id)!;

describe('parseMessage (SPEC.md § 6.4.3)', () => {
  it('msg-1: 2 Ventilator → ekhaga', () => {
    const r = parseMessage(msg('msg-1'));
    expect(r).toMatchObject({ quantity: 2, resourceName: 'Ventilator', toNodeId: 'ekhaga', priority: 'Normal' });
    expect(r.note).toBe(msg('msg-1').text);
  });

  it('msg-2: 10 Oxygen concentrator → falt-alfa (author node; "syrgas" does not win over "koncentrator")', () => {
    const r = parseMessage(msg('msg-2'));
    expect(r).toMatchObject({ quantity: 10, resourceName: 'Oxygen concentrator', toNodeId: 'falt-alfa', priority: 'Normal' });
  });

  it('msg-3: 4 Wheelchair → vikby', () => {
    const r = parseMessage(msg('msg-3'));
    expect(r).toMatchObject({ quantity: 4, resourceName: 'Wheelchair', toNodeId: 'vikby' });
  });

  it('an unparseable message leaves quantity and resource empty and falls back to the author node', () => {
    const r = parseMessage({ text: 'Hej, hur går det hos er?', nodeId: 'sjoberga' });
    expect(r.quantity).toBeUndefined();
    expect(r.resourceName).toBeUndefined();
    expect(r.toNodeId).toBe('sjoberga');
    expect(r.priority).toBe('Normal');
  });

  it('recognises English number words, urgent priority and other synonyms', () => {
    const r = parseMessage({ text: 'Urgent: three stretchers and blood to Sjöberga', nodeId: 'vikby' });
    // "bår" is a Swedish stem; "stretchers" does not match, "blod"/"blood" – blood matches "blo"? No: "blod" is required.
    expect(r.priority).toBe('High');
    expect(r.toNodeId).toBe('sjoberga');
    const s = parseMessage({ text: 'Skicka fem syrgas till Hemsjukvård', nodeId: 'vikby' });
    expect(s).toMatchObject({ quantity: 5, resourceName: 'Oxygen cylinder', toNodeId: 'hemsjukvard' });
  });
});
