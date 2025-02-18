// client/src/components/ShareModal.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

interface Friend {
  _id: string;
  username: string;
  avatarUrl?: string;
}

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: (friendId: string, extraMessage: string) => void;
  userId: string;
  apiUrl: string;
}

export function ShareModal({ visible, onClose, onShare, userId, apiUrl }: ShareModalProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [extraMessage, setExtraMessage] = useState('');

  // Carica la lista degli amici ogni 10 secondi
  const loadFriends = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/friends/${userId}`);
      setFriends(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (visible) {
      loadFriends();
      const interval = setInterval(loadFriends, 10000);
      return () => clearInterval(interval);
    }
  }, [visible, userId, apiUrl]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300">
      <div className="bg-white p-4 rounded w-80 transform transition-all duration-300 ease-out">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold">Condividi in chat</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <textarea
          placeholder="Aggiungi un messaggio (opzionale)"
          value={extraMessage}
          onChange={e => setExtraMessage(e.target.value)}
          className="w-full border p-2 rounded mb-3 resize-none"
          rows={2}
        />
        <div className="overflow-y-auto max-h-60 space-y-2">
          {friends.map(friend => (
            <button
              key={friend._id}
              onClick={() => onShare(friend._id, extraMessage)}
              className="flex items-center gap-2 w-full px-3 py-2 border rounded hover:bg-gray-100 transition-colors"
            >
              <img
                src={friend.avatarUrl || 'https://dummyimage.com/40x40/ccc/fff'}
                alt={friend.username}
                className="w-8 h-8 rounded-full"
              />
              <span>{friend.username}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-3 w-full px-4 py-2 bg-red-500 text-white rounded">
          Annulla
        </button>
      </div>
    </div>
  );
}
