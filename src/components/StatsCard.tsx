import React from 'react';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
  description?: string;
}

export default function StatsCard({ title, value, trend, icon: Icon, description }: StatsCardProps) {
  const isPositive = trend && trend > 0;

  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      <div className="flex items-center space-x-5">
        <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold flex items-center justify-center transition-colors group-hover:bg-gold group-hover:text-white">
          <Icon size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-serif font-bold text-dark truncate">{value}</p>
            {trend !== undefined && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                isPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
              )}>
                {isPositive ? "+" : ""}{trend}%
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-400 truncate mt-1">{title}</h3>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gold transition-colors">
        <span>Détails</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
}
