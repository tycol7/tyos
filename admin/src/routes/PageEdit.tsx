import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { PageResponse, UpdatePageInput } from '@tyos/db';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TurndownService from 'turndown';
import { apiRequest } from '../lib/api-client';

interface PageDetailResponse {
  page: PageResponse;
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

export default function PageEdit() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageResponse | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4 border border-gray-300 rounded-md',
      },
    },
  });

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

      // Update page via API
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const API_AUTH_TOKEN = import.meta.env.VITE_API_AUTH_TOKEN;

      const body: UpdatePageInput = {
        title,
        slug,
        content: markdown,
      };

      const response = await fetch(`${API_BASE_URL}/pages/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(API_AUTH_TOKEN ? { Authorization: `Bearer ${API_AUTH_TOKEN}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Save failed: ${errorText}`);
      }

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
          <div className="border border-gray-300 rounded-md overflow-hidden">
            {/* Editor toolbar */}
            {editor && (
              <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    editor.isActive('bold')
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    editor.isActive('italic')
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Italic
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    editor.isActive('heading', { level: 1 })
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    editor.isActive('heading', { level: 2 })
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    editor.isActive('heading', { level: 3 })
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    editor.isActive('bulletList')
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Bullet List
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    editor.isActive('orderedList')
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Numbered List
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    editor.isActive('codeBlock')
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Code Block
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt('Enter link URL:');
                    if (url) {
                      editor.chain().focus().setLink({ href: url }).run();
                    }
                  }}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    editor.isActive('link')
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt('Enter image URL:');
                    if (url) {
                      const alt = prompt('Enter alt text (optional):') || '';
                      editor.chain().focus().setImage({ src: url, alt }).run();
                    }
                  }}
                  className="px-3 py-1 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100"
                >
                  Image
                </button>
              </div>
            )}
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
