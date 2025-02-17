import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  if (!user) return <div>Caricamento...</div>;

  const handleSave = async () => {
    const success = await updateProfile({ fullName, bio, avatarUrl });
    if (success) setEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:ml-16">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Il tuo Profilo</h1>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
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
          </div>
        </div>

        {editing ? (
          <div className="mt-4">
            <div className="mb-4">
              <label htmlFor="fullName" className="block text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="bio" className="block text-gray-700 mb-2">
                Bio Musicale
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="avatarUrl" className="block text-gray-700 mb-2">
                URL Avatar
              </label>
              <input
                type="text"
                id="avatarUrl"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Salva
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <p className="mb-2">
              <strong>Nome Completo:</strong> {fullName}
            </p>
            <p className="mb-2">
              <strong>Bio Musicale:</strong> {bio || 'Nessuna bio impostata'}
            </p>
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Modifica Profilo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
