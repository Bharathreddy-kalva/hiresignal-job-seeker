import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { JobActivity } from '../lib/api';

interface Props { jobs: JobActivity; }

interface TooltipPayload { value: number; name: string; }

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: TooltipPayload[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <p style={{ color: '#64748b', fontSize: '11px', marginBottom: '3px' }}>{label}</p>
      <p style={{ color: '#2563eb', fontSize: '20px', fontWeight: 700 }}>
        {payload[0].value.toLocaleString()}
        <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>jobs</span>
      </p>
    </div>
  );
};

export default function JobsChart({ jobs }: Props) {
  const data = [
    { period: 'Last 30d', count: jobs.jobs30d },
    { period: 'Last 60d', count: jobs.jobs60d },
    { period: 'Last 90d', count: jobs.jobs90d },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="jobsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="period" stroke="#e2e8f0"
          tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#e2e8f0"
          tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2563eb20', strokeWidth: 2 }} />
        <Area type="monotone" dataKey="count"
          stroke="#2563eb" strokeWidth={2}
          fill="url(#jobsGrad)"
          dot={{ fill: '#2563eb', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
          activeDot={{ fill: '#2563eb', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
