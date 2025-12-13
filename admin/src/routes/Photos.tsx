import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api-client';

interface Album {
  id: string;
  name: string;
  description: string | null;
  photoCount: number;
  heroPhoto: { id: string; filename: string } | null;
  createdAt: number;
  updatedAt: number;
}

interface AlbumsResponse {
  albums: Album[];
}

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

function getPhotoUrl(albumId: string, filename: string): string {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  return `${R2_PUBLIC_URL}/albums/${albumId}/${nameWithoutExt}_800w.webp`;
}

export default function Photos() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const data = await apiRequest<AlbumsResponse>('/albums');
        setAlbums(data.albums);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch albums');
      } finally {
        setLoading(false);
      }
    }

    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Albums</h1>
        <p className="text-gray-600">Loading albums...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Albums</h1>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Albums</h1>

      {albums.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No albums yet</p>
          <p className="text-sm text-gray-500">Create your first album to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Link
              key={album.id}
              to={`/photos/${album.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow block"
            >
              <div className="aspect-video bg-gray-200 overflow-hidden">
                {album.heroPhoto ? (
                  <img
                    src={getPhotoUrl(album.id, album.heroPhoto.filename)}
                    alt={album.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-16 h-16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>No album cover</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">{album.name}</h3>
                {album.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{album.description}</p>
                )}
                <p className="text-sm text-gray-500">
                  {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
