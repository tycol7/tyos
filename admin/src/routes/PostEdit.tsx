import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { PostResponse, UpdatePostInput } from '@tyos/db';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TurndownService from 'turndown';
import PostForm from '../components/PostForm';
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

      // Update post via API (goes through Netlify proxy)
      await apiRequest(`/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

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

      <PostForm
        title={title}
        slug={slug}
        isPublished={isPublished}
        editor={editor}
        onTitleChange={setTitle}
        onSlugChange={setSlug}
        onPublishedChange={setIsPublished}
        showPublishedHint={!post?.pubDate}
      />
    </div>
  );
}
