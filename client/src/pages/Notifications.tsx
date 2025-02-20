import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Salva il timestamp corrente per indicare l'ultimo accesso alla pagina notifiche
    const now = new Date();
    localStorage.setItem("lastNotificationsVisit", now.toISOString());

    // Prima, marca tutte le notifiche come lette sul server...
    axios
      .patch(`${API_URL}/api/notifications/mark-read`, { userId: user._id })
      .then(() => {
        // ... poi recupera le notifiche aggiornate (escludendo quelle di tipo "message")
        return axios.get(`${API_URL}/api/notifications?userId=${user._id}`);
      })
      .then(res => {
        const filtered = res.data
          .filter((notif: any) => notif.type !== 'message')
          .map((notif: any) => ({ ...notif, read: true })); // forza read a true
        setNotifications(filtered);
      })
      .catch(err => console.error(err));
  }, [user]);

  if (!user) return <div>Caricamento...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:ml-16">
      <h1 className="text-2xl font-bold mb-4">Notifiche</h1>
      {notifications.length === 0 ? (
        <p>Nessuna notifica</p>
      ) : (
        notifications.map(notif => (
          <div key={notif._id} className="p-2 border-b flex justify-between items-center">
            <div>
              <p className="font-bold">{notif.message}</p>
              <p className="text-sm text-gray-600">{new Date(notif.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
