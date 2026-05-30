import { Skeleton } from './ui/skeleton';

const card: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...card, padding: '24px', ...style }}>{children}</div>;
}

const sk = { background: '#f1f5f9' } as React.CSSProperties;

export default function SkeletonDashboard() {
  return (
    <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '48px', paddingBottom: '36px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton className="w-32 h-3 rounded" style={sk} />
          <Skeleton className="w-64 h-8 rounded" style={sk} />
          <Skeleton className="w-48 h-3 rounded" style={sk} />
        </div>
        <Skeleton className="rounded-full" style={{ ...sk, width: '180px', height: '180px', flexShrink: 0 }} />
      </div>

      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {[0, 1, 2].map(i => (
          <Card key={i}>
            <Skeleton className="w-20 h-3 rounded mb-3" style={sk} />
            <Skeleton className="w-16 h-8 rounded mb-2" style={sk} />
            <Skeleton className="w-28 h-3 rounded" style={sk} />
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {[0, 1].map(i => (
          <Card key={i}>
            <Skeleton className="w-36 h-4 rounded mb-2" style={sk} />
            <Skeleton className="w-48 h-3 rounded mb-5" style={sk} />
            <Skeleton className="w-full h-52 rounded-lg" style={sk} />
          </Card>
        ))}
      </div>

      {/* AI insight */}
      <Card>
        <Skeleton className="w-24 h-3 rounded mb-4" style={sk} />
        <Skeleton className="w-full h-4 rounded mb-2" style={sk} />
        <Skeleton className="w-5/6 h-4 rounded mb-2" style={sk} />
        <Skeleton className="w-3/4 h-4 rounded" style={sk} />
      </Card>

      {/* News */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <Card key={i} style={{ padding: '16px 20px' }}>
            <Skeleton className="w-full h-4 rounded mb-2" style={sk} />
            <Skeleton className="w-40 h-3 rounded" style={sk} />
          </Card>
        ))}
      </div>
    </main>
  );
}
