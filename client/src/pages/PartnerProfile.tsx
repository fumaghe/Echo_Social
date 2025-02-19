import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface UserData {
  _id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  friends?: string[];
}

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

const API_URL = import.meta.env.VITE_API_URL;

export function PartnerProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Dati partner
  const stateUser = location.state?.user as UserData | undefined;
  const [profile, setProfile] = useState<UserData | null>(stateUser || null);

  // Conteggi e post
  const [friendsCount, setFriendsCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [partnerPosts, setPartnerPosts] = useState<PostType[]>([]);

  // Stato amicizia
  const [isFriend, setIsFriend] = useState(false);
  const [friendModalOpen, setFriendModalOpen] = useState(false);

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

  // Caricamento amici, post, stato amicizia
  useEffect(() => {
    if (profile && profile._id) {
      axios
        .get(`${API_URL}/api/friends/${profile._id}`)
        .then((res) => setFriendsCount(res.data.length))
        .catch((err) => console.error('Errore amici partner:', err));

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

      axios
        .get(`${API_URL}/api/friends/isFriend?userA=${user._id}&userB=${profile._id}`)
        .then((r) => setIsFriend(r.data.isFriend))
        .catch((err) => {
          console.error('Errore verifica amicizia:', err);
          setIsFriend(false);
        });
    }
  }, [profile, user]);

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

  if (!profile) {
    return (
      <div className="pt-16 h-screen flex items-center justify-center bg-gray-50">
        Caricamento profilo...
      </div>
    );
  }

  return (
    <div className="pt-16 pb-16 w-full bg-gray-50 min-h-screen">
      <div className="max-w-screen-lg mx-auto px-4">
        {/* CARD info utente partner */}
        <div className="bg-white shadow-lg rounded-lg p-6 w-full relative mb-8">
          <div className="absolute top-4 left-4">
            <button
              onClick={handleBackToChat}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-xs sm:text-sm"
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

          <div className="flex justify-around mt-4 mb-2 text-xs sm:text-sm md:text-base">
            <div className="text-center">
              <p className="font-bold">{friendsCount}</p>
              <p className="text-gray-500 break-words">Amici</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{postCount}</p>
              <p className="text-gray-500 break-words">Post</p>
            </div>
          </div>

          <h2 className="text-center text-gray-800 mb-1 text-sm sm:text-base md:text-lg font-bold break-words">
            {profile.username}
          </h2>
          <p className="text-center text-gray-600 text-xs sm:text-sm md:text-base mb-4 break-words">
            {profile.fullName}
          </p>

          <div className="mb-4 text-center">
            <p className="text-xs sm:text-sm md:text-base text-gray-600 break-words">
              {profile.bio || 'Nessuna bio disponibile.'}
            </p>
          </div>

          <div className="flex justify-around">
            <button
              onClick={handleSendMessage}
              className="bg-green-500 text-white px-4 py-1 sm:py-2 rounded hover:bg-green-600 text-xs sm:text-sm md:text-base flex items-center gap-1"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" /> Messaggio
            </button>
            <button
              onClick={openFriendModal}
              className="bg-blue-500 text-white px-4 py-1 sm:py-2 rounded hover:bg-blue-600 text-xs sm:text-sm md:text-base flex items-center gap-1"
            >
              {isFriend ? (
                <>
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" /> Già Amici
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" /> Aggiungi Amico
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sezione post: 3 colonne fisse */}
        <h3 className="text-center text-sm sm:text-base md:text-lg font-bold mb-4">
          Post di {profile.username}
        </h3>
        {partnerPosts.length === 0 ? (
          <p className="text-center text-xs sm:text-sm md:text-base">
            Nessun post pubblicato ancora.
          </p>
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
          <div className="bg-white rounded-lg p-4 w-full max-w-sm text-xs sm:text-sm md:text-base">
            <h3 className="text-lg font-bold mb-4">Gestisci Amicizia</h3>
            {isFriend ? (
              <p className="mb-4 break-words">
                Siete già amici. Vuoi rimuovere l'amicizia?
              </p>
            ) : (
              <p className="mb-4 break-words">
                Non siete amici. Vuoi inviare una richiesta di amicizia?
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={closeFriendModal}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Annulla
              </button>
              {isFriend ? (
                <button
                  onClick={handleRemoveFriend}
                  className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
                >
                  Rimuovi
                </button>
              ) : (
                <button
                  onClick={handleAddFriend}
                  className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Invia
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Singolo post con testo adattivo
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
        {/* Titolo canzone */}
        <p className="px-2 text-xs sm:text-sm md:text-base font-semibold break-words">
          {post.songTitle || 'Senza Titolo'}
        </p>
        {/* Artista */}
        <p className="px-2 text-[10px] sm:text-xs md:text-sm mt-1 break-words">
          {post.artist || ''}
        </p>
        {/* Descrizione */}
        <p className="px-2 text-[10px] sm:text-xs md:text-sm mt-2 break-words">
          {post.description || ''}
        </p>
        {/* Likes e commenti */}
        <div className="mt-2 flex gap-2 text-[10px] sm:text-xs md:text-sm">
          <span>{likesCount} Likes</span>
          <span>{commentsCount} Commenti</span>
        </div>
      </div>
    </div>
  );
}
