import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api-client';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface PagesResponse {
  pages: Page[];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Pages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPages() {
      try {
        const data = await apiRequest<PagesResponse>('/pages');
        setPages(data.pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pages');
      } finally {
        setLoading(false);
      }
    }

    fetchPages();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Pages</h1>
        <p className="text-gray-600">Loading pages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Pages</h1>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Pages</h1>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          New Page
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No pages yet</p>
          <p className="text-sm text-gray-500">Create your first page to get started</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/pages/${page.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {page.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    /{page.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(page.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(page.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
