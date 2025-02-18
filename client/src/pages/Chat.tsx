// client/src/pages/Chat.tsx
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Search, MoreHorizontal, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Conversation {
  partnerId: string;
  lastMessage: any;
  unreadCount: number;
}

interface UserData {
  _id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

interface Message {
  _id: string;
  sender: string;
  recipients: string[];
  content: string;
  createdAt: string;
  delivered: boolean;
  read: boolean;
}

// Leggi la base URL da env
const API_URL = import.meta.env.VITE_API_URL;

export function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return <div>Caricamento...</div>;

  // Vista: "list" oppure "chat"
  const [viewMode, setViewMode] = useState<'list' | 'chat'>('list');

  // Conversazioni e dati partner
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [partnersData, setPartnersData] = useState<Record<string, UserData>>({});

  // Chat attiva
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [selectedPartnerData, setSelectedPartnerData] = useState<UserData | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');

  // Polling
  const pollingIntervalRef = useRef<number | null>(null);
  const listPollingRef = useRef<number | null>(null);

  // Menu "3 puntini" per eliminare l'intera chat
  const [chatMenuOpen, setChatMenuOpen] = useState(false);

  // Ricerca utenti per nuova chat
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);

  // Drawer di ricerca messaggi
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Carica conversazioni
  const loadConversations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/conversations?userId=${user._id}`);
      setConversations(res.data);
      const uniqueIds = Array.from(new Set(res.data.map((c: Conversation) => c.partnerId)));
      const requests = uniqueIds.map(id => axios.get(`${API_URL}/api/users/${id}`));
      const results = await Promise.all(requests);
      const newPartners: Record<string, UserData> = {};
      results.forEach(r => {
        const p: UserData = r.data;
        newPartners[p._id] = p;
      });
      setPartnersData(newPartners);
    } catch (err) {
      console.error(err);
    }
  };

  // Polling per la lista conversazioni (ogni 1 secondo)
  useEffect(() => {
    if (viewMode === 'list') {
      loadConversations();
      listPollingRef.current = window.setInterval(loadConversations, 1000);
      return () => {
        if (listPollingRef.current !== null) clearInterval(listPollingRef.current);
      };
    }
  }, [viewMode, user]);

  // Carica i messaggi della chat attiva
  const loadMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/messages?user1=${user._id}&user2=${selectedPartnerId}`);
      setChatMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Polling per la chat (ogni 1 secondo)
  useEffect(() => {
    if (viewMode === 'chat' && selectedPartnerId) {
      loadMessages();
      pollingIntervalRef.current = window.setInterval(loadMessages, 1000);
      return () => {
        if (pollingIntervalRef.current !== null) clearInterval(pollingIntervalRef.current);
      };
    }
  }, [viewMode, selectedPartnerId, user]);

  const handleSelectConversation = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setViewMode('chat');
  };

  // Invio del messaggio
  const handleSendMessage = async () => {
    if (!selectedPartnerId || !messageText.trim()) return;
    try {
      await axios.post(`${API_URL}/api/messages`, {
        sender: user._id,
        recipients: [selectedPartnerId],
        content: messageText
      });
      setMessageText('');
      loadMessages();
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  // Invia con Enter (senza shift)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPartnerId('');
    setChatMessages([]);
    setSelectedPartnerData(null);
    if (pollingIntervalRef.current !== null) clearInterval(pollingIntervalRef.current);
  };

  // Carica i dati del partner
  useEffect(() => {
    if (selectedPartnerId) {
      if (partnersData[selectedPartnerId]) {
        setSelectedPartnerData(partnersData[selectedPartnerId]);
      } else {
        axios
          .get(`${API_URL}/api/users/${selectedPartnerId}`)
          .then(r => setSelectedPartnerData(r.data))
          .catch(err => console.error(err));
      }
    }
  }, [selectedPartnerId, partnersData]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check marks stile WhatsApp
  const renderCheckMarks = (msg: Message) => {
    if (msg.sender !== user._id) return null;
    if (!msg.delivered) return <span className="text-gray-500 text-xs">✓</span>;
    if (msg.delivered && !msg.read) return <span className="text-gray-500 text-xs">✓✓</span>;
    if (msg.read) return <span className="text-blue-500 text-xs">✓✓</span>;
    return null;
  };

  // Ricerca utenti per nuova chat
  const handleSearchUsers = async () => {
    if (!userSearchQuery.trim()) return;
    try {
      const res = await axios.get(`${API_URL}/api/users/search?q=${userSearchQuery}`);
      const filtered = res.data.filter((u: any) => u._id !== user._id);
      setUserSearchResults(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartNewChat = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setViewMode('chat');
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  // Drawer di ricerca messaggi
  const toggleSearchDrawer = () => {
    setSearchDrawerOpen(!searchDrawerOpen);
    setSearchQuery('');
    setSearchResults([]);
    setHighlightedMessageId(null);
  };

  const handleSearchMessages = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const results = chatMessages.filter(msg =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
  };

  const scrollToMessage = (msgId: string) => {
    setHighlightedMessageId(msgId);
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Menu chat per eliminare l'intera conversazione
  const toggleChatMenu = () => {
    setChatMenuOpen(!chatMenuOpen);
  };

  const handleDeleteConversation = async () => {
    if (!selectedPartnerId) return;
    try {
      await axios.delete(`${API_URL}/api/messages?user1=${user._id}&user2=${selectedPartnerId}`);
      setChatMenuOpen(false);
      setViewMode('list');
      setSelectedPartnerId('');
      setChatMessages([]);
      setSelectedPartnerData(null);
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  // Eliminazione di un singolo messaggio
  const handleDeleteMessage = async (msgId: string) => {
    try {
      await axios.delete(`${API_URL}/api/messages/${msgId}`);
      loadMessages();
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-50 h-screen w-full flex flex-col pt-16 pb-16 md:ml-16 overflow-hidden">
      {viewMode === 'chat' ? (
        <div className="border-b p-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <button onClick={handleBackToList}>
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h2
              onClick={() => {
                if (selectedPartnerData) {
                  navigate('/partner-profile', { state: { user: selectedPartnerData } });
                }
              }}
              className="text-lg font-bold text-gray-800 cursor-pointer"
            >
              {selectedPartnerData ? selectedPartnerData.username : 'Loading...'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleSearchDrawer}>
              <Search className="w-5 h-5 text-gray-700" />
            </button>
            <div className="relative">
              <button onClick={toggleChatMenu}>
                <MoreHorizontal className="w-5 h-5 text-gray-700" />
              </button>
              {chatMenuOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded shadow p-2 z-20">
                  <button
                    onClick={handleDeleteConversation}
                    className="block w-full text-left px-3 py-1 text-red-600 hover:bg-gray-100"
                  >
                    Elimina conversazione
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-b p-4 bg-white">
          <h2 className="text-lg font-bold text-gray-800">Chats</h2>
        </div>
      )}

      <div className="flex-1 overflow-y-auto relative">
        {viewMode === 'list' ? (
          <div>
            <div className="p-4 border-b bg-white">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Cerca utente..."
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className="border p-2 rounded flex-1"
                />
                <button onClick={handleSearchUsers} className="bg-blue-500 text-white px-3 py-1 rounded">
                  Cerca
                </button>
              </div>
              {userSearchResults.map(u => (
                <div
                  key={u._id}
                  onClick={() => handleStartNewChat(u._id)}
                  className="cursor-pointer p-2 border-b hover:bg-gray-100"
                >
                  <p className="font-bold">{u.username}</p>
                  <p className="text-sm text-gray-600">{u.fullName}</p>
                </div>
              ))}
            </div>
            {conversations.map(conv => {
              const partnerId = conv.partnerId;
              const partner = partnersData[partnerId];
              return (
                <div
                  key={partnerId}
                  onClick={() => handleSelectConversation(partnerId)}
                  className="cursor-pointer p-3 border-b hover:bg-gray-100 flex items-center justify-between bg-white"
                >
                  <div>
                    <p className="font-bold text-gray-800">{partner ? partner.username : partnerId}</p>
                    <p className="text-sm text-gray-600">
                      {conv.lastMessage ? conv.lastMessage.content : 'No messages yet'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Drawer di ricerca messaggi */}
            <div
              className={`fixed top-16 right-0 w-64 bg-white border-l h-full z-30 transform transition-transform ${
                searchDrawerOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="p-3 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-700">Cerca nei messaggi</h3>
                <button onClick={() => setSearchDrawerOpen(false)} className="text-gray-500">
                  ×
                </button>
              </div>
              <div className="p-3">
                <input
                  type="text"
                  placeholder="Cerca..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="border w-full p-2 rounded mb-2 focus:outline-none"
                />
                <button
                  onClick={handleSearchMessages}
                  className="bg-blue-500 text-white px-3 py-1 rounded w-full"
                >
                  Cerca
                </button>
              </div>
              <div className="p-3 overflow-y-auto flex-1">
                {searchResults.length > 0 ? (
                  searchResults.map(msg => (
                    <div
                      key={msg._id}
                      onClick={() => {
                        setSearchDrawerOpen(false);
                        setHighlightedMessageId(msg._id);
                        scrollToMessage(msg._id);
                      }}
                      className="cursor-pointer p-2 hover:bg-gray-100 rounded mb-1"
                    >
                      <p className="text-sm text-gray-800 truncate">{msg.content}</p>
                      <span className="text-xs text-gray-500">{formatTime(msg.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nessun risultato</p>
                )}
              </div>
            </div>

            {/* Finestra messaggi */}
            <div className="flex-1 overflow-y-auto p-4">
              {chatMessages.map(msg => {
                const isHighlighted = msg._id === highlightedMessageId;
                return (
                  <div
                    key={msg._id}
                    id={`msg-${msg._id}`}
                    className={`mb-2 flex ${msg.sender === user._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="relative group flex flex-col">
                      <div
                        className={`max-w-[100%] break-words whitespace-pre-wrap px-4 py-2 rounded-3xl shadow-sm transition-colors duration-300 ${
                          msg.sender === user._id
                            ? isHighlighted
                              ? 'bg-green-300'
                              : 'bg-blue-400 text-white rounded-br-none'
                            : isHighlighted
                              ? 'bg-green-300'
                              : 'bg-white text-gray-800 rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 self-end mt-1">
                        <span>{formatTime(msg.createdAt)}</span>
                        {renderCheckMarks(msg)}
                        {msg.sender === user._id && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Elimina messaggio"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t p-3 bg-white flex items-center gap-2">
              <textarea
                placeholder="Scrivi un messaggio..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border p-2 rounded resize-y focus:outline-none"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                className="bg-green-500 text-white px-4 py-2 rounded shadow"
              >
                Invia
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
