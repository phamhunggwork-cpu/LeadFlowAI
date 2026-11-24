import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-2.5 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from: redirectTo }} />;
  }

  return <>{children}</>;
}
