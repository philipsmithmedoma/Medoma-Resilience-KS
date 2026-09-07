// Message → structured request prefill – SPEC.md § 6.8, DATA.md § 6.3. Pure.
import type { Message, NodeId, Priority } from '@/data/types';
import { VEHICLES } from '@/data/vocab';

export interface ParsedRequest {
  quantity?: number;
  resourceName?: string;
  toNodeId: NodeId;
  priority: Priority;
  note: string;
}

const NUMBER_WORDS: Record<string, number> = {
  en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10, tolv: 12, tjugo: 20,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

// Synonym stems in the order they are tried; the match earliest in the text wins.
const RESOURCE_STEMS: Array<{ stems: string[]; name: string; unless?: string }> = [
  { stems: ['ventilator'], name: 'Ventilator' },
  { stems: ['syrgaskoncentrator', 'koncentrator'], name: 'Syrgaskoncentrator' },
  { stems: ['rullstol'], name: 'Rullstol' },
  { stems: ['bår'], name: 'Bår' },
  { stems: ['monitor'], name: 'Patientmonitor' },
  { stems: ['pump'], name: 'Infusionspump' },
  { stems: ['syrgas'], name: 'Syrgas (flaskor)', unless: 'koncentrator' },
  { stems: ['blod'], name: 'Blodprodukter O-negativ' },
  { stems: ['transportambulans', 'liggande'], name: VEHICLES.transport },
  { stems: ['iva-ambulans'], name: VEHICLES.iva },
  { stems: ['ambulans'], name: VEHICLES.akut },
  { stems: ['defibrillator'], name: 'Defibrillator' },
  { stems: ['ultraljud'], name: 'Mobil ultraljud' },
  { stems: ['nacl', 'natriumklorid'], name: 'NaCl 1 000 ml' },
  { stems: ['morfin'], name: 'Morfin 10 mg' },
  { stems: ['tourniquet'], name: 'Tourniquet' },
  { stems: ['skyddsutrustning', 'munskydd'], name: 'Skyddsutrustning' },
];

const NODE_STEMS: Array<{ stems: string[]; nodeId: NodeId }> = [
  { stems: ['akuten huddinge', 'huddinge'], nodeId: 'huddinge' },
  { stems: ['intensivakuten', 'solna'], nodeId: 'solna' },
  { stems: ['södersjukhuset', 'sös'], nodeId: 'sos' },
  { stems: ['danderyd'], nodeId: 'ds' },
  { stems: ['ambulanssjukvården'], nodeId: 'ambulans' },
];

const HIGH_PRIORITY_STEMS = ['akut ', 'brådskande', 'urgent', 'kritisk', 'omedelbart'];

interface NumberToken {
  value: number;
  index: number;
}

function numberTokens(text: string): NumberToken[] {
  const tokens: NumberToken[] = [];
  const re = /\d+/g;
  for (const m of text.matchAll(re)) tokens.push({ value: Number(m[0]), index: m.index ?? 0 });
  const words = /[a-zåäö]+/gi;
  for (const m of text.matchAll(words)) {
    const n = NUMBER_WORDS[m[0].toLowerCase()];
    if (n !== undefined) tokens.push({ value: n, index: m.index ?? 0 });
  }
  return tokens.sort((a, b) => a.index - b.index);
}

function findResource(lower: string): { name: string; index: number } | undefined {
  let best: { name: string; index: number } | undefined;
  for (const entry of RESOURCE_STEMS) {
    if (entry.unless && lower.includes(entry.unless)) continue;
    for (const stem of entry.stems) {
      const idx = lower.indexOf(stem);
      if (idx >= 0 && (!best || idx < best.index)) best = { name: entry.name, index: idx };
    }
  }
  return best;
}

function findNode(lower: string): NodeId | undefined {
  let best: { nodeId: NodeId; index: number } | undefined;
  for (const entry of NODE_STEMS) {
    for (const stem of entry.stems) {
      const idx = lower.indexOf(stem);
      if (idx >= 0 && (!best || idx < best.index)) best = { nodeId: entry.nodeId, index: idx };
    }
  }
  return best?.nodeId;
}

/**
 * Prefill a request from a message. Quantity is the number (integer or number word) closest before the
 * resource term, falling back to the first number in the text; the node is the first node synonym in the
 * text, otherwise the author's node (DATA.md § 6.3).
 */
export function parseMessage(message: Pick<Message, 'text' | 'nodeId'>): ParsedRequest {
  const text = message.text;
  const lower = text.toLowerCase();
  const resource = findResource(lower);
  const numbers = numberTokens(text);
  let quantity: number | undefined;
  if (resource) {
    const before = numbers.filter((n) => n.index < resource.index);
    quantity = before.length ? before[before.length - 1].value : numbers[0]?.value;
  } else {
    quantity = numbers[0]?.value;
  }
  const toNodeId = findNode(lower) ?? message.nodeId ?? 'huddinge';
  const priority: Priority = HIGH_PRIORITY_STEMS.some((s) => lower.includes(s)) ? 'High' : 'Normal';
  return { quantity, resourceName: resource?.name, toNodeId, priority, note: text };
}
