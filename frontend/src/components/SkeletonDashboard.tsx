import { Skeleton } from './ui/skeleton';

function GlassBox({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: 'rgba(30,41,59,0.5)',
        border: '1px solid rgba(148,163,184,0.08)',
        borderRadius: '16px',
        padding: '28px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function SkeletonDashboard() {
  return (
    <main
      style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}
      className="space-y-8"
    >
      {/* Score hero */}
      <GlassBox style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '48px' }}>
        <Skeleton className="w-48 h-6 rounded-full" style={{ background: '#1e293b' }} />
        <Skeleton className="w-56 h-56 rounded-full" style={{ background: '#1e293b' }} />
        <Skeleton className="w-32 h-4 rounded-full" style={{ background: '#1e293b' }} />
      </GlassBox>

      {/* Score breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[0, 1, 2].map(i => (
          <GlassBox key={i}>
            <Skeleton className="w-10 h-10 rounded-xl mb-4" style={{ background: '#1e293b' }} />
            <Skeleton className="w-24 h-4 rounded mb-2" style={{ background: '#1e293b' }} />
            <Skeleton className="w-16 h-8 rounded" style={{ background: '#1e293b' }} />
          </GlassBox>
        ))}
      </div>

      {/* Charts */}
      {[0, 1].map(i => (
        <GlassBox key={i}>
          <Skeleton className="w-40 h-5 rounded mb-2" style={{ background: '#1e293b' }} />
          <Skeleton className="w-56 h-3 rounded mb-6" style={{ background: '#1e293b' }} />
          <Skeleton className="w-full h-56 rounded-xl" style={{ background: '#1e293b' }} />
        </GlassBox>
      ))}

      {/* AI insight */}
      <GlassBox>
        <Skeleton className="w-32 h-5 rounded mb-4" style={{ background: '#1e293b' }} />
        <Skeleton className="w-full h-4 rounded mb-2" style={{ background: '#1e293b' }} />
        <Skeleton className="w-5/6 h-4 rounded mb-2" style={{ background: '#1e293b' }} />
        <Skeleton className="w-4/6 h-4 rounded" style={{ background: '#1e293b' }} />
      </GlassBox>

      {/* News */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3, 4].map(i => (
          <GlassBox key={i} style={{ padding: '20px' }}>
            <Skeleton className="w-20 h-5 rounded-full mb-3" style={{ background: '#1e293b' }} />
            <Skeleton className="w-full h-4 rounded mb-2" style={{ background: '#1e293b' }} />
            <Skeleton className="w-3/4 h-4 rounded" style={{ background: '#1e293b' }} />
          </GlassBox>
        ))}
      </div>
    </main>
  );
}
