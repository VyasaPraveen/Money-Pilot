'use client';

import { useState } from 'react';
import { USERS } from '@/lib/constants';

interface Props {
  onLogin: (name: string) => void;
}

export default function PinLogin({ onLogin }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleNumber = (num: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === 4) {
      const user = USERS.find((u) => u.pin === newPin);
      if (user) {
        onLogin(user.name);
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      {/* App Logo */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">Money Pilot</h1>
        <p className="text-white/60 mt-1 text-sm">Enter your PIN to continue</p>
      </div>

      {/* PIN Dots */}
      <div className={`flex gap-4 mb-12 ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < pin.length
                ? error
                  ? 'bg-red-400 scale-125'
                  : 'bg-white scale-125'
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px]">
        {keys.map((key, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (key === 'back') handleBackspace();
              else if (key) handleNumber(key);
            }}
            className={`w-20 h-20 rounded-2xl text-2xl font-semibold transition-all duration-150 ${
              key === ''
                ? 'invisible'
                : key === 'back'
                  ? 'text-white/70 hover:bg-white/10 active:bg-white/20'
                  : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30 backdrop-blur-sm'
            }`}
          >
            {key === 'back' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
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

      {error && (
        <p className="text-red-300 text-sm mt-6">Wrong PIN. Try again.</p>
      )}
    </div>
  );
}
