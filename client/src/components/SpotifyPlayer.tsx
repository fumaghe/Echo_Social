// client/src/components/SpotifyPlayer.tsx
import React from 'react';

interface SpotifyPlayerProps {
  trackUrl: string;
}

export function SpotifyPlayer({ trackUrl }: SpotifyPlayerProps) {
  try {
    const url = new URL(trackUrl);
    const segments = url.pathname.split('/');
    // Assumiamo che il percorso sia "/track/{trackId}"
    const trackId = segments[2] || '';
    const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    return (
      <iframe
        src={embedUrl}
        width="100%"
        height="80"
        frameBorder="0"
        {...{ allowtransparency: "true" }}  // Aggiunto via spread operator
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="mt-2 rounded shadow-md"
      ></iframe>
    );
  } catch (error) {
    console.error('Errore nell\'estrazione del trackId', error);
    return null;
  }
}
