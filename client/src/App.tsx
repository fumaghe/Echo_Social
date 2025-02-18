// client/src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Chat } from './pages/Chat';
import { Search } from './pages/Search';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PartnerProfile } from './pages/PartnerProfile';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/Toast';
import { NotificationBar } from './components/NotificationBar';

function App() {
  return (
    <>
      <ToastProvider>
        <NotificationBar />
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/partner-profile" element={<ProtectedRoute><PartnerProfile /></ProtectedRoute>} />
        </Routes>
        <ToastContainer />
      </ToastProvider>
    </>
  );
}

export default App;
