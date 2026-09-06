import { NavLink } from 'react-router-dom';
import { BookOpenIcon, HeadphonesIcon, MessageSquareIcon } from 'lucide-react';
import { CURRENT_USER, MODULES } from '@/data/vocab';
import { cn } from '@/lib/utils';
import { ScopeSelector } from './ScopeSelector';
import { DemoControls } from './DemoControls';

const existing = MODULES.filter((m) => m.existing);
const added = MODULES.filter((m) => !m.existing);

function ModuleTab({ label, path }: { label: string; path: string }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'relative flex h-12 items-center text-[15px] leading-6 font-medium whitespace-nowrap text-text hover:text-primary',
          // The platform marks the active module with a 3 px primary bar along the very top edge of the nav.
          isActive && 'text-primary before:absolute before:top-0 before:right-0 before:left-0 before:h-[3px] before:bg-primary',
        )
      }
    >
      {label}
    </NavLink>
  );
}

/**
 * DESIGN.md § 3 top navigation: 48 px high, white, 1 px bottom border, no shadow.
 * Tab size and gaps are reduced from DESIGN.md, and the decorative icons and user name only show from
 * 1440 px, so that all ten modules fit at 1280 px (see DECISIONS.md).
 */
export function Nav() {
  return (
    <header className="flex h-12 items-center border-b border-border bg-bg px-4 whitespace-nowrap">
      <div className="flex shrink-0 items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}logo-symbol.svg`} alt="Medoma" width={24} height={24} className="size-6" />
        <ScopeSelector />
      </div>
      <nav aria-label="Modules" className="ml-4 flex h-full shrink-0 items-center gap-3">
        {existing.map((m) => (
          <ModuleTab key={m.key} label={m.label} path={m.path} />
        ))}
        <span aria-hidden className="h-5 w-px bg-border" />
        {added.map((m) => (
          <ModuleTab key={m.key} label={m.label} path={m.path} />
        ))}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-2 pl-4">
        <span title="Chat" className="hidden text-text min-[1440px]:inline">
          <MessageSquareIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <span title="Support" className="hidden text-text min-[1440px]:inline">
          <HeadphonesIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <span title="Documentation" className="hidden text-text min-[1440px]:inline">
          <BookOpenIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <DemoControls />
        <span
          title={CURRENT_USER.name}
          className="flex size-8 items-center justify-center rounded-full bg-orange-light text-[14px] font-semibold text-brown"
        >
          {CURRENT_USER.initials}
        </span>
        <span className="hidden text-[16px] leading-6 min-[1440px]:inline">{CURRENT_USER.name}</span>
      </div>
    </header>
  );
}
