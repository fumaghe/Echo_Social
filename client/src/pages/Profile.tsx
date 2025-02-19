import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface PostType {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatarUrl?: string;
  };
  description: string;
  imageUrl: string;
  songTitle: string;
  artist: string;
  coverUrl: string;
  trackUrl: string;
  likesCount?: number;
  commentsCount?: number;
  createdAt: string;
}

export function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [friends, setFriends] = useState<any[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);

  useEffect(() => {
    if (user) {
      axios
        .get(`${API_URL}/api/friends/${user._id}`)
        .then((res) => setFriends(res.data))
        .catch((err) => console.error('Errore caricamento amici:', err));

      axios
        .get(`${API_URL}/api/posts?user=${user._id}`)
        .then((res) => {
          setUserPosts(res.data);
          setPostCount(res.data.length);
        })
        .catch((err) => {
          console.error('Errore caricamento post:', err);
          setPostCount(0);
        });
    }
  }, [user]);

  if (!user) return <div>Caricamento...</div>;

  // Salvataggio modifiche al profilo
  const handleSave = async () => {
    const success = await updateProfile({ fullName, bio, avatarUrl });
    if (success) setEditing(false);
  };

  const handleLogout = () => logout();

  // Gestione cambio avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Per favore carica un file immagine.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setAvatarUrl(reader.result.toString());
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    // Gestione spazio per navbar: pt-16 (in alto), pb-16 (in basso)
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="max-w-screen-lg mx-auto px-4">
        
        {/* CARD PROFILO */}
        <div className="bg-white shadow-md rounded-lg p-6 w-full relative mb-8">
          <div className="absolute top-4 right-4">
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs sm:text-sm"
            >
              Logout
            </button>
          </div>

          <div className="flex flex-col items-center -mt-8">
            <img
              src={avatarUrl || 'https://placehold.co/150'}
              alt={user.username}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow"
            />
          </div>

          <div className="flex justify-around mt-4 mb-2 text-xs sm:text-sm md:text-base">
            <div className="text-center">
              <p className="font-bold">{friends.length}</p>
              <p className="text-gray-500 break-words">Amici</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{postCount}</p>
              <p className="text-gray-500 break-words">Post</p>
            </div>
          </div>

          <h2 className="text-center text-gray-800 text-sm sm:text-base md:text-lg font-bold break-words">
            {user.username}
          </h2>

          {/* Se stiamo editando, mostra i campi, altrimenti i dati */}
          {editing ? (
            <div className="mt-4">
              <div className="mb-4">
                <label className="block text-xs sm:text-sm text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded text-xs sm:text-sm md:text-base"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs sm:text-sm text-gray-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 p-2 rounded text-xs sm:text-sm md:text-base"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs sm:text-sm text-gray-700 mb-1">Cambia Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-green-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded hover:bg-green-600 text-xs sm:text-sm"
                >
                  Salva
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words">
                {bio || 'Nessuna bio impostata'}
              </p>
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded hover:bg-blue-600 text-xs sm:text-sm"
              >
                Modifica Profilo
              </button>
            </div>
          )}
        </div>

        {/* SEZIONE POST: 3 in riga fissa */}
        <h3 className="text-center text-sm sm:text-base md:text-lg font-bold mb-4">
          I tuoi Post
        </h3>
        {userPosts.length === 0 ? (
          <p className="text-center text-xs sm:text-sm md:text-base">
            Nessun post pubblicato ancora.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {userPosts.map((post) => (
              <InstaPost key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Singolo Post in stile Instagram, con testo responsivo
 */
function InstaPost({ post }: { post: PostType }) {
  const backgroundImage = post.coverUrl
    ? post.coverUrl
    : post.imageUrl
    ? post.imageUrl
    : 'https://placehold.co/300?text=Nessuna+immagine';

  const likesCount = post.likesCount ?? 0;
  const commentsCount = post.commentsCount ?? 0;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded bg-gray-200 group">
      <img
        src={backgroundImage}
        alt={post.songTitle || 'Post'}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      <div
        className="
          absolute inset-0 flex flex-col justify-center items-center
          bg-black bg-opacity-0 text-white
          opacity-0
          group-hover:bg-opacity-50
          group-hover:opacity-100
          transition-all
          duration-300
        "
      >
        <p className="px-2 text-xs sm:text-sm md:text-base font-semibold break-words">
          {post.songTitle || 'Senza Titolo'}
        </p>
        <p className="px-2 text-[10px] sm:text-xs md:text-sm mt-1 break-words">
          {post.artist || ''}
        </p>
        <p className="px-2 text-[10px] sm:text-xs md:text-sm mt-2 break-words">
          {post.description || ''}
        </p>
        <div className="mt-2 flex gap-2 text-[10px] sm:text-xs md:text-sm">
          <span>{likesCount} Likes</span>
          <span>{commentsCount} Commenti</span>
        </div>
      </div>
    </div>
  );
}
