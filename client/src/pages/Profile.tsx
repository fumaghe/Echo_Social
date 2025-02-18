import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [friends, setFriends] = useState<any[]>([]);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    if (user) {
      axios
        .get(`${API_URL}/api/friends/${user._id}`)
        .then(res => setFriends(res.data))
        .catch(err => {
          console.error('Impossibile caricare amici:', err);
        });

      axios
        .get(`${API_URL}/api/posts?user=${user._id}`)
        .then(res => setPostCount(res.data.length))
        .catch(err => {
          console.error('Impossibile caricare post:', err);
          setPostCount(0);
        });
    }
  }, [user]);

  if (!user) return <div>Caricamento...</div>;

  const handleSave = async () => {
    const success = await updateProfile({ fullName, bio, avatarUrl });
    if (success) setEditing(false);
  };

  const handleLogout = () => {
    logout();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="flex flex-col items-center justify-center px-4 py-6 w-full bg-gray-50 min-h-screen">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md relative">
        <div className="absolute top-4 right-4">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
          >
            Logout
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={avatarUrl || 'https://placehold.co/150'}
              alt={user.username}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow -mt-8"
            />
          </div>
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
              <label className="block text-gray-700 text-sm mb-1">Nome Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm mb-1">Cambia Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
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
    </div>
  );
}
