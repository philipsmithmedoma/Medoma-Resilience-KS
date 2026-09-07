import { ChevronDownIcon } from 'lucide-react';
import { useStore } from '@/data/store';
import { KAROLINSKA_ID, REGION_ID } from '@/data/vocab';
import { t } from '@/lib/i18n';
import { scopeName } from '@/lib/scope';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** DESIGN-KS.md § 2 – Karolinska (båda siter), Solna, Huddinge, Region Stockholm and any node stood up in the session. */
export function ScopeSelector() {
  const scope = useStore((s) => s.scope);
  const nodes = useStore((s) => s.nodes);
  const setScope = useStore((s) => s.setScope);
  const name = scopeName(scope, nodes);
  const stoodUp = nodes.filter((n) => n.id.startsWith('node-'));
  const item = (id: string, label: string) => (
    <DropdownMenuItem key={id} onSelect={() => setScope(id)} className={cn(scope === id && 'text-primary-text')}>
      {label}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-1 rounded-md px-1 text-[18px] leading-7 font-semibold text-text hover:bg-bg-muted"
          aria-label={t('LABELS.scopeAria', { name })}
          title={name}
        >
          <span className="max-w-[240px] truncate">{name}</span>
          <ChevronDownIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        {item(KAROLINSKA_ID, t('SCOPE_LABELS.karolinskaLong'))}
        {item('solna', t('SCOPE_LABELS.solna'))}
        {item('huddinge', t('SCOPE_LABELS.huddinge'))}
        {item(REGION_ID, t('SCOPE_LABELS.region'))}
        {stoodUp.length ? <DropdownMenuSeparator /> : null}
        {stoodUp.map((n) => item(n.id, n.name))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
