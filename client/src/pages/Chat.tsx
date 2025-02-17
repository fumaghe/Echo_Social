import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export function Chat() {
  const { user } = useAuth();
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Cerca l'utente destinatario per username
  const handleSearchRecipient = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/search?q=${recipientUsername}`);
      if (res.data.length > 0) {
        setRecipientId(res.data[0]._id);
      } else {
        alert('Utente non trovato');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Invia il messaggio
  const handleSendMessage = async () => {
    if (!user || !recipientId) return;
    try {
      await axios.post('http://localhost:5000/api/messages', {
        sender: user._id,
        recipients: [recipientId],
        content: message
      });
      setMessage('');
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  // Recupera i messaggi della conversazione
  const fetchMessages = async () => {
    if (!user || !recipientId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/messages?user1=${user._id}&user2=${recipientId}`);
      setChatMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (recipientId) {
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientId]);

  if (!user) return <div>Caricamento...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:ml-16">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Cerca utente per username"
          value={recipientUsername}
          onChange={e => setRecipientUsername(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button onClick={handleSearchRecipient} className="bg-blue-500 text-white px-4 py-2 rounded">
          Cerca
        </button>
      </div>

      {recipientId && (
        <div className="border p-4 mb-4 h-64 overflow-y-scroll">
          {chatMessages.map(msg => (
            <div key={msg._id} className="mb-2">
              <strong>{msg.sender === user._id ? 'Tu' : 'Loro'}:</strong> {msg.content}
            </div>
          ))}
        </div>
      )}

      {recipientId && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Scrivi un messaggio..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <button onClick={handleSendMessage} className="bg-green-500 text-white px-4 py-2 rounded">
            Invia
          </button>
        </div>
      )}
    </div>
  );
}
