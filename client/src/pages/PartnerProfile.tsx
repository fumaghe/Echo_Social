import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import { useToast } from '../context/ToastContext';

// chart.js
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

// Definisci API_URL in cima, assicurandoti che l'ambiente Vite abbia la variabile
// es: VITE_API_URL=http://localhost:3000
const API_URL = import.meta.env.VITE_API_URL;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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

interface UserData {
  _id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  friends?: string[];
}

// Post type
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

export function PartnerProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Dati partner (ricevuti via state o query param)
  const stateUser = location.state?.user as UserData | undefined;
  const [profile, setProfile] = useState<UserData | null>(stateUser || null);

  // Conteggi e post
  const [friendsCount, setFriendsCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [partnerPosts, setPartnerPosts] = useState<PostType[]>([]);

  // Amicizia
  const [isFriend, setIsFriend] = useState(false);
  const [friendModalOpen, setFriendModalOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState<StatsData | null>(null);

  if (!user) return <div>Caricamento utente...</div>;

  // Se non abbiamo profile in state, cerchiamo da query (es. ?userId=xxx)
  useEffect(() => {
    if (!profile && location.search) {
      const params = new URLSearchParams(location.search);
      const userId = params.get('userId');
      if (userId) {
        axios
          .get(`${API_URL}/api/users/${userId}`)
          .then((res) => setProfile(res.data))
          .catch((err) => console.error(err));
      }
    }
  }, [location, profile]);

  useEffect(() => {
    if (profile && profile._id) {
      // amici
      axios
        .get(`${API_URL}/api/friends/${profile._id}`)
        .then((res) => setFriendsCount(res.data.length))
        .catch((err) => console.error('Errore amici partner:', err));

      // post
      axios
        .get(`${API_URL}/api/posts?user=${profile._id}`)
        .then((res) => {
          setPartnerPosts(res.data);
          setPostCount(res.data.length);
        })
        .catch((err) => {
          console.error('Errore post partner:', err);
          setPostCount(0);
        });

      // amicizia
      axios
        .get(`${API_URL}/api/friends/isFriend?userA=${user._id}&userB=${profile._id}`)
        .then((r) => setIsFriend(r.data.isFriend))
        .catch((err) => {
          console.error('Errore verifica amicizia:', err);
          setIsFriend(false);
        });

      // statistiche
      fetchStats(profile._id);
    }
  }, [profile, user]);

  const fetchStats = async (partnerId: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/stats/listening?userId=${partnerId}`);
      setStats(res.data);
    } catch (err) {
      console.error('Errore fetch stats partner:', err);
    }
  };

  // Gestione amicizia
  const openFriendModal = () => setFriendModalOpen(true);
  const closeFriendModal = () => setFriendModalOpen(false);

  const handleAddFriend = async () => {
    try {
      await axios.post(`${API_URL}/api/friends/request`, {
        fromUserId: user._id,
        toUserId: profile?._id,
      });
      showToast('Richiesta di amicizia inviata!', 'success');
      setIsFriend(true);
      setFriendModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Errore nell'invio della richiesta", 'error');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await axios.post(`${API_URL}/api/friends/remove`, {
        userA: user._id,
        userB: profile?._id,
      });
      showToast('Amicizia rimossa!', 'success');
      setIsFriend(false);
      setFriendModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Errore nella rimozione dell'amicizia", 'error');
    }
  };

  const handleBackToChat = () => navigate(-1);
  const handleSendMessage = () => navigate('/chat', { state: { partnerId: profile?._id } });

  // Se profile mancante
  if (!profile) {
    return (
      <div className="pt-16 h-screen flex items-center justify-center bg-gray-50">
        Caricamento profilo...
      </div>
    );
  }

  // Prepara dati grafico
  const dailyCounts = stats?.dailyCounts ?? [];
  const dailyData = {
    labels: dailyCounts.map((dc) => dc.day),
    datasets: [
      {
        label: 'Ascolti Giornalieri',
        data: dailyCounts.map((dc) => dc.count),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="pt-16 pb-16 w-full bg-gray-50 min-h-screen">
      <div className="max-w-screen-lg mx-auto px-4">
        {/* CARD info utente partner */}
        <div className="bg-white shadow-lg rounded-lg p-6 w-full relative mb-8">
          <div className="absolute top-4 left-4">
            <button
              onClick={handleBackToChat}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-sm"
            >
              Torna alla Chat
            </button>
          </div>

          <div className="flex flex-col items-center -mt-8">
            <img
              src={profile.avatarUrl || 'https://placehold.co/150'}
              alt={profile.username}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow"
            />
          </div>

          <div className="flex justify-around mt-4 mb-2">
            <div className="text-center">
              <p className="text-lg font-bold">{friendsCount}</p>
              <p className="text-sm text-gray-500">Amici</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{postCount}</p>
              <p className="text-sm text-gray-500">Post</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-center text-gray-800">{profile.username}</h2>
          <p className="text-center text-gray-600 mb-4">{profile.fullName}</p>

          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600">{profile.bio || 'Nessuna bio disponibile.'}</p>
          </div>

          <div className="flex justify-around">
            <button
              onClick={handleSendMessage}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm flex items-center gap-1"
            >
              <MessageSquare className="w-5 h-5" /> Messaggio
            </button>
            <button
              onClick={openFriendModal}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm flex items-center gap-1"
            >
              {isFriend ? (
                <>
                  <UserCheck className="w-5 h-5" /> Già Amici
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> Aggiungi Amico
                </>
              )}
            </button>
          </div>
        </div>

        {/* SEZIONE STATISTICHE PARTNER */}
        <div className="bg-white shadow-md rounded-lg p-6 w-full mb-8">
          <h3 className="text-lg font-bold mb-4">Statistiche di Ascolto</h3>

          {dailyCounts.length > 0 ? (
            <div className="mb-6">
              <Line data={dailyData} />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nessun dato giornaliero disponibile.</p>
          )}

          <div className="mb-6">
            <h4 className="font-semibold mb-2">Top 5 Canzoni</h4>
            {stats?.topTracks && stats.topTracks.length > 0 ? (
              <ul className="list-disc list-inside text-sm">
                {stats.topTracks.map((t, idx) => (
                  <li key={idx}>
                    {t.trackName || 'Brano Sconosciuto'} - Ascolti: {t.totalCount}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Nessuna canzone ascoltata.</p>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-2">Top 5 Artisti</h4>
            {stats?.topArtists && stats.topArtists.length > 0 ? (
              <ul className="list-disc list-inside text-sm">
                {stats.topArtists.map((a, idx) => (
                  <li key={idx}>
                    {a.artistName || 'Artista Sconosciuto'} - Ascolti: {a.totalCount}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Nessun artista ascoltato.</p>
            )}
          </div>
        </div>

        {/* POST */}
        <h3 className="text-xl font-bold mb-4 text-center">
          Post di {profile.username}
        </h3>
        {partnerPosts.length === 0 ? (
          <p className="text-center">Nessun post pubblicato ancora.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {partnerPosts.map((post) => (
              <InstaPost key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Modale Amicizia */}
      {friendModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Gestisci Amicizia</h3>
            {isFriend ? (
              <p className="mb-4">Siete già amici. Vuoi rimuovere l'amicizia?</p>
            ) : (
              <p className="mb-4">Non siete amici. Vuoi inviare una richiesta di amicizia?</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setFriendModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-sm"
              >
                Annulla
              </button>
              {isFriend ? (
                <button
                  onClick={handleRemoveFriend}
                  className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white text-sm"
                >
                  Rimuovi Amicizia
                </button>
              ) : (
                <button
                  onClick={handleAddFriend}
                  className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm"
                >
                  Invia Richiesta
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
        <p className="px-2 text-sm font-semibold">{post.songTitle || 'Senza Titolo'}</p>
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
