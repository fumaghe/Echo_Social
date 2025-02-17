// client/src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export interface User {
  _id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

interface AuthContextProps {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
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
      const res = await axios.post('http://localhost:5000/api/auth/register', { username, password, fullName });
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
      const res = await axios.put(`http://localhost:5000/api/users/${user._id}`, data);
      setUser(res.data);
      localStorage.setItem('currentUser', JSON.stringify(res.data));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
