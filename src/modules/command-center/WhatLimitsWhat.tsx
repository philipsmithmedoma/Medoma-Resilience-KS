import { useId } from 'react';
import type { Capability } from '@/data/types';
import { CC } from '@/data/vocab';
import { capacitySentence, computeCapacity, hasOverrides } from '@/lib/capacity';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SectionHeading } from '@/components/PageTitle';
import { StatusChip } from '@/components/Chip';
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

/** SPEC.md § 6.1.3 – dependency table, capacity sentence, ladder, what-if and note. */
export function WhatLimitsWhat(props: WhatLimitsWhatProps) {
  const { capabilities, selectedId, onSelect, whatIfOn, onWhatIfToggle, overrides, onOverride, onResetWhatIf, headingId } = props;
  const switchId = useId();
  const capability = capabilities.find((c) => c.id === selectedId) ?? capabilities[0];
  if (!capability) {
    return (
      <section id={headingId}>
        <SectionHeading>{CC.whatLimitsWhat}</SectionHeading>
        <p className="text-text-secondary">{CC.noCapabilities}</p>
      </section>
    );
  }
  const active = whatIfOn ? overrides : undefined;
  const result = computeCapacity(capability, active);
  const sentence = capacitySentence(result);
  const dirty = whatIfOn && hasOverrides(capability, overrides);
  const limitingNames = new Set(result.limiting.map((c) => c.name));
  const ladderMax = capability.ladder?.[0]?.value ?? 0;

  return (
    <section id={headingId} className="scroll-mt-4">
      <SectionHeading
        right={
          <div className="flex items-center gap-3">
            {dirty ? <StatusChip status={CC.whatIfNotSaved} /> : null}
            <label htmlFor={switchId} className="text-body">
              {CC.whatIf}
            </label>
            <Switch id={switchId} checked={whatIfOn} onCheckedChange={onWhatIfToggle} />
            {whatIfOn ? (
              <Button variant="link" onClick={onResetWhatIf} disabled={!dirty}>
                {CC.reset}
              </Button>
            ) : null}
          </div>
        }
      >
        {CC.whatLimitsWhat}
      </SectionHeading>

      <SegmentedControl
        label="Capability"
        value={capability.id}
        onChange={onSelect}
        options={capabilities.map((c) => ({ value: c.id, label: c.name }))}
      />

      <div className="mt-4 grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-8">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{CC.columns.component}</TableHead>
                <TableHead className="w-24 text-right">{CC.columns.total}</TableHead>
                <TableHead className="w-32 text-right">{CC.columns.available}</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.components.map((c) => (
                <TableRow key={c.name}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="text-right tabular">{c.total}</TableCell>
                  <TableCell className="text-right tabular">
                    {whatIfOn ? (
                      <Input
                        type="number"
                        min={0}
                        max={c.total}
                        value={c.available}
                        aria-label={`${c.name} available`}
                        onChange={(e) => onOverride(c.name, Number(e.target.value))}
                        className="ml-auto h-8 w-24 text-right"
                      />
                    ) : (
                      c.available
                    )}
                  </TableCell>
                  <TableCell>{limitingNames.has(c.name) ? <StatusChip status={CC.limiting} /> : null}</TableCell>
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
            <h3 className="mb-2 text-text-secondary">Ladder</h3>
            <ol className="space-y-2">
              {capability.ladder.map((step) => (
                <li key={step.label} className="grid grid-cols-[180px_minmax(0,1fr)_40px] items-center gap-3 text-small">
                  <span>{step.label}</span>
                  <span className="h-4 rounded-sm bg-border">
                    <span
                      className="block h-4 rounded-sm bg-primary"
                      style={{ width: `${ladderMax > 0 ? Math.max(2, Math.round((step.value / ladderMax) * 100)) : 0}%` }}
                    />
                  </span>
                  <span className="text-right tabular">{step.value}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
