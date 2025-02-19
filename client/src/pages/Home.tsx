// client/src/pages/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MusicPost, Post } from '../components/MusicPost';
import { ShareModal } from '../components/ShareModal';
import { useAuth } from '../context/AuthContext';
import { NowPlayingFriends } from '../components/NowPlayingFriends';

const API_URL = import.meta.env.VITE_API_URL;

export function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Stati per la creazione del nuovo post
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Stati per la ricerca di brani
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Stato per il modal di condivisione
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState<string>('');

  // Helper: converti file in Base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

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

  // Ricerca automatica con debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = window.setTimeout(() => {
      handleSearch();
    }, 500);
  }, [searchQuery]);

  const handleSearch = async () => {
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

  // Creazione del post
  const handleCreatePost = async () => {
    if (!user) {
      alert("Devi essere autenticato!");
      return;
    }
    if (!description && !imageFile && !selectedTrack) {
      alert("Inserisci almeno del testo, una foto o seleziona una canzone!");
      return;
    }

    let finalImageUrl = '';
    if (imageFile) {
      try {
        finalImageUrl = await convertFileToBase64(imageFile);
      } catch (error) {
        console.error("Errore nella conversione del file:", error);
      }
    }

    const newPostData = {
      user: {
        _id: user._id,
        username: user.username,
        avatarUrl: user.avatarUrl || ''
      },
      description,
      imageUrl: finalImageUrl,
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
      setImageFile(null);
      setSelectedTrack(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler per like
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

  // Handler per share: apre il modal
  const handleShare = (postId: string) => {
    setSharePostId(postId);
    setShareModalOpen(true);
  };

  // Handler per cancellare un post
  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Errore nella cancellazione del post');
        return;
      }
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      console.error(err);
      alert('Errore del server nella cancellazione del post');
    }
  };

  // Invia il post condiviso
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
          postSummary += `Cover: ${sharedPost.coverUrl}\n`;
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
      {/* Componente NowPlayingFriends in alto */}
      <div className="mb-4">
        <NowPlayingFriends />
      </div>

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
            type="file"
            accept="image/*"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setImageFile(e.target.files[0]);
              }
            }}
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
            onDelete={handleDeletePost}
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
