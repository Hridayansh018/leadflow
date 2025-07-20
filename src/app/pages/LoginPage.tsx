"use client";

import React, { useState } from 'react';
import { Phone, Lock, Mail, AlertCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, signUp, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let success = false;
      if (isSignUp) {
        success = await signUp(email, password, name);
        if (success) {
          setError('Account created! Please check your email to verify your account.');
          setIsSignUp(false);
          setEmail('');
          setPassword('');
          setName('');
        } else {
          setError('Failed to create account. Please try again.');
        }
      } else {
        success = await login(email, password);
        if (success) {
          onNavigate('dashboard');
        } else {
          setError('Invalid email or password');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An error occurred. Please try again.');
    }
  };

  const fillTestCredentials = (userType: 'admin' | 'demo') => {
    if (userType === 'admin') {
      setEmail('admin@realestate.com');
      setPassword('admin123');
    } else {
      setEmail('demo@test.com');
      setPassword('demo123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--background)] via-[var(--card)] to-[var(--primary)] text-[var(--foreground)] font-sans">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-[var(--card)] border border-[var(--border)]">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Phone className="h-10 w-10 text-[var(--primary)] mr-2" />
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Chirp, Inter, system-ui, sans-serif' }}>
              LeadFlow
            </h1>
          </div>
          <p className="text-[var(--secondary)] text-lg">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-[var(--destructive)] bg-[var(--destructive-foreground)]/10 rounded-lg px-3 py-2 mt-2">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-lg bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md hover:bg-[var(--accent)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign in')}
            </button>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="text-[var(--primary)] hover:underline text-sm font-medium"
            >
              Back to Home
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}