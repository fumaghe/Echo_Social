import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, Bell, User, Settings } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export function Navbar() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCount = () => {
      axios
        .get(`${API_URL}/api/notifications?userId=${user._id}`)
        .then(res => {
          // Recupera il timestamp dell'ultimo accesso alla pagina notifiche, se presente
          const lastVisitStr = localStorage.getItem("lastNotificationsVisit");
          const lastVisit = lastVisitStr ? new Date(lastVisitStr) : null;

          // Conta solo le notifiche non lette (escludendo quelle di tipo "message")
          // E, se c'è un lastVisit, conta solo quelle arrivate dopo quel timestamp.
          const unread = res.data.filter((notif: any) => {
            if (notif.type === 'message') return false;
            if (!notif.read) {
              if (lastVisit) {
                return new Date(notif.createdAt) > lastVisit;
              }
              return true;
            }
            return false;
          });
          setUnreadCount(unread.length);
        })
        .catch(err => console.error(err));
    };

    fetchUnreadCount();
    // Aggiorna il conteggio ogni 10 secondi
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [user, location]);

  return (
    <nav className="fixed bottom-0 left-0 w-full h-14 bg-white border-t md:top-0 md:bottom-auto md:border-t-0 md:border-r md:w-16 md:h-screen z-50">
      <div className="flex justify-around items-center h-full md:flex-col md:py-8">
        <Link to="/" className="p-4 hover:bg-gray-100 rounded-lg">
          <Home className="w-6 h-6" />
        </Link>
        <Link to="/search" className="p-4 hover:bg-gray-100 rounded-lg">
          <Search className="w-6 h-6" />
        </Link>
        <Link to="/chat" className="p-4 hover:bg-gray-100 rounded-lg">
          <MessageCircle className="w-6 h-6" />
        </Link>
        <Link to="/notifications" className="relative p-4 hover:bg-gray-100 rounded-lg">
          <Bell className="w-6 h-6" />
          {/* Il badge viene mostrato solo se siamo fuori dalla pagina notifiche */}
          {location.pathname !== '/notifications' && unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
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
