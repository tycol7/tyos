import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { PostResponse } from '@tyos/db';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TurndownService from 'turndown';
import PostForm from '../components/PostForm';

interface CreatePostResponse {
  post: PostResponse;
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

export default function PostNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
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

  const handleSave = async () => {
    if (!editor) return;

    setSaving(true);
    setError(null);

    try {
      // Convert HTML from editor to markdown
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);

      // Create post via API
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const API_AUTH_TOKEN = import.meta.env.VITE_API_AUTH_TOKEN;

      const body = {
        title,
        slug,
        content: markdown,
        pubDate: isPublished ? Date.now() : null,
      };

      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
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

      const data: CreatePostResponse = await response.json();

      // Navigate to the newly created post
      navigate(`/posts/${data.post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/posts')}
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
          {saving ? 'Creating...' : 'Create Post'}
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      <PostForm
        title={title}
        slug={slug}
        isPublished={isPublished}
        editor={editor}
        onTitleChange={setTitle}
        onSlugChange={setSlug}
        onPublishedChange={setIsPublished}
        showPublishedHint={true}
      />
    </div>
  );
}
