import type { PostResponse } from '@tyos/db';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MarkdownContent from '../components/MarkdownContent';
import { apiRequest } from '../lib/api-client';
import { formatDate } from '../lib/date';

interface PostDetailResponse {
  post: PostResponse;
}

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      if (!postId) return;

      try {
        const response = await apiRequest<PostDetailResponse>(`/posts/${postId}`);
        setPost(response.post);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch post');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate('/posts')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Posts
        </button>
        <p className="text-gray-600">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate('/posts')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Posts
        </button>
        <p className="text-red-600">Error: {error || 'Post not found'}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/posts')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Posts
        </button>
        <button
          type="button"
          onClick={() => navigate(`/posts/${postId}/edit`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Edit Post
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header section */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold">{post.title}</h1>
            {post.pubDate ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Published
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                Draft
              </span>
            )}
          </div>
          <div className="flex gap-6 text-sm text-gray-600">
            <div>
              <span className="font-medium">Slug:</span> /{post.slug}
            </div>
            {post.pubDate && (
              <div>
                <span className="font-medium">Published:</span> {formatDate(post.pubDate)}
              </div>
            )}
            <div>
              <span className="font-medium">Created:</span> {formatDate(post.createdAt)}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {formatDate(post.updatedAt)}
            </div>
          </div>
        </div>

        {/* Content section */}
        <MarkdownContent content={post.content} />
      </div>
    </div>
  );
}
