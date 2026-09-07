import { describe, expect, it } from 'vitest';
import { MESSAGES } from '@/data/packs/karolinska';
import { parseMessage } from './parse';

const msg = (id: string) => MESSAGES.find((m) => m.id === id)!;

describe('parseMessage (SPEC.md § 6.8, DATA.md § 6.3)', () => {
  it('msg-1: 2 Ventilator → huddinge', () => {
    const r = parseMessage(msg('msg-1'));
    expect(r).toMatchObject({ quantity: 2, resourceName: 'Ventilator', toNodeId: 'huddinge', priority: 'Normal' });
    expect(r.note).toBe(msg('msg-1').text);
  });

  it("msg-2: 6 Syrgaskoncentrator → solna (author's node) with the text as note", () => {
    const r = parseMessage(msg('msg-2'));
    expect(r).toMatchObject({ quantity: 6, resourceName: 'Syrgaskoncentrator', toNodeId: 'solna', priority: 'Normal' });
    expect(r.note).toBe(msg('msg-2').text);
  });

  it('msg-3: 4 Rullstol → huddinge', () => {
    const r = parseMessage(msg('msg-3'));
    expect(r).toMatchObject({ quantity: 4, resourceName: 'Rullstol', toNodeId: 'huddinge' });
  });

  it('recognises transport synonyms, node synonyms and urgency', () => {
    expect(parseMessage({ text: 'Brådskande: tre transportambulanser till Södersjukhuset', nodeId: 'huddinge' })).toMatchObject({ quantity: 3, resourceName: 'Transportambulans', toNodeId: 'sos', priority: 'High' });
    expect(parseMessage({ text: 'Skicka två ambulanser till Intensivakuten', nodeId: 'huddinge' })).toMatchObject({ quantity: 2, resourceName: 'Akutambulans', toNodeId: 'solna' });
    expect(parseMessage({ text: 'Hej, hur går det hos er?', nodeId: 'sos' })).toMatchObject({ toNodeId: 'sos', priority: 'Normal' });
  });
});
