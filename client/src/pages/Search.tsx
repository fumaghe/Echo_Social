import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, UserPlus, UserCheck } from 'lucide-react';

export function Search() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/search?q=${query}`);
      // Escludi l’utente corrente
      const filtered = res.data.filter((u: any) => u._id !== user?._id);
      setResults(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMessage = (partnerId: string) => {
    // Naviga alla pagina Chat, passando l'id del partner nel state
    navigate('/chat', { state: { partnerId } });
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:ml-16">
      <h1 className="text-2xl font-bold mb-4">Ricerca Utenti</h1>
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
        {results.map(u => {
          // Se l'oggetto user include già l'array friends, verifica se l'utente è già amico
          const isAlreadyFriend = user?.friends && Array.isArray(user.friends)
            ? user.friends.includes(u._id)
            : false;
          return (
            <div key={u._id} className="flex items-center p-2 border-b">
              <div className="flex-1">
                <p className="font-bold">{u.username}</p>
                <p className="text-sm text-gray-600">{u.fullName}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMessage(u._id)}
                  className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                  title="Invia Messaggio"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                {isAlreadyFriend ? (
                  <button
                    className="bg-gray-400 text-white p-2 rounded cursor-default"
                    title="Gia Amici"
                  >
                    <UserCheck className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddFriend(u._id)}
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    title="Aggiungi Amico"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
