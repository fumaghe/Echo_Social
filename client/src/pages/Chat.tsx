// client/src/pages/Chat.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

interface Conversation {
  partnerId: string;
  lastMessage: any;
}

interface UserData {
  _id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

export function Chat() {
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'list' | 'chat'>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [partnersData, setPartnersData] = useState<Record<string, UserData>>({});
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [selectedPartnerData, setSelectedPartnerData] = useState<UserData | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');

  // Ricerca rapida per iniziare nuova chat
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    // Carica conversazioni
    axios.get(`http://localhost:5000/api/conversations?userId=${user._id}`)
      .then(async (res) => {
        setConversations(res.data);
        const uniqueIds = Array.from(new Set(res.data.map((c: Conversation) => c.partnerId)));
        const requests = uniqueIds.map(id => axios.get(`http://localhost:5000/api/users/${id}`));
        const results = await Promise.all(requests);
        const newMap: Record<string, UserData> = {};
        results.forEach(r => {
          const ud = r.data;
          newMap[ud._id] = ud;
        });
        setPartnersData(newMap);
      })
      .catch(err => console.error(err));
  }, [user]);

  // Carica messaggi e dati partner
  useEffect(() => {
    if (!user || !selectedPartnerId) return;
    axios.get(`http://localhost:5000/api/messages?user1=${user._id}&user2=${selectedPartnerId}`)
      .then(res => setChatMessages(res.data))
      .catch(err => console.error(err));
    if (partnersData[selectedPartnerId]) {
      setSelectedPartnerData(partnersData[selectedPartnerId]);
    } else {
      axios.get(`http://localhost:5000/api/users/${selectedPartnerId}`)
        .then(r => setSelectedPartnerData(r.data))
        .catch(err => console.error(err));
    }
  }, [selectedPartnerId, user, partnersData]);

  const handleSelectConversation = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setViewMode('chat');
  };

  const handleSendMessage = async () => {
    if (!user || !selectedPartnerId || !messageText.trim()) return;
    try {
      await axios.post('http://localhost:5000/api/messages', {
        sender: user._id,
        recipients: [selectedPartnerId],
        content: messageText
      });
      setMessageText('');
      // ricarica
      const res = await axios.get(`http://localhost:5000/api/messages?user1=${user._id}&user2=${selectedPartnerId}`);
      setChatMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPartnerId('');
    setChatMessages([]);
    setSelectedPartnerData(null);
  };

  // Ricerca per avviare nuova chat
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/users/search?q=${searchQuery}`);
      const filtered = res.data.filter((u: any) => u._id !== user?._id);
      setSearchResults(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartNewChat = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setViewMode('chat');
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="pt-16 pb-16 md:ml-16 h-screen overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="border-b flex items-center p-4">
        {viewMode === 'chat' ? (
          <>
            <button onClick={handleBackToList} className="mr-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">
              {selectedPartnerData ? selectedPartnerData.username : 'Loading...'}
            </h2>
          </>
        ) : (
          <h2 className="text-xl font-bold">Chats</h2>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'list' ? (
          <div>
            {/* Box di ricerca per nuova chat */}
            <div className="p-4 border-b">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Cerca utente..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="border p-2 rounded flex-1"
                />
                <button onClick={handleSearch} className="bg-blue-500 text-white px-3 py-1 rounded">
                  Cerca
                </button>
              </div>
              {searchResults.map(u => (
                <div
                  key={u._id}
                  className="cursor-pointer p-2 border-b hover:bg-gray-100"
                  onClick={() => handleStartNewChat(u._id)}
                >
                  <p className="font-bold">{u.username}</p>
                  <p className="text-sm text-gray-600">{u.fullName}</p>
                </div>
              ))}
            </div>
            {/* Elenco conversazioni */}
            {conversations.map(conv => {
              const partnerId = conv.partnerId;
              const partner = partnersData[partnerId];
              return (
                <div
                  key={partnerId}
                  onClick={() => handleSelectConversation(partnerId)}
                  className="cursor-pointer p-3 border-b hover:bg-gray-100 flex items-center"
                >
                  <div className="flex-1">
                    <p className="font-bold">{partner ? partner.username : partnerId}</p>
                    <p className="text-sm text-gray-600">
                      {conv.lastMessage ? conv.lastMessage.content : 'No messages yet'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Finestra messaggi */}
            <div className="flex-1 overflow-y-auto p-4">
              {chatMessages.map(msg => (
                <div
                  key={msg._id}
                  className={`mb-2 flex ${msg.sender === user?._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`inline-block px-3 py-2 rounded ${
                      msg.sender === user?._id ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            {/* Input messaggio */}
            <div className="border-t p-3 flex items-center">
              <input
                type="text"
                placeholder="Scrivi un messaggio..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                className="flex-1 border p-2 rounded mr-2"
              />
              <button onClick={handleSendMessage} className="bg-green-500 text-white px-4 py-2 rounded">
                Invia
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
