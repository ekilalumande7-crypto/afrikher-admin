import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { AdminAlert, adminInputClass, adminPrimaryButtonClass } from '../components/AdminPrimitives';

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
    <div className="min-h-screen bg-[#F6F1E8] px-4">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.14),transparent_60%)]" />
      <div className="relative flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="mb-4 text-[10px] uppercase tracking-[0.34em] text-[#9A9A8A]">
            Administration AFRIKHER
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.75rem] border border-[#C9A84C]/25 bg-white mb-6 shadow-sm">
            <Shield size={36} className="text-[#C9A84C]" />
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-[0.08em] text-[#0A0A0A]">AFRIKHER</h1>
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-[#C9A84C]">
            Portail Administrateur
          </p>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[#6F675B]">
            Un espace reserve a l’equipe pour piloter les contenus, l’image de marque et les activations editoriales.
          </p>
          <div className="mt-6 inline-block rounded-2xl border border-[#C9A84C]/25 bg-[#FBF7ED] px-6 py-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6D5622]">
              <AlertCircle size={14} />
              Accès strictement réservé aux administrateurs
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-[#E9E2D6] bg-white p-8 shadow-[0_24px_80px_rgba(10,10,10,0.08)]">
          {error && (
            <AdminAlert tone="error" className="items-start">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </AdminAlert>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9A9A8A]">
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
                className={`${adminInputClass} rounded-2xl pl-12 py-4`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9A9A8A]">
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
                className={`${adminInputClass} rounded-2xl pl-12 py-4`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className={`${adminPrimaryButtonClass} w-full justify-center rounded-2xl py-4`}
          >
            {submitting ? (
              <div className="h-5 w-5 rounded-full border-2 border-[#F5F0E8] border-t-transparent animate-spin" />
            ) : (
              <>
                Se connecter
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[#9A9A8A]">
          &copy; {new Date().getFullYear()} AFRIKHER — Tous droits réservés
        </p>
      </div>
      </div>
    </div>
  );
}
