import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { ReactNode } from 'react';

interface AdminProtectedRouteProps {
  children?: ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading, isAuthorizedAdmin } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#c5a880',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ fontSize: '14px', letterSpacing: '0.05em', color: '#94a3b8' }}>
          VERIFYING ADMIN PRIVILEGES...
        </div>
      </div>
    );
  }

  if (!user || !isAuthorizedAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children ? <>{children}</> : null;
}
