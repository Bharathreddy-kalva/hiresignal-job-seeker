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

interface Props {
  jobs: JobActivity;
}

interface TooltipPayload {
  value: number;
  name: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#1e293b',
        border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: '10px',
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
        {label}
      </p>
      <p style={{ color: '#3b82f6', fontSize: '22px', fontWeight: 700 }}>
        {payload[0].value.toLocaleString()}
        <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '4px' }}>
          jobs
        </span>
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
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="jobsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="period"
          stroke="#334155"
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="#334155"
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f620', strokeWidth: 2 }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          strokeWidth={2.5}
          fill="url(#jobsGrad)"
          dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
          activeDot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#1e3a5f' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
