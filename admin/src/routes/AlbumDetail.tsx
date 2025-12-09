import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api-client';

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

interface AlbumDetailResponse {
  album: Album;
  photos: Photo[];
}

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

function getPhotoUrl(albumId: string, filename: string, width = 800): string {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  return `${R2_PUBLIC_URL}/albums/${albumId}/${nameWithoutExt}_${width}w.webp`;
}

export default function AlbumDetail() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AlbumDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchAlbum() {
      if (!albumId) return;

      try {
        const response = await apiRequest<AlbumDetailResponse>(`/albums/${albumId}`);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch album');
      } finally {
        setLoading(false);
      }
    }

    fetchAlbum();
  }, [albumId]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this photo? This will remove it from the database but preserve the files in R2.'
      )
    ) {
      return;
    }

    setDeletingPhotoId(photoId);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const API_AUTH_TOKEN = import.meta.env.VITE_API_AUTH_TOKEN;

      const response = await fetch(`${API_BASE_URL}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(API_AUTH_TOKEN ? { Authorization: `Bearer ${API_AUTH_TOKEN}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${errorText}`);
      }

      // Refresh album data to remove deleted photo
      if (albumId) {
        const refreshedData = await apiRequest<AlbumDetailResponse>(`/albums/${albumId}`);
        setData(refreshedData);
      }
    } catch (err) {
      alert(`Failed to delete photo: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Delete error:', err);
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !albumId) return;

    setUploading(true);
    setUploadError(null);

    try {
      const file = files[0];

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isHero', 'false');

      // Upload to API (uses existing endpoint)
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const API_AUTH_TOKEN = import.meta.env.VITE_API_AUTH_TOKEN;

      const response = await fetch(`${API_BASE_URL}/photos/albums/${albumId}/photos`, {
        method: 'POST',
        headers: {
          ...(API_AUTH_TOKEN ? { Authorization: `Bearer ${API_AUTH_TOKEN}` } : {}),
        },
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      // Refresh album data to show new photo
      const refreshedData = await apiRequest<AlbumDetailResponse>(`/albums/${albumId}`);
      setData(refreshedData);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate('/photos')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Albums
        </button>
        <p className="text-gray-600">Loading album...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate('/photos')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Albums
        </button>
        <p className="text-red-600">Error: {error || 'Album not found'}</p>
      </div>
    );
  }

  const { album, photos } = data;

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/photos')}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        ← Back to Albums
      </button>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{album.name}</h1>
            {album.description && <p className="text-gray-600 text-lg">{album.description}</p>}
            <p className="text-sm text-gray-500 mt-2">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>
        {uploadError && <p className="text-red-600 text-sm mt-2">Error: {uploadError}</p>}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif"
        onChange={handleFileChange}
        className="hidden"
      />

      {photos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No photos in this album yet</p>
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload First Photo'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
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
                onClick={() => handleDeletePhoto(photo.id)}
                disabled={deletingPhotoId === photo.id}
                className="absolute bottom-2 right-2 bg-red-600 text-white px-3 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="Delete photo"
              >
                {deletingPhotoId === photo.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
