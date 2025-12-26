import type { Editor } from '@tiptap/react';
import MarkdownEditor from './MarkdownEditor';

interface PostFormProps {
  title: string;
  slug: string;
  isPublished: boolean;
  editor: Editor | null;
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
  onPublishedChange: (isPublished: boolean) => void;
  showPublishedHint?: boolean;
}

export default function PostForm({
  title,
  slug,
  isPublished,
  editor,
  onTitleChange,
  onSlugChange,
  onPublishedChange,
  showPublishedHint = false,
}: PostFormProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
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
            onChange={(e) => onSlugChange(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => onPublishedChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Published
            {showPublishedHint && isPublished && (
              <span className="text-gray-500 font-normal ml-2">(will publish on save)</span>
            )}
          </span>
        </label>
      </div>

      <div className="mb-6">
        <div className="block text-sm font-medium text-gray-700 mb-2">Content</div>
        <MarkdownEditor editor={editor} />
      </div>
    </div>
  );
}
