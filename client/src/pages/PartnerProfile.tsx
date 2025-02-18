// client/src/pages/PartnerProfile.tsx
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

const API_URL = import.meta.env.VITE_API_URL;

export function PartnerProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  if (!user) return <div>Caricamento utente...</div>;

  const stateUser = location.state?.user as UserData | undefined;
  const [profile, setProfile] = useState<UserData | null>(stateUser || null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [loadingFriendship, setLoadingFriendship] = useState(false);
  const [errorFriendship, setErrorFriendship] = useState<string | null>(null);
  const [friendModalOpen, setFriendModalOpen] = useState(false);

  useEffect(() => {
    if (!profile && location.search) {
      const params = new URLSearchParams(location.search);
      const userId = params.get('userId');
      if (userId) {
        axios
          .get(`${API_URL}/api/users/${userId}`)
          .then(res => setProfile(res.data))
          .catch(err => console.error(err));
      }
    }
  }, [location, profile]);

  useEffect(() => {
    if (profile && profile._id) {
      axios
        .get(`${API_URL}/api/friends/${profile._id}`)
        .then(res => setFriendsCount(res.data.length))
        .catch(err => console.error('Errore amici partner:', err));

      axios
        .get(`${API_URL}/api/posts?user=${profile._id}`)
        .then(res => setPostCount(res.data.length))
        .catch(err => {
          console.error('Errore post partner:', err);
          setPostCount(0);
        });

      setLoadingFriendship(true);
      axios
        .get(`${API_URL}/api/friends/isFriend?userA=${user._id}&userB=${profile._id}`)
        .then(r => {
          setIsFriend(r.data.isFriend);
          setLoadingFriendship(false);
        })
        .catch(err => {
          console.error('Errore verifica amicizia:', err);
          setLoadingFriendship(false);
          setIsFriend(false);
        });
    }
  }, [profile, user]);

  if (!profile)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        Caricamento profilo...
      </div>
    );

  const handleAddFriend = async () => {
    try {
      await axios.post(`${API_URL}/api/friends/request`, {
        fromUserId: user._id,
        toUserId: profile._id
      });
      showToast('Richiesta di amicizia inviata!', 'success');
      setIsFriend(true);
      setFriendModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Errore nell\'invio della richiesta', 'error');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await axios.post(`${API_URL}/api/friends/remove`, {
        userA: user._id,
        userB: profile._id
      });
      showToast('Amicizia rimossa!', 'success');
      setIsFriend(false);
      setFriendModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Errore nella rimozione dell\'amicizia', 'error');
    }
  };

  const openFriendModal = () => setFriendModalOpen(true);
  const closeFriendModal = () => setFriendModalOpen(false);
  const handleBackToChat = () => navigate(-1);
  const handleSendMessage = () => navigate('/chat', { state: { partnerId: profile._id } });

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6 w-full bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md relative">
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
                <UserCheck className="w-5 h-5" /> Gia Amici
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" /> Aggiungi Amico
              </>
            )}
          </button>
        </div>
      </div>

      {friendModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Gestisci Amicizia</h3>
            {isFriend ? (
              <p className="mb-4">Sei già amico. Vuoi rimuovere l'amicizia?</p>
            ) : (
              <p className="mb-4">Non sei ancora amico. Vuoi inviare una richiesta di amicizia?</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={closeFriendModal}
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
