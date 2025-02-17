import React from 'react';
import { Link } from 'react-router-dom';
// Esempio con lucide-react (installalo con npm install lucide-react)
import { Home, Search, MessageCircle, Bell, User, Music2, Settings } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t md:top-0 md:border-t-0 md:border-r md:w-16 md:h-screen">
      <div className="flex justify-around md:flex-col md:h-full md:py-8">
        <Link to="/" className="p-4 hover:bg-gray-100 rounded-lg">
          <Home className="w-6 h-6" />
        </Link>
        <Link to="/search" className="p-4 hover:bg-gray-100 rounded-lg">
          <Search className="w-6 h-6" />
        </Link>
        <Link to="/chat" className="p-4 hover:bg-gray-100 rounded-lg">
          <MessageCircle className="w-6 h-6" />
        </Link>
        <Link to="/notifications" className="p-4 hover:bg-gray-100 rounded-lg">
          <Bell className="w-6 h-6" />
        </Link>
        <Link to="/profile" className="p-4 hover:bg-gray-100 rounded-lg">
          <User className="w-6 h-6" />
        </Link>
        <Link to="/settings" className="p-4 hover:bg-gray-100 rounded-lg">
          <Settings className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  );
}
