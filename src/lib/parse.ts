// Message → structured request prefill – SPEC.md § 6.4.3. Pure.
import type { Message, NodeId, Priority } from '@/data/types';

export interface ParsedRequest {
  quantity?: number;
  resourceName?: string;
  toNodeId: NodeId;
  priority: Priority;
  note: string;
}

const NUMBER_WORDS: Record<string, number> = {
  en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

// Synonym stems in the order they are tried; the match earliest in the text wins.
const RESOURCE_STEMS: Array<{ stems: string[]; name: string; unless?: string }> = [
  { stems: ['ventilator'], name: 'Ventilator' },
  { stems: ['syrgaskoncentrator', 'koncentrator'], name: 'Oxygen concentrator' },
  { stems: ['rullstol'], name: 'Wheelchair' },
  { stems: ['bår'], name: 'Stretcher' },
  { stems: ['monitor'], name: 'Patient monitor' },
  { stems: ['pump'], name: 'Infusion pump' },
  { stems: ['syrgas'], name: 'Oxygen cylinder', unless: 'koncentrator' },
  { stems: ['blod'], name: 'Blood products O-negative' },
  { stems: ['ambulans'], name: 'Ambulance' },
  { stems: ['defibrillator'], name: 'Defibrillator' },
  { stems: ['team'], name: 'Mobile care team' },
];

const NODE_STEMS: Array<{ stems: string[]; nodeId: NodeId }> = [
  { stems: ['ekhaga'], nodeId: 'ekhaga' },
  { stems: ['alfa', 'fältsjukhus'], nodeId: 'falt-alfa' },
  { stems: ['sjöberga'], nodeId: 'sjoberga' },
  { stems: ['hemsjukvård'], nodeId: 'hemsjukvard' },
  { stems: ['akuten', 'vikby'], nodeId: 'vikby' },
];

const HIGH_PRIORITY_STEMS = ['akut', 'urgent', 'kritisk'];

interface NumberToken {
  value: number;
  index: number;
}

function numberTokens(text: string): NumberToken[] {
  const tokens: NumberToken[] = [];
  const re = /\d+|[a-zåäö]+/gi;
  for (const m of text.matchAll(re)) {
    const raw = m[0];
    if (/^\d+$/.test(raw)) tokens.push({ value: Number(raw), index: m.index ?? 0 });
    else {
      const n = NUMBER_WORDS[raw.toLowerCase()];
      if (n !== undefined) tokens.push({ value: n, index: m.index ?? 0 });
    }
  }
  return tokens;
}

function findResource(lower: string): { name: string; index: number } | undefined {
  let best: { name: string; index: number } | undefined;
  for (const entry of RESOURCE_STEMS) {
    if (entry.unless && lower.includes(entry.unless)) continue;
    for (const stem of entry.stems) {
      const i = lower.indexOf(stem);
      if (i >= 0 && (!best || i < best.index)) best = { name: entry.name, index: i };
    }
  }
  return best;
}

function findNode(lower: string): NodeId | undefined {
  let best: { nodeId: NodeId; index: number } | undefined;
  for (const entry of NODE_STEMS) {
    for (const stem of entry.stems) {
      const i = lower.indexOf(stem);
      if (i >= 0 && (!best || i < best.index)) best = { nodeId: entry.nodeId, index: i };
    }
  }
  return best?.nodeId;
}

/**
 * Prefill a request from a message. Quantity is the number (integer or number word) closest before
 * the resource term, falling back to the first number in the text (see DECISIONS.md).
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
  const toNodeId = findNode(lower) ?? message.nodeId ?? 'vikby';
  const priority: Priority = HIGH_PRIORITY_STEMS.some((s) => lower.includes(s)) ? 'High' : 'Normal';
  return { quantity, resourceName: resource?.name, toNodeId, priority, note: text };
}
