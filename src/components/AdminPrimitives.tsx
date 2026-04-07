import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export const adminInputClass =
  'w-full border border-[#E5E0D8] bg-[#F8F6F2] px-4 py-3 text-sm text-[#0A0A0A] outline-none transition-all placeholder:text-[#9A9A8A] focus:border-[#C9A84C] focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/12';

export const adminTextareaClass = `${adminInputClass} resize-none leading-relaxed`;

export const adminGhostButtonClass =
  'inline-flex items-center gap-2 rounded-2xl border border-[#0A0A0A]/12 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#0A0A0A] transition-all hover:border-[#C9A84C] hover:text-[#C9A84C]';

export const adminPrimaryButtonClass =
  'inline-flex items-center gap-2 rounded-2xl bg-[#0A0A0A] px-6 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#F5F0E8] transition-all hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50';

export const adminSecondaryButtonClass =
  'inline-flex items-center gap-2 rounded-2xl bg-[#F5F3EF] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#0A0A0A] transition-all hover:bg-[#ECE7DF]';

export function AdminSectionShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-[#F1EFEA] bg-white shadow-sm', className)}>{children}</div>;
}

export function AdminSectionHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('border-b border-[#0A0A0A]/8 bg-[#FBF8F2] px-8 py-6', className)}>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#9A9A8A]">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-[#0A0A0A]">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#9A9A8A]">{description}</p>}
    </div>
  );
}

export function AdminFieldRow({
  label,
  description,
  children,
  noBorder,
  className,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  noBorder?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('py-6', noBorder ? '' : 'border-b border-[#0A0A0A]/8', className)}>
      <div className="flex items-start justify-between gap-8">
        <div className="w-72 shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0A0A0A]">{label}</p>
          {description && <p className="mt-2 text-sm leading-relaxed text-[#9A9A8A]">{description}</p>}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export function AdminAlert({
  tone,
  children,
  className,
}: {
  tone: 'error' | 'success' | 'warning';
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    error: 'border-[#7C2D2D]/18 bg-[#FBF1F0] text-[#7C2D2D]',
    success: 'border-[#0A0A0A]/8 bg-[#FAF7F2] text-[#5F5647]',
    warning: 'border-[#C9A84C]/30 bg-[#FBF7ED] text-[#6D5622]',
  };

  return <div className={cn('flex items-center gap-3 rounded-2xl border p-4', tones[tone], className)}>{children}</div>;
}

export function AdminToggle({
  checked,
  onToggle,
  className,
}: {
  checked: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-7 w-14 items-center rounded-full transition-colors',
        checked ? 'bg-[#0A0A0A]' : 'bg-[#D9D1C2]',
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-8' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export function AdminIconBadge({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border border-[#C9A84C]/25 bg-white text-[#C9A84C]', className)}>
      <Icon size={18} />
    </div>
  );
}
