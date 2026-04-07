import React from 'react';
import { cn } from '../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: number;
  description?: string;
}

export default function StatsCard({
  title,
  value,
  trend,
  description,
}: StatsCardProps) {
  const trendLabel =
    trend === undefined ? null : `${trend > 0 ? '+' : ''}${trend}%`;

  return (
    <div className="border border-[#0A0A0A]/10 bg-white p-6">
      <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
        {title}
      </p>
      <p className="mt-3 font-serif text-[2.4rem] leading-none tracking-[-0.03em] text-[#0A0A0A]">
        {value}
      </p>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#0A0A0A]/8 pt-4">
        <p className="text-sm leading-6 text-[#9A9A8A]">
          {description || 'Donnée clé de pilotage AFRIKHER.'}
        </p>
        {trendLabel ? (
          <span
            className={cn(
              'shrink-0 text-[0.65rem] uppercase tracking-[0.2em]',
              trend > 0 ? 'text-[#8A6E2F]' : 'text-[#9C4C3A]'
            )}
          >
            {trendLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
