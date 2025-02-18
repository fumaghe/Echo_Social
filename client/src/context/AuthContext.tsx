// client/src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

export interface User {
  _id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  friends?: string[];
  spotifyId?: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
}

interface AuthContextProps {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  loginWithSpotify: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      const params = new URLSearchParams(location.search);
      const spotifyLogin = params.get('spotifyLogin');
      const userId = params.get('userId');
      console.log('Params from URL:', { spotifyLogin, userId });
      if (spotifyLogin === 'success' && userId) {
        axios.get(`${API_URL}/api/auth/me`, { params: { userId } })
          .then(res => {
            console.log('User recuperato da /me:', res.data.user);
            setUser(res.data.user);
            localStorage.setItem('currentUser', JSON.stringify(res.data.user));
            // Rimuovi i parametri dalla URL
            window.history.replaceState({}, document.title, location.pathname);
          })
          .catch(err => console.error('Errore recuperando l\'utente da Spotify:', err));
      }
    }
  }, [location]);

  const login = async (username: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
      setUser(res.data.user);
      localStorage.setItem('currentUser', JSON.stringify(res.data.user));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const register = async (username: string, password: string, fullName: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, { username, password, fullName });
      setUser(res.data.user);
      localStorage.setItem('currentUser', JSON.stringify(res.data.user));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return false;
    try {
      const res = await axios.put(`${API_URL}/api/users/${user._id}`, data);
      setUser(res.data);
      localStorage.setItem('currentUser', JSON.stringify(res.data));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const loginWithSpotify = () => {
    window.location.href = `${API_URL}/api/auth/spotify`;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loginWithSpotify }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
