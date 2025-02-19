import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Anche se importiamo Chart.js, in questa versione il grafico non viene usato
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_URL = import.meta.env.VITE_API_URL;

// Tipi per le statistiche
interface StatTrack {
  trackName?: string;
  totalCount: number;
}
interface StatArtist {
  artistName?: string;
  totalCount: number;
}
interface DailyCount {
  day: string;
  count: number;
}

interface StatsData {
  topTracks: StatTrack[];
  topArtists: StatArtist[];
  dailyCounts: DailyCount[];
}

// Tipo per i post
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

  // Stato per i post e per le statistiche
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);

  // Stato per lo switcher: false = mostra Post, true = mostra Statistiche
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (user) {
      // Carica amici
      axios
        .get(`${API_URL}/api/friends/${user._id}`)
        .then((res) => setFriends(res.data))
        .catch((err) => console.error('Errore amici:', err));

      // Carica post
      axios
        .get(`${API_URL}/api/posts?user=${user._id}`)
        .then((res) => {
          setUserPosts(res.data);
          setPostCount(res.data.length);
        })
        .catch((err) => {
          console.error('Errore post:', err);
          setPostCount(0);
        });

      // Se l'utente ha un access token di Spotify, carica le statistiche
      if (user.spotifyAccessToken) {
        fetchStats(user._id);
      }
    }
  }, [user]);

  // Funzione per caricare le statistiche
  const fetchStats = async (userId: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/stats/listening?userId=${userId}`);
      setStats({
        topTracks: res.data.topTracks,
        topArtists: res.data.topArtists,
        dailyCounts: res.data.dailyCounts,
      });
    } catch (err) {
      console.error('Errore fetch stats:', err);
    }
  };

  if (!user) return <div>Caricamento...</div>;

  // Salvataggio modifiche profilo
  const handleSave = async () => {
    const success = await updateProfile({ fullName, bio, avatarUrl });
    if (success) setEditing(false);
  };
  const handleLogout = () => logout();

  // Gestione upload avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Per favore carica un file immagine.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) setAvatarUrl(reader.result.toString());
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="max-w-screen-lg mx-auto px-4">
        {/* CARD PROFILO */}
        <div className="bg-white shadow-md rounded-lg p-6 w-full relative mb-8">
          <div className="absolute top-4 right-4">
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
            >
              Logout
            </button>
          </div>
          <div className="flex flex-col items-center -mt-8">
            <img
              src={avatarUrl || 'https://placehold.co/150'}
              alt={user.username}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow"
            />
          </div>
          <div className="flex justify-around mt-4 mb-2">
            <div className="text-center">
              <p className="text-lg font-bold">{friends.length}</p>
              <p className="text-sm text-gray-500">Amici</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{postCount}</p>
              <p className="text-sm text-gray-500">Post</p>
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-800">{user.username}</h2>

          {editing ? (
            <div className="mt-4">
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 p-2 rounded text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">Cambia Avatar</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs" />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                >
                  Salva
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">{bio || 'Nessuna bio impostata'}</p>
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
              >
                Modifica Profilo
              </button>
            </div>
          )}
        </div>

        {/* SWITCHER: Post / Statistiche */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setShowStats(false)}
            className={`px-4 py-2 rounded ${!showStats ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            I tuoi Post
          </button>
          <button
            onClick={() => setShowStats(true)}
            className={`px-4 py-2 rounded ${showStats ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Statistiche di Ascolto
          </button>
        </div>

        {/* Contenuto: visualizza Post oppure Statistiche */}
        {showStats ? (
          user.spotifyAccessToken && stats ? (
            <div className="bg-white shadow-md rounded-lg p-6 w-full mb-8">
              <h3 className="text-2xl font-extrabold text-center text-gray-800 mb-6">
                Statistiche di Ascolto
              </h3>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Top 5 Canzoni */}
                <div className="md:w-1/2 bg-gray-50 rounded shadow p-4">
                  <h4 className="text-lg font-semibold mb-2 text-gray-700">Top 5 Canzoni</h4>
                  {stats.topTracks && stats.topTracks.length > 0 ? (
                    <ul className="space-y-2">
                      {stats.topTracks.map((t, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                          <span className="text-sm font-medium text-gray-700">
                            {t.trackName || 'Brano Sconosciuto'}
                          </span>
                          <span className="text-xs text-gray-500">{t.totalCount} ascolti</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">Nessuna canzone ascoltata.</p>
                  )}
                </div>
                {/* Top 5 Artisti */}
                <div className="md:w-1/2 bg-gray-50 rounded shadow p-4">
                  <h4 className="text-lg font-semibold mb-2 text-gray-700">Top 5 Artisti</h4>
                  {stats.topArtists && stats.topArtists.length > 0 ? (
                    <ul className="space-y-2">
                      {stats.topArtists.map((a, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                          <span className="text-sm font-medium text-gray-700">
                            {a.artistName || 'Artista Sconosciuto'}
                          </span>
                          <span className="text-xs text-gray-500">{a.totalCount} ascolti</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">Nessun artista ascoltato.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-8 text-center">
              Collega il tuo account Spotify per vedere le statistiche di ascolto.
            </p>
          )
        ) : (
          <>
            <h3 className="text-xl font-bold mb-4 text-center">I tuoi Post</h3>
            {userPosts.length === 0 ? (
              <p className="text-center">Nessun post pubblicato ancora.</p>
            ) : (
              // Sempre 3 colonne, i post si rimpiccioliscono in base allo schermo
              <div className="grid grid-cols-3 gap-4">
                {userPosts.map((post) => (
                  <InstaPost key={post._id} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Componente per singolo post in stile Instagram
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
        <p className="px-2 text-sm font-semibold">{post.songTitle || 'Brano Sconosciuto'}</p>
        <p className="px-2 text-xs mt-1">{post.artist || ''}</p>
        <p className="px-2 text-xs mt-2">{post.description || ''}</p>
        <div className="mt-2 text-xs flex gap-3">
          <span>{likesCount} Likes</span>
          <span>{commentsCount} Commenti</span>
        </div>
      </div>
    </div>
  );
}
