import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Photo {
  id: string;
  filename: string;
  isHero: boolean;
  sortOrder: number;
  createdAt: number;
}

interface Album {
  id: string;
  name: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
}

interface SortablePhotoCardProps {
  photo: Photo;
  album: Album;
  onDelete: (photoId: string) => void;
  deletingPhotoId: string | null;
  disabled?: boolean;
}

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

function getPhotoUrl(albumId: string, filename: string, width = 800): string {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  return `${R2_PUBLIC_URL}/albums/${albumId}/${nameWithoutExt}_${width}w.webp`;
}

export function SortablePhotoCard({
  photo,
  album,
  onDelete,
  deletingPhotoId,
  disabled = false,
}: SortablePhotoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'default' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative group"
    >
      <div className="aspect-square bg-gray-200 overflow-hidden">
        <img
          src={getPhotoUrl(album.id, photo.filename)}
          alt={`${album.name} - ${photo.sortOrder + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
      {photo.isHero && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
          Hero
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />

      {/* Delete button - shows on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(photo.id);
        }}
        disabled={deletingPhotoId === photo.id}
        className="absolute bottom-2 right-2 bg-red-600 text-white px-3 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        title="Delete photo"
      >
        {deletingPhotoId === photo.id ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
