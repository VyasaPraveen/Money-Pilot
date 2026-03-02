'use client';

import { useState } from 'react';
import type { User } from '@/lib/constants';
import { loginByPin } from '@/lib/userService';

interface Props {
  onLogin: (user: User) => void;
}

export default function PinLogin({ onLogin }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const showError = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => {
      setPin('');
      setShaking(false);
    }, 500);
  };

  const handleLogin = async (enteredPin: string) => {
    setLoading(true);
    try {
      const user = await loginByPin(enteredPin);
      if (user) {
        onLogin(user);
      } else {
        showError('Invalid PIN. Please try again.');
      }
    } catch {
      showError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNumber = (num: string) => {
    if (pin.length >= 4 || loading) return;
    const newPin = pin + num;
    setPin(newPin);
    setError('');

    if (newPin.length === 4) {
      handleLogin(newPin);
    }
  };

  const handleBackspace = () => {
    if (loading) return;
    setPin(pin.slice(0, -1));
    setError('');
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      {/* App Logo */}
      <div className="text-center mb-8">
        <img
          src="/icons/logo.png"
          alt="Money Pilot"
          width={80}
          height={80}
          className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-lg"
        />
        <h1 className="text-3xl font-bold text-white">Money Pilot</h1>
        <p className="text-white/60 mt-1 text-sm">Enter your PIN to continue</p>
      </div>

      {/* PIN Dots */}
      <div className={`flex gap-4 mb-3 ${shaking ? 'animate-shake' : ''}`} role="status" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < pin.length
                ? shaking
                  ? 'bg-red-400 scale-125'
                  : 'bg-white scale-125'
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Subtitle */}
      <p className="text-white/40 text-xs mb-8">Enter 4-digit PIN</p>

      {/* Loading */}
      {loading && (
        <div className="mb-6">
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px]">
        {keys.map((key, idx) => (
          <button
            key={key || `empty-${idx}`}
            disabled={loading}
            onClick={() => {
              if (key === 'back') handleBackspace();
              else if (key) handleNumber(key);
            }}
            aria-label={key === 'back' ? 'Backspace' : key || undefined}
            className={`w-20 h-20 rounded-2xl text-2xl font-semibold transition-all duration-150 ${
              key === ''
                ? 'invisible'
                : key === 'back'
                  ? 'text-white/70 hover:bg-white/10 active:bg-white/20'
                  : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30 backdrop-blur-sm'
            } ${loading ? 'opacity-50' : ''}`}
          >
            {key === 'back' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto" aria-hidden="true">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            ) : (
              key
            )}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-300 text-sm mt-5 text-center max-w-[280px]" role="alert">{error}</p>
      )}

    </div>
  );
}
