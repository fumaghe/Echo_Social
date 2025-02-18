// client/src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user, login, register, loginWithSpotify } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;
    if (isRegister) {
      success = await register(username, password, fullName);
      if (!success) setError('Errore durante la registrazione');
    } else {
      success = await login(username, password);
      if (!success) setError('Credenziali non valide');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">
          {isRegister ? 'Registrazione' : 'Login'}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 mb-2">
            Nome Utente
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>

        {isRegister && (
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              required
            />
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {isRegister ? 'Registrati' : 'Accedi'}
        </button>

        <p className="mt-4 text-center">
          {isRegister ? 'Hai già un account?' : 'Non hai un account?'}{' '}
          <button
            type="button"
            className="text-blue-500 hover:underline"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
          >
            {isRegister ? 'Accedi' : 'Registrati'}
          </button>
        </p>

        {!isRegister && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={loginWithSpotify}
              className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
            >
              Accedi con Spotify
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
