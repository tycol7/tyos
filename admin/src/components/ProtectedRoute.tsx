import { Navigate, Outlet } from 'react-router-dom';

const SESSION_TOKEN_KEY = 'tyos-session-token';

export default function ProtectedRoute() {
  const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);

  if (!sessionToken) {
    // Redirect to login if no session token
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
}
