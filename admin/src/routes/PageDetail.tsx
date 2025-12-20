import type { PageResponse } from '@tyos/db';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api-client';

interface PageDetailResponse {
  page: PageResponse;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PageDetail() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPage() {
      if (!pageId) return;

      try {
        const response = await apiRequest<PageDetailResponse>(`/pages/${pageId}`);
        setPage(response.page);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch page');
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
  }, [pageId]);

  if (loading) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate('/pages')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Pages
        </button>
        <p className="text-gray-600">Loading page...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate('/pages')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Pages
        </button>
        <p className="text-red-600">Error: {error || 'Page not found'}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/pages')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Pages
        </button>
        <button
          type="button"
          onClick={() => navigate(`/pages/${pageId}/edit`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Edit Page
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header section */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-4xl font-bold mb-3">{page.title}</h1>
          <div className="flex gap-6 text-sm text-gray-600">
            <div>
              <span className="font-medium">Slug:</span> /{page.slug}
            </div>
            <div>
              <span className="font-medium">Created:</span> {formatDate(page.createdAt)}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {formatDate(page.updatedAt)}
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="prose prose-lg max-w-none">
          <Markdown>{page.content}</Markdown>
        </div>
      </div>
    </div>
  );
}
