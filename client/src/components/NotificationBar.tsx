// client/src/components/NotificationBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  message: string;
  type: 'message' | 'friend_request' | 'friend_accept' | 'info';
  createdAt: string;
  partnerId?: string;
}

// Legge la base URL da env
const API_URL = import.meta.env.VITE_API_URL;

export function NotificationBar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const userNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      axios
        .get<Notification[]>(`${API_URL}/api/notifications?userId=${user._id}`)
        .then(res => {
          const newNotifications = res.data.filter(
            n => !userNotificationsRef.current.has(n._id)
          );
          if (newNotifications.length > 0) {
            setLocalNotifications(prev => [...prev, ...newNotifications]);
            newNotifications.forEach(n => userNotificationsRef.current.add(n._id));
            // Rimuove le notifiche locali dopo 5 secondi
            newNotifications.forEach(n => {
              setTimeout(() => {
                setLocalNotifications(prev => prev.filter(item => item._id !== n._id));
              }, 5000);
            });
          }
        })
        .catch(err => console.error(err));
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleClick = (notif: Notification) => {
    setLocalNotifications(prev => prev.filter(n => n._id !== notif._id));

    // Reindirizza in base al tipo di notifica
    if (notif.type === 'message' && notif.partnerId) {
      navigate('/chat', { state: { partnerId: notif.partnerId } });
    } else if (notif.type === 'friend_request' || notif.type === 'friend_accept') {
      navigate('/notifications');
    } else {
      navigate('/');
    }
  };

  if (localNotifications.length === 0) return null;

  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center mt-2 space-y-2">
      {localNotifications.map(notif => {
        let borderColor = 'border-blue-500';
        if (notif.type === 'friend_request') borderColor = 'border-green-500';
        else if (notif.type === 'friend_accept') borderColor = 'border-purple-500';
        else if (notif.type === 'message') borderColor = 'border-orange-500';

        return (
          <div
            key={notif._id}
            onClick={() => handleClick(notif)}
            className={`max-w-md w-full bg-white text-gray-800 px-4 py-3 shadow-md border-l-4 cursor-pointer ${borderColor}`}
          >
            <p className="font-semibold">{notif.message}</p>
          </div>
        );
      })}
    </div>
  );
}
