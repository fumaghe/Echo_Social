// client/src/pages/Search.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Search() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/search?q=${query}`);
      // Escludi se vuoi l’utente corrente
      const filtered = res.data.filter((u: any) => u._id !== user?._id);
      setResults(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFriend = async (toUserId: string) => {
    if (!user) return;
    try {
      await axios.post('http://localhost:5000/api/friends/request', {
        fromUserId: user._id,
        toUserId
      });
      alert('Richiesta di amicizia inviata!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Errore');
    }
  };

  const handleMessage = (partnerId: string) => {
    // Esempio: reindirizza alla pagina Chat, potresti gestire l’ID con param o state
    navigate('/chat', { state: { partnerId } });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:ml-16">
      <h1 className="text-2xl font-bold mb-4">Ricerca</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Cerca utenti..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded">
          Cerca
        </button>
      </div>
      <div>
        {results.map(u => (
          <div key={u._id} className="flex items-center p-2 border-b">
            <div className="flex-1">
              <p className="font-bold">{u.username}</p>
              <p className="text-sm text-gray-600">{u.fullName}</p>
            </div>
            <button
              onClick={() => handleMessage(u._id)}
              className="bg-green-500 text-white px-3 py-1 rounded mr-2"
            >
              Message
            </button>
            <button
              onClick={() => handleAddFriend(u._id)}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Add Friend
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
