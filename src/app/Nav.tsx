import { Link, NavLink } from 'react-router-dom';
import { BookOpenIcon, HeadphonesIcon, MessageSquareIcon } from 'lucide-react';
import { CURRENT_USER, MODULE_DEFS } from '@/data/vocab';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { ScopeSelector } from './ScopeSelector';
import { DemoControls } from './DemoControls';
import { ClockControl } from './ClockControl';
import { ThemeToggle } from './ThemeToggle';
import { LocaleToggle } from './LocaleToggle';

function ModuleTab({ label, path }: { label: string; path: string }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'relative flex h-12 items-center text-nav whitespace-nowrap text-text hover:text-primary-text',
          // The platform marks the active module with a 3 px primary bar along the very top edge of the nav.
          isActive && 'text-primary-text before:absolute before:top-0 before:right-0 before:left-0 before:h-[3px] before:bg-primary',
        )
      }
    >
      {label}
    </NavLink>
  );
}

/** DESIGN-KS.md § 2 top navigation: logo → Start, scope selector, six modules at 16/500 with 32 px gap, right cluster. */
export function Nav() {
  return (
    <header className="flex h-12 items-center border-b border-border bg-surface px-4 whitespace-nowrap">
      <div className="flex shrink-0 items-center gap-3">
        <Link to="/" aria-label={t('LABELS.backToStart')} className="flex items-center">
          <Logo />
        </Link>
        <ScopeSelector />
      </div>
      <nav aria-label={t('LABELS.modulesAria')} className="ml-8 flex h-full shrink-0 items-center gap-8">
        {MODULE_DEFS.map((m) => (
          <ModuleTab key={m.key} label={t(`MODULES.${m.key}`)} path={m.path} />
        ))}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-2 pl-3">
        <span title={t('LABELS.chat')} className="text-text">
          <MessageSquareIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <span title={t('LABELS.support')} className="text-text">
          <HeadphonesIcon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <span title={t('LABELS.documentation')} className="text-text">
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
