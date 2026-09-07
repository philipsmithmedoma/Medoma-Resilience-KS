import { useId } from 'react';
import type { Capability, Figure } from '@/data/types';
import { CAP, SITE_LABELS } from '@/data/vocab';
import { capacitySentence, computeCapacity, hasOverrides } from '@/lib/capacity';
import { fmt } from '@/lib/format';
import { isSite } from '@/lib/scope';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SectionHeading } from '@/components/PageTitle';
import { StatusChip } from '@/components/Chip';
import { ConfidenceChip } from '@/components/ConfidenceChip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface WhatLimitsWhatProps {
  capabilities: Capability[];
  selectedId: string;
  onSelect: (id: string) => void;
  whatIfOn: boolean;
  onWhatIfToggle: (on: boolean) => void;
  overrides?: Record<string, number>;
  onOverride: (component: string, value: number) => void;
  onResetWhatIf: () => void;
  headingId: string;
}

export function capabilityLabel(c: Capability, withSite: boolean): string {
  return withSite && isSite(c.nodeId) ? `${c.name} ${SITE_LABELS[c.nodeId]}` : c.name;
}

/** SPEC.md § 6.5 "Vad begränsar vad" – dependency table with confidence, capacity sentence, ladder, what-if and note. */
export function WhatLimitsWhat(props: WhatLimitsWhatProps) {
  const { capabilities, selectedId, onSelect, whatIfOn, onWhatIfToggle, overrides, onOverride, onResetWhatIf, headingId } = props;
  const switchId = useId();
  const capability = capabilities.find((c) => c.id === selectedId) ?? capabilities[0];
  const withSite = new Set(capabilities.map((c) => c.nodeId)).size > 1;
  if (!capability) {
    return (
      <section id={headingId}>
        <SectionHeading>{CAP.whatLimitsWhat}</SectionHeading>
        <p className="text-text-secondary">{CAP.noCapabilities}</p>
      </section>
    );
  }
  const active = whatIfOn ? overrides : undefined;
  const result = computeCapacity(capability, active);
  const sentence = capacitySentence(result);
  const dirty = whatIfOn && hasOverrides(capability, overrides);
  const limitingNames = new Set(result.limiting.map((c) => c.name));
  const ladderMax = capability.ladder?.[0]?.value ?? 0;
  const componentFigure = (c: Capability['components'][number]): Figure => ({ value: c.total, confidence: c.confidence ?? 'illustrative', source: c.source, basis: c.basis });
  const uniform = capability.components.every((c) => (c.confidence ?? 'illustrative') === (capability.components[0].confidence ?? 'illustrative') && c.source === capability.components[0].source);

  return (
    <section id={headingId} className="scroll-mt-4">
      <SectionHeading
        right={
          <div className="flex items-center gap-3">
            {dirty ? <StatusChip status="Estimat" label={CAP.whatIfNotSaved} /> : null}
            <label htmlFor={switchId} className="text-body">
              {CAP.whatIf}
            </label>
            <Switch id={switchId} checked={whatIfOn} onCheckedChange={onWhatIfToggle} />
            {whatIfOn ? (
              <Button variant="link" onClick={onResetWhatIf} disabled={!dirty}>
                {CAP.reset}
              </Button>
            ) : null}
          </div>
        }
      >
        {CAP.whatLimitsWhat}
      </SectionHeading>

      <SegmentedControl label={CAP.capabilitySwitch} value={capability.id} onChange={onSelect} options={capabilities.map((c) => ({ value: c.id, label: capabilityLabel(c, withSite) }))} />

      <div className="mt-4 grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-8">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{CAP.columns.component}</TableHead>
                <TableHead className="w-28 text-right">
                  <span className="inline-flex items-center gap-2">
                    {CAP.columns.total}
                    {uniform ? <ConfidenceChip figure={componentFigure(capability.components[0])} /> : null}
                  </span>
                </TableHead>
                <TableHead className="w-32 text-right">{CAP.columns.available}</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.components.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="whitespace-normal">{c.name}</TableCell>
                  <TableCell className="text-right tabular">
                    <span className="inline-flex items-center gap-2">
                      {fmt(c.total)}
                      {!uniform ? <ConfidenceChip figure={componentFigure(c)} /> : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular">
                    {whatIfOn ? (
                      <Input
                        type="number"
                        min={0}
                        max={c.total}
                        value={c.available}
                        aria-label={`${c.name} ${CAP.columns.available.toLowerCase()}`}
                        onChange={(e) => onOverride(c.name, Number(e.target.value))}
                        className="ml-auto h-8 w-24 text-right"
                      />
                    ) : (
                      fmt(c.available)
                    )}
                  </TableCell>
                  <TableCell>{limitingNames.has(c.name) ? <StatusChip status="Limiting" label={CAP.limiting} /> : null}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-4">
            {sentence.now}
            {sentence.next ? ` ${sentence.next}` : ''}
          </p>
          {capability.note ? <p className="mt-2 text-small text-text-muted">{capability.note}</p> : null}
        </div>

        {capability.ladder ? (
          <div>
            <h3 className="mb-2 text-text-secondary">{CAP.ladderLabel}</h3>
            <ol className="space-y-2">
              {capability.ladder.map((step) => (
                <li key={step.label} className="grid grid-cols-[180px_minmax(0,1fr)_48px] items-center gap-3 text-small">
                  <span>{step.label}</span>
                  <span className="h-4 rounded-sm bg-track">
                    <span className="block h-4 rounded-sm bg-primary" style={{ width: `${ladderMax > 0 ? Math.max(2, Math.round((step.value / ladderMax) * 100)) : 0}%` }} />
                  </span>
                  <span className="text-right tabular">{fmt(step.value)}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
