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

interface Props { github: GithubActivity; }

interface TooltipPayload { value: number; }

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
        <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>commits</span>
      </p>
    </div>
  );
};

// Progressively lighter blue shades for 30d → 60d → 90d
const BAR_COLORS = ['#2563eb', '#3b82f6', '#93c5fd'];

export default function GitHubChart({ github }: Props) {
  const data = [
    { period: 'Last 30d', commits: github.commits30d },
    { period: 'Last 60d', commits: github.commits60d },
    { period: 'Last 90d', commits: github.commits90d },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="period" stroke="#e2e8f0"
          tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#e2e8f0"
          tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8faff' }} />
        <Bar dataKey="commits" radius={[5, 5, 0, 0]} maxBarSize={72}>
          {data.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
