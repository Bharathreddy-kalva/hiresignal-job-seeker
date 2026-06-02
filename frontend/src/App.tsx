import { useAuth } from '@clerk/clerk-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage   from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ResultsPage   from './pages/ResultsPage';
import ComparePage   from './pages/ComparePage';
import WatchlistPage from './pages/WatchlistPage';
import SignInPage    from './pages/SignInPage';
import SignUpPage    from './pages/SignUpPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;                              // wait for Clerk to hydrate
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public ────────────────────────────────────────────────── */}
      <Route path="/"          element={<LandingPage />} />
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      {/* ── Protected ─────────────────────────────────────────────── */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/results"   element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
      <Route path="/compare"   element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
      <Route path="/watchlist" element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>} />
    </Routes>
  );
}
