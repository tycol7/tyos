import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { PostResponse, UpdatePostInput } from '@tyos/db';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TurndownService from 'turndown';
import { apiRequest } from '../lib/api-client';

interface PostDetailResponse {
  post: PostResponse;
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

export default function PostEdit() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
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
    async function fetchPost() {
      if (!postId) return;

      try {
        const response = await apiRequest<PostDetailResponse>(`/posts/${postId}`);
        const fetchedPost = response.post;
        setPost(fetchedPost);
        setTitle(fetchedPost.title);
        setSlug(fetchedPost.slug);
        setIsPublished(!!fetchedPost.pubDate);

        // Convert markdown to HTML for the editor
        if (editor && fetchedPost.content) {
          const html = await marked(fetchedPost.content);
          editor.commands.setContent(html);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch post');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [postId, editor]);

  const handleSave = async () => {
    if (!editor || !postId) return;

    setSaving(true);
    setError(null);

    try {
      // Convert HTML from editor to markdown
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);

      // Update post via API
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const API_AUTH_TOKEN = import.meta.env.VITE_API_AUTH_TOKEN;

      const body: UpdatePostInput = {
        title,
        slug,
        content: markdown,
      };

      // Set pubDate based on published status
      if (isPublished && !post?.pubDate) {
        // Newly publishing - set pubDate to now
        body.pubDate = Date.now();
      } else if (!isPublished) {
        // Unpublishing - set pubDate to null
        body.pubDate = null;
      }
      // If already published and staying published, don't change pubDate

      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
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

      // Navigate back to post detail
      navigate(`/posts/${postId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
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
          onClick={() => navigate(`/posts/${postId}`)}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Cancel
        </button>
        <p className="text-gray-600">Loading post...</p>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate('/posts')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Posts
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
          onClick={() => navigate(`/posts/${postId}`)}
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Published
              {isPublished && !post?.pubDate && (
                <span className="text-gray-500 font-normal ml-2">(will publish on save)</span>
              )}
            </span>
          </label>
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
