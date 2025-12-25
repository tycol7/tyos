import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest, clearSessionToken } from '../lib/api-client';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [deploying, setDeploying] = useState(false);

  const isActive = (path: string) => {
    const isMatch = path === '/' ? location.pathname === path : location.pathname.startsWith(path);

    return isMatch ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700 hover:text-white';
  };

  const handleDeployPreview = async () => {
    if (!confirm('Deploy a preview of the site with the latest photos from the database?')) {
      return;
    }

    setDeploying(true);

    try {
      const response = await apiRequest('/deploy/preview', {
        method: 'POST',
      });

      alert('Preview deploy triggered! Check GitHub Actions for progress.');
      console.log('Deploy response:', response);
    } catch (err) {
      alert(`Failed to trigger deploy: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Deploy error:', err);
    } finally {
      setDeploying(false);
    }
  };

  const handleDeployProduction = async () => {
    if (
      !confirm(
        '⚠️ Deploy to PRODUCTION? This will update the live site with the latest photos from the database.'
      )
    ) {
      return;
    }

    setDeploying(true);

    try {
      const response = await apiRequest('/deploy/production', {
        method: 'POST',
      });

      alert(
        'Production deploy triggered! The live site will update shortly. Check GitHub Actions for progress.'
      );
      console.log('Deploy response:', response);
    } catch (err) {
      alert(`Failed to trigger deploy: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Deploy error:', err);
    } finally {
      setDeploying(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      clearSessionToken();
      navigate('/login');
    }
  };

  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-white font-bold text-xl">
              tyOS Admin
            </Link>
            <div className="flex space-x-2">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}>
                Home
              </Link>
              <Link
                to="/photos"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/photos')}`}
              >
                Photos
              </Link>
              <Link
                to="/pages"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/pages')}`}
              >
                Pages
              </Link>
              <Link
                to="/posts"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/posts')}`}
              >
                Posts
              </Link>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDeployPreview}
              disabled={deploying}
              className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Deploy icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {deploying ? 'Deploying...' : 'Deploy Preview'}
            </button>
            <button
              type="button"
              onClick={handleDeployProduction}
              disabled={deploying}
              className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Deploy icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              {deploying ? 'Deploying...' : 'Deploy Production'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Logout icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
