import { ChevronDownIcon } from 'lucide-react';
import { useStore } from '@/data/store';
import { REGION_ID, REGION_NAME } from '@/data/vocab';
import { scopeName } from '@/lib/scope';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** SPEC.md § 2.2 – the scope name at the top-left is a dropdown of Region Nord and every node. */
export function ScopeSelector() {
  const scope = useStore((s) => s.scope);
  const nodes = useStore((s) => s.nodes);
  const setScope = useStore((s) => s.setScope);
  const name = scopeName(scope, nodes);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-1 rounded-md px-1 text-[18px] leading-7 font-semibold text-text hover:bg-bg-muted"
          aria-label={`Scope: ${name}`}
          title={name}
        >
          <span className="max-w-[200px] truncate">{name}</span>
          <ChevronDownIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuItem onSelect={() => setScope(REGION_ID)} className={scope === REGION_ID ? 'text-primary' : ''}>
          {REGION_NAME}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {nodes.map((n) => (
          <DropdownMenuItem key={n.id} onSelect={() => setScope(n.id)} className={scope === n.id ? 'text-primary' : ''}>
            {n.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
