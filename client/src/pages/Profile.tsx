// client/src/pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      // Carica lista amici
      axios.get(`http://localhost:5000/api/friends/${user._id}`)
        .then(res => setFriends(res.data))
        .catch(err => console.error(err));
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:ml-16">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Profilo</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Logout
        </button>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <div className="flex items-center">
          <img
            src={avatarUrl || 'https://via.placeholder.com/80'}
            alt={user.username}
            className="w-20 h-20 rounded-full"
          />
          <div className="ml-4">
            <h2 className="text-xl font-bold">{user.username}</h2>
            <p className="text-gray-600">{fullName}</p>
            <p className="text-sm text-gray-500">Amici: {friends.length}</p>
          </div>
        </div>
        {editing ? (
          <div className="mt-4">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Nome Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Avatar URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
            <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Salva
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <p className="mb-2"><strong>Nome Completo:</strong> {fullName}</p>
            <p className="mb-2"><strong>Bio:</strong> {bio || 'Nessuna bio impostata'}</p>
            <button onClick={() => setEditing(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Modifica
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
