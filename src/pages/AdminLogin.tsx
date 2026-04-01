import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C9A84C] border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-600/10 mb-6">
            <Shield size={36} className="text-[#C9A84C]" />
          </div>
          <h1 className="text-3xl font-sans font-bold text-slate-900 tracking-wide">AFRIKHER</h1>
          <p className="text-[#C9A84C] text-xs uppercase tracking-[0.3em] mt-2 font-bold">
            Portail Administrateur
          </p>
          <div className="mt-6 px-6 py-3 bg-green-600/10 border border-slate-300 rounded-xl inline-block">
            <p className="text-[#C9A84C] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={14} />
              Accès strictement réservé aux administrateurs
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg border border-slate-200 rounded-3xl p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-xl text-sm flex items-start gap-3">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-[#9A9A8A] font-bold block">
              Email administrateur
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9A8A]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@afrikher.com"
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-green-500 transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-[#9A9A8A] font-bold block">
              Mot de passe
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9A8A]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-green-500 transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full py-4 bg-green-600 text-[#0A0A0A] rounded-xl text-sm uppercase tracking-widest font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              <>
                Se connecter
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[#9A9A8A] text-xs mt-8">
          &copy; {new Date().getFullYear()} AFRIKHER — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
