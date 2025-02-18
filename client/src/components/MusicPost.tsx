// client/src/components/MusicPost.tsx
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

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
  coverUrl?: string; 
  trackUrl?: string;  // <--- Aggiunto
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

  // Se esiste trackUrl, rendiamo la copertina cliccabile
  const renderCover = () => {
    if (post.coverUrl && post.trackUrl) {
      return (
        <a href={post.trackUrl} target="_blank" rel="noopener noreferrer">
          <img src={post.coverUrl} alt={post.songTitle} className="mt-2 w-full rounded" />
        </a>
      );
    } else if (post.coverUrl) {
      return (
        <img src={post.coverUrl} alt={post.songTitle} className="mt-2 w-full rounded" />
      );
    } else {
      return (
        <div className="mt-2 h-20 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-gray-500">Spotify/YouTube Player</span>
        </div>
      );
    }
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

      <div className="mt-4 bg-gray-100 p-4 rounded-lg">
        <h4 className="font-semibold">{post.songTitle}</h4>
        <p className="text-gray-600">{post.artist}</p>
        {renderCover()}
      </div>

      <p className="mt-3 text-gray-700">{post.description}</p>

      <div className="mt-4 flex items-center gap-6 text-gray-500">
        <button onClick={() => onLike(post._id)} className="flex items-center gap-2 hover:text-red-500">
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
        <button onClick={() => onShare(post._id)} className="flex items-center gap-2 hover:text-green-500">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

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
            <button onClick={handleCommentSubmit} className="px-3 py-1 bg-blue-500 text-white rounded">
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
