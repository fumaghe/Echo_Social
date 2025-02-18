// client/src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { MusicPost, Post } from '../components/MusicPost';
import { ShareModal } from '../components/ShareModal';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Stati per la creazione del nuovo post
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Stati per la ricerca di brani via Spotify
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);

  // Stato per il modal di condivisione
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState<string>('');

  // Recupera i post
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

  // Ricerca Spotify
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/spotify/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.tracks && data.tracks.items) {
        setSearchResults(data.tracks.items);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTrack = (track: any) => {
    setSelectedTrack(track);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Creazione del post (salviamo trackUrl)
  const handleCreatePost = async () => {
    if (!user) {
      alert("Devi essere autenticato!");
      return;
    }
    if (!description && !imageUrl && !selectedTrack) {
      alert("Inserisci almeno del testo, una foto o seleziona una canzone!");
      return;
    }

    const newPostData = {
      user: {
        _id: user._id,
        username: user.username,
        avatarUrl: user.avatarUrl || ''
      },
      description,
      imageUrl,
      songTitle: selectedTrack ? selectedTrack.name : '',
      artist: selectedTrack ? selectedTrack.artists[0].name : '',
      coverUrl: selectedTrack ? selectedTrack.album.images[0]?.url : '',
      trackUrl: selectedTrack ? selectedTrack.external_urls.spotify : ''
    };

    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPostData)
      });
      const savedPost = await res.json();
      setPosts([savedPost, ...posts]);
      setDescription('');
      setImageUrl('');
      setSelectedTrack(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler per like e commento
  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, username: user.username })
      });
      const updatedPost = await res.json();
      setPosts(posts.map(post => post._id === postId ? updatedPost : post));
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId: string, comment: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, text: comment, username: user.username })
      });
      const updatedPost = await res.json();
      setPosts(posts.map(post => post._id === postId ? updatedPost : post));
    } catch (err) {
      console.error(err);
    }
  };

  // Share: apre il modal
  const handleShare = (postId: string) => {
    setSharePostId(postId);
    setShareModalOpen(true);
  };

  // Invia il post in chat (con link Spotify e cover)
  const sendSharedPost = async (friendId: string, extraMessage: string) => {
    if (!user) return;
    try {
      const sharedPost = posts.find(p => p._id === sharePostId);
      let postSummary = '';
      if (sharedPost) {
        postSummary = `Post di ${sharedPost.user.username}\n${sharedPost.description}\n`;
        if (sharedPost.songTitle) {
          postSummary += `Canzone: ${sharedPost.songTitle} di ${sharedPost.artist}\n`;
          postSummary += `Ascolta qui: ${sharedPost.trackUrl}\n`; 
          postSummary += `Cover: ${sharedPost.coverUrl}\n`; // se vuoi passare la cover
        }
      }
      const content = extraMessage ? `${postSummary}\nMessaggio: ${extraMessage}` : postSummary;
      
      await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: user._id,
          recipients: [friendId],
          content
        })
      });
      setShareModalOpen(false);
      setSharePostId('');
      alert("Post condiviso in chat!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:ml-16">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Echo</h1>
        <p className="text-gray-600">Discover and share music with friends</p>
      </header>

      <div className="mb-6 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Crea un nuovo post</h2>
        
        <div className="mb-2">
          <textarea
            placeholder="Scrivi qualcosa..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-2">
          <input
            type="text"
            placeholder="URL della foto (opzionale)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

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

      <div className="mb-4">
        <button onClick={fetchPosts} className="px-4 py-2 bg-purple-500 text-white rounded">
          Aggiorna Feed
        </button>
      </div>

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

      <ShareModal
        visible={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onShare={sendSharedPost}
        userId={user ? user._id : ''}
        apiUrl={API_URL}
      />
    </div>
  );
}
