// client/src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { MusicPost, Post } from '../components/MusicPost';

// Imposta l'API URL in base all'ambiente (development o production)
const API_URL = import.meta.env.VITE_API_URL;

export function Home() {
  // Stato per i post, inizialmente vuoto
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Stati per la creazione del nuovo post
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Stati per la ricerca di canzoni via Spotify
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);

  // Funzione per recuperare i post dal backend
  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts`);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Funzione per la ricerca di brani tramite Spotify
  const handleSearch = async () => {
    if (searchQuery.trim() === '') return;
    try {
      const res = await fetch(`${API_URL}/api/spotify/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      // I risultati sono in data.tracks.items
      setSearchResults(data.tracks.items);
    } catch (err) {
      console.error(err);
    }
  };

  // Selezione di una canzone dalla ricerca
  const handleSelectTrack = (track: any) => {
    setSelectedTrack(track);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Funzione per creare un nuovo post (invio al backend)
  const handleCreatePost = async () => {
    if (!description && !imageUrl && !selectedTrack) {
      alert("Inserisci almeno del testo, una foto o seleziona una canzone!");
      return;
    }

    const newPostData = {
      user: {
        _id: 'currentUser',         // da sostituire con l'ID utente autenticato
        username: 'currentUsername', // da sostituire con il nome utente
        avatarUrl: ''
      },
      description,
      imageUrl,
      songTitle: selectedTrack ? selectedTrack.name : '',
      artist: selectedTrack ? selectedTrack.artists[0].name : '',
      coverUrl: selectedTrack ? selectedTrack.album.images[0]?.url : ''
    };

    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPostData)
      });
      const savedPost = await res.json();
      setPosts([savedPost, ...posts]);
      // Reset dei campi
      setDescription('');
      setImageUrl('');
      setSelectedTrack(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler per mettere like: invia una richiesta POST a /api/posts/:id/like
  const handleLike = async (postId: string) => {
    const userId = 'currentUser'; // sostituisci con l'ID dell'utente autenticato
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const updatedPost = await res.json();
      setPosts(posts.map(post => post._id === postId ? updatedPost : post));
    } catch (err) {
      console.error(err);
    }
  };

  // Handler per aggiungere un commento
  const handleComment = async (postId: string, comment: string) => {
    const userId = 'currentUser';
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text: comment })
      });
      const updatedPost = await res.json();
      setPosts(posts.map(post => post._id === postId ? updatedPost : post));
    } catch (err) {
      console.error(err);
    }
  };

  // Handler per la share: simulazione (da integrare con logica chat)
  const handleShare = (postId: string) => {
    alert(`Share del post ${postId}: qui puoi implementare l'invio in chat`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:ml-16">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Echo</h1>
        <p className="text-gray-600">Discover and share music with friends</p>
      </header>

      {/* Sezione per creare un nuovo post */}
      <div className="mb-6 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Crea un nuovo post</h2>
        
        {/* Campo per il testo */}
        <div className="mb-2">
          <textarea
            placeholder="Scrivi qualcosa..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        {/* Campo per l'URL della foto */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="URL della foto (opzionale)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        {/* Ricerca canzone tramite Spotify */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="Cerca una canzone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 w-full"
          />
          <button onClick={handleSearch} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Cerca
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="border p-2 mb-2">
            {searchResults.map((track) => (
              <div
                key={track.id}
                className="flex items-center cursor-pointer mb-2"
                onClick={() => handleSelectTrack(track)}
              >
                <img
                  src={track.album.images[2]?.url || track.album.images[0]?.url}
                  alt={track.name}
                  className="w-12 h-12 mr-2"
                />
                <div>
                  <div className="font-bold">{track.name}</div>
                  <div className="text-sm text-gray-600">
                    {track.artists.map((a: any) => a.name).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedTrack && (
          <div className="mb-2">
            <h3 className="font-semibold">Canzone selezionata:</h3>
            <div className="flex items-center">
              <img
                src={selectedTrack.album.images[0]?.url}
                alt={selectedTrack.name}
                className="w-12 h-12 mr-2"
              />
              <div>
                <div className="font-bold">{selectedTrack.name}</div>
                <div className="text-sm text-gray-600">
                  {selectedTrack.artists.map((a: any) => a.name).join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleCreatePost} className="px-4 py-2 bg-green-500 text-white rounded">
          Pubblica Post
        </button>
      </div>

      {/* Bottone per aggiornare il feed */}
      <div className="mb-4">
        <button onClick={fetchPosts} className="px-4 py-2 bg-purple-500 text-white rounded">
          Aggiorna Feed
        </button>
      </div>

      {/* Feed dei post */}
      <div className="space-y-4">
        {posts.map((post) => (
          <MusicPost
            key={post._id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
          />
        ))}
      </div>
    </div>
  );
}
