import { type Editor, EditorContent } from '@tiptap/react';

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
  );
}
