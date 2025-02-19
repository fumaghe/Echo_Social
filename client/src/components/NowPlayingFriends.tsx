import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface Friend {
  _id: string;
  username: string;
  avatarUrl?: string;
  spotifyAccessToken?: string;
}

interface NowPlayingData {
  currentlyPlaying: any;
}

export function NowPlayingFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [nowPlayingMap, setNowPlayingMap] = useState<Record<string, NowPlayingData | null>>({});
  const [expandedFriend, setExpandedFriend] = useState<Friend | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Recupera amici
  const fetchFriends = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/friends/${user._id}`);
      const data = await res.json();
      console.log('Amici recuperati:', data);
      setFriends(data);
    } catch (error) {
      console.error('Errore nel recupero degli amici:', error);
    }
  };

  // Recupera now playing
  const fetchNowPlaying = async () => {
    for (const friend of friends) {
      if (friend.spotifyAccessToken) {
        try {
          const res = await fetch(`${API_URL}/api/spotify/nowplaying?userId=${friend._id}`);
          const data = await res.json();
          console.log(`Now playing per ${friend.username}:`, data);
          setNowPlayingMap(prev => ({ ...prev, [friend._id]: data }));
        } catch (error) {
          console.error(`Errore now playing per ${friend.username}:`, error);
          setNowPlayingMap(prev => ({ ...prev, [friend._id]: null }));
        }
      }
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  useEffect(() => {
    if (friends.length > 0) {
      fetchNowPlaying();
      const interval = setInterval(() => {
        fetchNowPlaying();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [friends]);

  // Apertura/chiusura del rettangolo
  const toggleExpand = (friend: Friend) => {
    setExpandedFriend(prev => (prev && prev._id === friend._id ? null : friend));
  };

  // Clic overlay per chiudere
  const handleOverlayClick = () => {
    setExpandedFriend(null);
  };

  // Aggiunge brano ai preferiti
  const handleAddToLibrary = async (trackId: string) => {
    if (!user) return alert('Devi essere loggato con Spotify!');
    try {
      const res = await fetch(`${API_URL}/api/spotify/saveTrack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, trackId })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Errore salvataggio brano');
        return;
      }
      alert('Brano aggiunto ai tuoi preferiti!');
    } catch (err) {
      console.error('Errore salvataggio brano:', err);
      alert('Errore interno.');
    }
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Amici in riproduzione</h2>
        <div className="flex space-x-4 overflow-x-auto">
          {friends.map(friend => {
            const nowPlaying = nowPlayingMap[friend._id];
            const isPlaying =
              friend.spotifyAccessToken &&
              nowPlaying &&
              nowPlaying.currentlyPlaying &&
              nowPlaying.currentlyPlaying.item;
            const isExpanded = expandedFriend && expandedFriend._id === friend._id;

            const containerClasses = [
              'now-playing-container',
              isExpanded ? 'now-playing-expanded' : 'now-playing-circle',
              'relative'
            ].join(' ');

            if (isPlaying) {
              return (
                <div
                  key={friend._id}
                  className={containerClasses}
                  onClick={() => toggleExpand(friend)}
                >
                  {!isExpanded && (
                    <img
                      src={friend.avatarUrl || 'https://dummyimage.com/80x80/ccc/fff'}
                      alt={friend.username}
                      className="now-playing-avatar"
                    />
                  )}
                  {isExpanded && (
                    <>
                      <img
                        className="now-playing-image"
                        src={nowPlaying.currentlyPlaying.item.album.images[0]?.url}
                        alt={nowPlaying.currentlyPlaying.item.name}
                      />
                      <div className="now-playing-info">
                        <div className="font-bold text-sm">{friend.username}</div>
                        <div className="text-xs">
                          {nowPlaying.currentlyPlaying.item.name} di{' '}
                          {nowPlaying.currentlyPlaying.item.artists
                            .map((a: any) => a.name)
                            .join(', ')}
                        </div>
                        <button
                          className="now-playing-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToLibrary(nowPlaying.currentlyPlaying.item.id);
                          }}
                        >
                          Add to your library
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            }

            // Se non c'è nulla in riproduzione, cerchio grigio
            return (
              <div
                key={friend._id}
                className="now-playing-circle bg-gray-500 w-[80px] h-[80px] rounded-full relative"
                title="Nessun brano in riproduzione (forse sessione privata o token scaduto)"
              >
                <img
                  src={friend.avatarUrl || 'https://dummyimage.com/80x80/ccc/fff'}
                  alt={friend.username}
                  className="now-playing-avatar"
                />
              </div>
            );
          })}
        </div>
      </div>

      {expandedFriend && (
        <div className="now-playing-overlay" onClick={handleOverlayClick} />
      )}
    </>
  );
}
