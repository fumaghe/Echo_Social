import React from 'react';
import { MusicPost, Post } from '../components/MusicPost';

export function Home() {
  // Esempio di dati mock
  const MOCK_POSTS: Post[] = [
    {
      _id: '1',
      user: {
        _id: 'u1',
        username: 'musiclover',
        avatarUrl: ''
      },
      songTitle: 'Bohemian Rhapsody',
      artist: 'Queen',
      description: 'Un classico intramontabile!',
      likesCount: 42,
      commentsCount: 7,
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      user: {
        _id: 'u2',
        username: 'synthwave',
        avatarUrl: ''
      },
      songTitle: 'Blinding Lights',
      artist: 'The Weeknd',
      description: 'Perfetta per un viaggio notturno.',
      likesCount: 28,
      commentsCount: 3,
      createdAt: new Date().toISOString()
    }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:ml-16">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Echo</h1>
        <p className="text-gray-600">Discover and share music with friends</p>
      </header>

      <div className="space-y-4">
        {MOCK_POSTS.map(post => (
          <MusicPost key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
}

