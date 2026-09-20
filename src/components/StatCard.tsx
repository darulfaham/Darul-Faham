import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  subtitle?: string;
  badgeColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  badgeColor = 'bg-indigo-50 text-indigo-600'
}) => (
  <div id={id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between transition-all hover:shadow-md">
    <div className="space-y-1">
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
      {trend && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-emerald-600 text-xs font-bold">{trend} ↑</span>
          {subtitle && <span className="text-slate-400 text-xs font-normal">vs last month</span>}
        </div>
      )}
      {!trend && subtitle && (
        <p className="text-slate-400 text-xs font-normal pt-0.5">{subtitle}</p>
      )}
    </div>
    <div className={`h-12 w-12 rounded-xl ${badgeColor} flex items-center justify-center shrink-0 shadow-xs`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);
