import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GithubActivity } from '../lib/api';

interface Props {
  github: GithubActivity;
}

interface TooltipPayload {
  value: number;
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
          commits
        </span>
      </p>
    </div>
  );
};

const BARS = ['#2563eb', '#3b82f6', '#60a5fa'];

export default function GitHubChart({ github }: Props) {
  const data = [
    { period: 'Last 30d', commits: github.commits30d },
    { period: 'Last 60d', commits: github.commits60d },
    { period: 'Last 90d', commits: github.commits90d },
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          {BARS.map((color, i) => (
            <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.6} />
            </linearGradient>
          ))}
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
        <Bar dataKey="commits" radius={[6, 6, 0, 0]} maxBarSize={80}>
          {data.map((_, i) => (
            <Cell key={i} fill={`url(#barGrad${i})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
