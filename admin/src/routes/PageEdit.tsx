import type { PageResponse, UpdatePageInput } from '@tyos/db';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MarkdownEditor from '../components/MarkdownEditor';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { apiRequest } from '../lib/api-client';
import { turndownService } from '../lib/markdown';

interface PageDetailResponse {
  page: PageResponse;
}

export default function PageEdit() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageResponse | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useMarkdownEditor();

  useEffect(() => {
    async function fetchPage() {
      if (!pageId) return;

      try {
        const response = await apiRequest<PageDetailResponse>(`/pages/${pageId}`);
        const fetchedPage = response.page;
        setPage(fetchedPage);
        setTitle(fetchedPage.title);
        setSlug(fetchedPage.slug);

        // Convert markdown to HTML for the editor
        if (editor && fetchedPage.content) {
          const html = await marked(fetchedPage.content);
          editor.commands.setContent(html);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch page');
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
  }, [pageId, editor]);

  const handleSave = async () => {
    if (!editor || !pageId) return;

    setSaving(true);
    setError(null);

    try {
      // Convert HTML from editor to markdown
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);

      const body: UpdatePageInput = {
        title,
        slug,
        content: markdown,
      };

      // Update page via API (goes through Netlify proxy)
      await apiRequest(`/pages/${pageId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      // Navigate back to page detail
      navigate(`/pages/${pageId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save page');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate(`/pages/${pageId}`)}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Cancel
        </button>
        <p className="text-gray-600">Loading page...</p>
      </div>
    );
  }

  if (error && !page) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate('/pages')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Pages
        </button>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate(`/pages/${pageId}`)}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
            Slug
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">/</span>
            <input
              type="text"
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="block text-sm font-medium text-gray-700 mb-2">Content</div>
          <MarkdownEditor editor={editor} />
        </div>
      </div>
    </div>
  );
}
