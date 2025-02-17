import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export function Search() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/search?q=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div>Caricamento...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:ml-16">
      <h1 className="text-2xl font-bold mb-4">Ricerca</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Cerca utenti..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded">
          Cerca
        </button>
      </div>

      <div>
        {results.map(u => (
          <div key={u._id} className="flex items-center p-2 border-b">
            <img
              src={u.avatarUrl || 'https://via.placeholder.com/40'}
              alt={u.username}
              className="w-10 h-10 rounded-full"
            />
            <div className="ml-3">
              <p className="font-bold">{u.username}</p>
              <p className="text-sm text-gray-600">{u.fullName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
