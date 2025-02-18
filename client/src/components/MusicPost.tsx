// client/src/components/MusicPost.tsx
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { SpotifyPlayer } from './SpotifyPlayer';
import { useAuth } from '../context/AuthContext';

interface User {
  _id: string;
  username: string;
  avatarUrl?: string;
}

export interface Post {
  _id: string;
  user: User;
  songTitle: string;
  artist: string;
  description: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  coverUrl?: string;   // Copertina canzone
  trackUrl?: string;   // Link a Spotify
  imageUrl?: string;   // <--- Assicurati di aggiungere anche qui se non l'hai fatto
  likes?: string[];
  comments?: {
    user: string;
    username: string;
    text: string;
    createdAt: string;
  }[];
}

interface MusicPostProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
  onShare: (postId: string) => void;
}

export function MusicPost({ post, onLike, onComment, onShare }: MusicPostProps) {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCommentsList, setShowCommentsList] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  // Recuperiamo l'utente dal contesto Auth
  const { user: currentUser } = useAuth();

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      onComment(post._id, commentText);
      setCommentText('');
      setShowCommentsList(true);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Gestione cover canzone (se l'utente ha spotifyAccessToken)
  const handleCoverClick = () => {
    if (!post.trackUrl) return;
    if (currentUser?.spotifyAccessToken) {
      setShowPlayer(true);
    } else {
      window.open(post.trackUrl, '_blank');
    }
  };

  const renderCoverOrPlayer = () => {
    if (showPlayer && post.trackUrl && currentUser?.spotifyAccessToken) {
      return <SpotifyPlayer trackUrl={post.trackUrl} />;
    }
    if (post.coverUrl) {
      return (
        <img
          src={post.coverUrl}
          alt={post.songTitle}
          className="mt-2 w-full rounded cursor-pointer"
          onClick={handleCoverClick}
        />
      );
    }
    return null;
  };

  return (
    <article className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <img
            src={post.user?.avatarUrl || 'https://dummyimage.com/40x40/ccc/fff'}
            alt={post.user?.username || 'User'}
            className="w-10 h-10 rounded-full"
          />
          <div className="ml-3">
            <h3 className="font-medium">{post.user?.username || 'Unknown User'}</h3>
            <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Se esiste un'immagine caricata (imageUrl), la mostriamo qui */}
      {post.imageUrl && (
        <div className="mt-4">
          <img
            src={post.imageUrl}
            alt="Uploaded content"
            className="w-full rounded"
          />
        </div>
      )}

      {/* Se esiste una canzone (songTitle o coverUrl), mostriamo la sezione canzone */}
      {(post.songTitle || post.coverUrl) && (
        <div className="mt-4 bg-gray-100 p-4 rounded-lg">
          <h4 className="font-semibold">{post.songTitle}</h4>
          <p className="text-gray-600">{post.artist}</p>
          {renderCoverOrPlayer()}
        </div>
      )}

      {/* Descrizione del post */}
      <p className="mt-3 text-gray-700">{post.description}</p>

      <div className="mt-4 flex items-center gap-6 text-gray-500">
        <button
          onClick={() => onLike(post._id)}
          className="flex items-center gap-2 hover:text-red-500"
        >
          <Heart className="w-5 h-5" />
          <span>{post.likesCount}</span>
        </button>
        <button
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="flex items-center gap-2 hover:text-blue-500"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.commentsCount}</span>
        </button>
        <button
          onClick={() => onShare(post._id)}
          className="flex items-center gap-2 hover:text-green-500"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Sezione commenti */}
      {showCommentBox && (
        <div className="mt-2 transition-all duration-300 ease-in-out">
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Scrivi un commento..."
            className="w-full border p-2 rounded focus:outline-none"
            rows={2}
          />
          <div className="flex justify-end mt-1">
            <button
              onClick={handleCommentSubmit}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Invia
            </button>
          </div>
        </div>
      )}

      {showCommentsList && post.comments && post.comments.length > 0 && (
        <div className="mt-2 border-t pt-2">
          {post.comments.map((c, index) => (
            <div key={index} className="mb-1 text-sm">
              <span className="font-bold">{c.username}</span>: {c.text}{' '}
              <span className="text-gray-500">({formatTime(c.createdAt)})</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
