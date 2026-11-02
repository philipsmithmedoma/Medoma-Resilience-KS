import { Link, NavLink, useLocation } from 'react-router-dom';
import { BookOpenIcon, ChevronDownIcon, HeadphonesIcon, MessageSquareIcon } from 'lucide-react';
import { CURRENT_USER, MODULE_DEFS, PLATFORM_DEFS } from '@/data/vocab';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { ScopeSelector } from './ScopeSelector';
import { DemoControls } from './DemoControls';
import { ClockControl } from './ClockControl';
import { ThemeToggle } from './ThemeToggle';
import { LocaleToggle } from './LocaleToggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// The platform marks the active module with a 3 px primary bar along the very top edge of the nav.
const ACTIVE_BAR = 'text-primary-text before:absolute before:top-0 before:right-0 before:left-0 before:h-[3px] before:bg-primary';

function ModuleTab({ label, path }: { label: string; path: string }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'relative flex h-12 items-center text-nav whitespace-nowrap text-text hover:text-primary-text',
          // The platform marks the active module with a 3 px primary bar along the very top edge of the nav.
          isActive && ACTIVE_BAR,
        )
      }
    >
      {label}
    </NavLink>
  );
}

/**
 * The five Medoma platform modules (SPEC.md § 11.2). Wide screens show them as tabs; where they do not fit
 * (below 2100 px, which includes the 1280 px minimum) they collapse into one overflow menu labelled "Medoma".
 */
function PlatformTabs() {
  const { pathname } = useLocation();
  const active = PLATFORM_DEFS.some((m) => m.path === pathname);
  return (
    <>
      <div className="hidden h-full items-center gap-8 min-[2100px]:flex">
        {PLATFORM_DEFS.map((m) => (
          <ModuleTab key={m.key} label={t(`MODULES.${m.key}`)} path={m.path} />
        ))}
      </div>
      <div className="h-full min-[2100px]:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('STUB.menuAria')}
              className={cn('relative flex h-12 items-center gap-1 text-nav whitespace-nowrap text-text hover:text-primary-text', active && ACTIVE_BAR)}
            >
              {t('STUB.menu')}
              <ChevronDownIcon className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-44">
            {PLATFORM_DEFS.map((m) => (
              <DropdownMenuItem key={m.key} asChild className={cn(pathname === m.path && 'text-primary-text')}>
                <Link to={m.path}>{t(`MODULES.${m.key}`)}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

/** DESIGN-KS.md § 2 top navigation: logo → Start, scope selector, six modules at 16/500 with 32 px gap, right cluster. */
export function Nav() {
  return (
    <header className="flex h-12 items-center border-b border-border bg-surface px-3 whitespace-nowrap min-[1600px]:px-4">
      <div className="flex shrink-0 items-center gap-3">
        <Link to="/" aria-label={t('LABELS.backToStart')} className="flex items-center">
          <Logo />
        </Link>
        <ScopeSelector />
      </div>
      <nav aria-label={t('LABELS.modulesAria')} className="ml-2 flex h-full shrink-0 items-center gap-4 min-[1600px]:ml-4 min-[1600px]:gap-6 min-[1760px]:gap-8">
        <PlatformTabs />
        {/* 1 px divider between the platform's existing modules and the prototype's (DESIGN.md § 3). */}
        <span aria-hidden className="h-5 w-px bg-border" />
        {MODULE_DEFS.map((m) => (
          <ModuleTab key={m.key} label={t(`MODULES.${m.key}`)} path={m.path} />
        ))}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-0.5 min-[1600px]:gap-1 min-[1680px]:gap-2 min-[1680px]:pl-3">
        <span title={t('LABELS.chat')} className="hidden text-text min-[1680px]:inline">
          <MessageSquareIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <span title={t('LABELS.support')} className="hidden text-text min-[1680px]:inline">
          <HeadphonesIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <span title={t('LABELS.documentation')} className="hidden text-text min-[1680px]:inline">
          <BookOpenIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <ClockControl />
        <LocaleToggle />
        <ThemeToggle />
        <DemoControls />
        <span
          title={CURRENT_USER.name}
          className="flex size-8 items-center justify-center rounded-full bg-avatar-bg text-[14px] font-semibold text-avatar-text"
        >
          {CURRENT_USER.initials}
        </span>
        {/* The name text needs the room the two toggles take at 1280 px; the avatar keeps it as a title (DECISIONS.md, KS build). */}
        <span className="hidden text-[16px] leading-6 min-[1360px]:inline">{CURRENT_USER.name}</span>
      </div>
    </header>
  );
}
