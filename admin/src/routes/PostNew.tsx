import type { PostResponse } from '@tyos/db';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostForm from '../components/PostForm';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { apiRequest } from '../lib/api-client';
import { turndownService } from '../lib/markdown';

interface CreatePostResponse {
  post: PostResponse;
}

export default function PostNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useMarkdownEditor();

  const handleSave = async () => {
    if (!editor) return;

    setSaving(true);
    setError(null);

    try {
      // Convert HTML from editor to markdown
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);

      const body = {
        title,
        slug,
        content: markdown,
        pubDate: isPublished ? Date.now() : null,
      };

      // Create post via API (goes through Netlify proxy)
      const data: CreatePostResponse = await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(body),
      });

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
