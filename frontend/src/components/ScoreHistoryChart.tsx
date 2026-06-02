import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ScoreHistoryEntry } from '../lib/api';

interface Props {
  history: ScoreHistoryEntry[];
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

const MONO = '"ui-monospace","SFMono-Regular","Menlo","Consolas",monospace';

// "2026-05-31" → "May 31"
function fmtDate(iso: string): string {
  try {
    // Append noon-UTC to avoid date shifting from local timezone offsets
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
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
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      fontFamily: MONO,
    }}>
      <p style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '6px' }}>
        {fmtDate(label ?? '')}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function ScoreHistoryChart({ history }: Props) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={history} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#e2e8f0"
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: MONO }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            tickFormatter={fmtDate}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#e2e8f0"
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: MONO }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontFamily: MONO, fontSize: '11px', paddingTop: '10px' }} />
          <Line
            type="monotone"
            dataKey="score"
            name="overall"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
          />
          <Line
            type="monotone"
            dataKey="jobsScore"
            name="jobs"
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }}
          />
          <Line
            type="monotone"
            dataKey="githubScore"
            name="github"
            stroke="#7c3aed"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p style={{
        fontFamily: MONO,
        color: '#94a3b8',
        fontSize: '10px',
        textAlign: 'right',
        marginTop: '8px',
        letterSpacing: '-0.01em',
      }}>
        Scores cached for 1 hour · Updated daily
      </p>
    </div>
  );
}
