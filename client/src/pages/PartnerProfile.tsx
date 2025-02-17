import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface UserData {
  _id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  friends?: any[];
}

export function PartnerProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return <div>Caricamento utente...</div>;

  const stateUser = location.state?.user as UserData | undefined;
  const [profile, setProfile] = useState<UserData | null>(stateUser || null);

  const [friendsCount, setFriendsCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [isFriend, setIsFriend] = useState<boolean>(true); // Se errore, assume Gia Amici
  const [loadingFriendship, setLoadingFriendship] = useState(false);
  const [errorFriendship, setErrorFriendship] = useState<string | null>(null);

  // Se il profilo non è passato via state, lo carichiamo dalla query string
  useEffect(() => {
    if (!profile && location.search) {
      const params = new URLSearchParams(location.search);
      const userId = params.get('userId');
      if (userId) {
        axios.get(`http://localhost:5000/api/users/${userId}`)
          .then(res => setProfile(res.data))
          .catch(err => console.error(err));
      }
    }
  }, [location, profile]);

  // Carica statistiche: amici e post
  useEffect(() => {
    if (profile && profile._id) {
      // Amici
      axios.get(`http://localhost:5000/api/friends/${profile._id}`)
        .then(res => setFriendsCount(res.data.length))
        .catch(err => console.error('Errore amici partner:', err));

      // Post
      axios.get(`http://localhost:5000/api/posts?user=${profile._id}`)
        .then(res => setPostCount(res.data.length))
        .catch(err => {
          console.error('Errore post partner:', err);
          setPostCount(0);
        });

      // Verifica amicizia usando l'id reale dell'utente autenticato
      setLoadingFriendship(true);
      axios.get(`http://localhost:5000/api/friends/isFriend?userA=${user._id}&userB=${profile._id}`)
        .then(r => {
          setIsFriend(r.data.isFriend);
          setLoadingFriendship(false);
        })
        .catch(err => {
          console.error('Errore verifica amicizia:', err);
          setLoadingFriendship(false);
          setIsFriend(true);
        });
    }
  }, [profile, user]);

  if (!profile) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      Caricamento profilo...
    </div>
  );

  const handleAddFriend = async () => {
    try {
      await axios.post('http://localhost:5000/api/friends/request', {
        fromUserId: user._id,
        toUserId: profile._id
      });
      alert('Richiesta di amicizia inviata!');
      setIsFriend(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await axios.post('http://localhost:5000/api/friends/remove', {
        userA: user._id,
        userB: profile._id
      });
      alert('Amicizia rimossa!');
      setIsFriend(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackToChat = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6 w-full bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md relative">
        {/* Pulsante per tornare alla Chat */}
        <div className="absolute top-4 left-4">
          <button
            onClick={handleBackToChat}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-sm"
          >
            Torna alla Chat
          </button>
        </div>
        {/* Avatar */}
        <div className="flex flex-col items-center -mt-8">
          <img
            src={profile.avatarUrl || 'https://placehold.co/150'}
            alt={profile.username}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow"
          />
        </div>
        {/* Statistiche */}
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
        {/* Username e nome completo */}
        <h2 className="text-xl font-bold text-center text-gray-800">{profile.username}</h2>
        <p className="text-center text-gray-600 mb-4">{profile.fullName}</p>
        {/* Bio */}
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600">{profile.bio || 'Nessuna bio disponibile.'}</p>
        </div>
        {/* Pulsante Aggiungi/Rimuovi Amico */}
        {errorFriendship ? (
          <p className="text-center text-sm text-gray-500">{errorFriendship}</p>
        ) : (
          <div className="flex justify-center">
            {loadingFriendship ? (
              <p className="text-sm text-gray-500">Caricamento...</p>
            ) : isFriend ? (
              <button
                onClick={handleRemoveFriend}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
              >
                Gia Amici
              </button>
            ) : (
              <button
                onClick={handleAddFriend}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
              >
                Aggiungi Amico
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
