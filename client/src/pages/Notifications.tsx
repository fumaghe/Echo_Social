// client/src/pages/Notifications.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export function Notifications() {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    axios.get(`http://localhost:5000/api/friends/requests/${user._id}`)
      .then(res => setFriendRequests(res.data))
      .catch(err => console.error(err));
  }, [user]);

  const handleAccept = async (fromUserId: string) => {
    if (!user) return;
    try {
      await axios.post('http://localhost:5000/api/friends/accept', {
        userId: user._id,
        fromUserId
      });
      // Dopo aver accettato, puoi anche creare una notifica per l'utente mittente se desideri
      alert('Richiesta accettata!');
      const res = await axios.get(`http://localhost:5000/api/friends/requests/${user._id}`);
      setFriendRequests(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Errore');
    }
  };

  if (!user) return <div>Caricamento...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:ml-16">
      <h1 className="text-2xl font-bold mb-4">Notifiche</h1>
      <h2 className="text-xl font-semibold mb-2">Richieste di amicizia</h2>
      {friendRequests.length === 0 ? (
        <p>Nessuna richiesta di amicizia</p>
      ) : (
        friendRequests.map(req => (
          <div key={req._id} className="flex items-center justify-between p-2 border-b">
            <div>
              <p className="font-bold">{req.username}</p>
              <p className="text-sm text-gray-600">{req.fullName}</p>
            </div>
            <button
              onClick={() => handleAccept(req._id)}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Accetta
            </button>
          </div>
        ))
      )}
    </div>
  );
}
