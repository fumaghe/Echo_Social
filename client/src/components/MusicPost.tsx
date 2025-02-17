import React from 'react';
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
}

interface MusicPostProps {
  post: Post;
}

export function MusicPost({ post }: MusicPostProps) {
  return (
    <article className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <img
            src={post.user.avatarUrl || 'https://via.placeholder.com/40'}
            alt={post.user.username}
            className="w-10 h-10 rounded-full"
          />
          <div className="ml-3">
            <h3 className="font-medium">{post.user.username}</h3>
            <p className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-semibold">{post.songTitle}</h4>
          <p className="text-gray-600">{post.artist}</p>
          {/* Player placeholder */}
          <div className="mt-2 h-20 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-500">Spotify/YouTube Player</span>
          </div>
        </div>
        <p className="mt-3 text-gray-700">{post.description}</p>
      </div>

      <div className="mt-4 flex items-center gap-6 text-gray-500">
        <button className="flex items-center gap-2 hover:text-red-500">
          <Heart className="w-5 h-5" />
          <span>{post.likesCount}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-500">
          <MessageCircle className="w-5 h-5" />
          <span>{post.commentsCount}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-green-500">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}
