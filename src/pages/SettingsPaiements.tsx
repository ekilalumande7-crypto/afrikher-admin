import React, { useState, useEffect } from 'react';
import { Save, CreditCard, Shield, TestTube, Zap, CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw, Link2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import {
  AdminAlert,
  AdminIconBadge,
  AdminSectionHeader,
  AdminSectionShell,
  adminGhostButtonClass,
  adminInputClass,
  adminPrimaryButtonClass,
} from '../components/AdminPrimitives';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://afrikher-client.vercel.app';

interface FidepayConfig {
  fidepay_access_token_url: string;
  fidepay_make_payment_url: string;
  fidepay_public_key: string;
  fidepay_secret_key: string;
  fidepay_mode: 'live' | 'test';
}

const ALL_KEYS = [
  'fidepay_access_token_url',
  'fidepay_make_payment_url',
  'fidepay_public_key',
  'fidepay_secret_key',
  'fidepay_mode',
];

export default function SettingsPaiements() {
  const [config, setConfig] = useState<FidepayConfig>({
    fidepay_access_token_url: 'https://admin.fide-pay.com/api/merchant/access-token',
    fidepay_make_payment_url: 'https://admin.fide-pay.com/api/merchant/make-payment',
    fidepay_public_key: '',
    fidepay_secret_key: '',
    fidepay_mode: 'live',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('site_config')
        .select('key, value')
        .in('key', ALL_KEYS);

      if (fetchError) throw fetchError;

      const configMap: Record<string, string> = {};
      if (data) {
        for (const row of data) {
          configMap[row.key] = row.value || '';
        }
      }

      setConfig({
        fidepay_access_token_url: configMap['fidepay_access_token_url'] || 'https://admin.fide-pay.com/api/merchant/access-token',
        fidepay_make_payment_url: configMap['fidepay_make_payment_url'] || 'https://admin.fide-pay.com/api/merchant/make-payment',
        fidepay_public_key: configMap['fidepay_public_key'] || '',
        fidepay_secret_key: configMap['fidepay_secret_key'] || '',
        fidepay_mode: (configMap['fidepay_mode'] as 'live' | 'test') || 'live',
      });
    } catch (err) {
      console.error('Error loading FIDEPAY config:', err);
      setError('Impossible de charger la configuration FIDEPAY.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const updates = Object.entries(config).map(([key, value]) => ({ key, value }));

      for (const update of updates) {
        const { error: upsertError } = await supabase
          .from('site_config')
          .upsert(
            { key: update.key, value: update.value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );

        if (upsertError) throw upsertError;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving FIDEPAY config:', err);
      setError('Erreur lors de la sauvegarde. Veuillez reessayer.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);

    try {
      if (!config.fidepay_public_key) {
        setTestResult({ success: false, message: 'La cle publique est requise pour tester la connexion.' });
        return;
      }

      if (!config.fidepay_access_token_url) {
        setTestResult({ success: false, message: "L'URL access-token est requise." });
        return;
      }

      // Call server-side API to avoid CORS issues
      const response = await fetch(`${API_BASE}/api/fidepay/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_key: config.fidepay_public_key,
          access_token_url: config.fidepay_access_token_url,
        }),
      });

      const data = await response.json();
      setTestResult({ success: data.success, message: data.message });
    } catch (err) {
      setTestResult({ success: false, message: 'Impossible de joindre le serveur. Verifiez votre connexion.' });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="h-12 w-64 animate-pulse rounded-lg bg-[#ECE7DF]" />
        <div className="rounded-xl border border-[#E5E0D8] bg-white p-7 shadow-sm">
          <div className="space-y-6">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-[#ECE7DF]" />
            <div className="h-12 animate-pulse rounded-lg bg-[#F5F3EF]" />
            <div className="h-12 animate-pulse rounded-lg bg-[#F5F3EF]" />
            <div className="h-12 animate-pulse rounded-lg bg-[#F5F3EF]" />
            <div className="h-12 animate-pulse rounded-lg bg-[#F5F3EF]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end justify-between gap-6 border-b border-[#0A0A0A]/10 pb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#9A9A8A]">Paramètres financiers</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-[#0A0A0A]">Paiements</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6F675B]">Configurez FIDEPAY pour les transactions live et les tests de connexion.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`${adminPrimaryButtonClass} rounded-xl px-6 py-3 disabled:opacity-50`}
        >
          {saving ? (
            <span className="flex items-center">
              <div className="mr-2 h-4 w-4 rounded-full border-2 border-[#F5F0E8] border-t-transparent animate-spin" />
              Enregistrement...
            </span>
          ) : saved ? (
            <span className="flex items-center">
              <CheckCircle size={18} className="mr-2" />
              Enregistré
            </span>
          ) : (
            <span className="flex items-center">
              <Save size={18} className="mr-2" />
              Enregistrer
            </span>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <AdminAlert tone="error">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-sm">{error}</p>
        </AdminAlert>
      )}

      {/* Mode selector */}
      <AdminSectionShell className="rounded-xl">
        <AdminSectionHeader
          eyebrow="Mode de paiement"
          title="Sandbox ou live"
          description="Activez le bon environnement avant toute mise en production."
          className="rounded-none px-6 py-5"
        />

        <div className="grid grid-cols-2 gap-3 p-6">
          <button
            onClick={() => setConfig({ ...config, fidepay_mode: 'test' })}
            className={cn(
              "rounded-lg border px-5 py-5 text-left transition-all",
              config.fidepay_mode === 'test'
                ? "border-[#0A0A0A] bg-[#0A0A0A] text-[#F5F0E8]"
                : "border-[#E5E0D8] bg-[#F8F6F2] text-[#0A0A0A] hover:border-[#C9A84C]/35"
            )}
          >
            <div className="mb-3 flex items-center space-x-3">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border",
                config.fidepay_mode === 'test'
                  ? "border-[#C9A84C]/35 bg-[#C9A84C]/10 text-[#C9A84C]"
                  : "border-[#E5E0D8] bg-white text-[#9A9A8A]"
              )}>
                <TestTube size={20} />
              </div>
              <div>
                <h4 className={cn("text-sm font-semibold", config.fidepay_mode === 'test' ? "text-[#F5F0E8]" : "text-[#0A0A0A]")}>Sandbox</h4>
                {config.fidepay_mode === 'test' && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">Actif</span>
                )}
              </div>
            </div>
            <p className={cn("text-xs leading-relaxed", config.fidepay_mode === 'test' ? "text-[#D7CFBF]" : "text-[#6F675B]")}>
              Utilisez ce mode pour tester les paiements sans transactions reelles.
            </p>
          </button>

          <button
            onClick={() => setConfig({ ...config, fidepay_mode: 'live' })}
            className={cn(
              "rounded-lg border px-5 py-5 text-left transition-all",
              config.fidepay_mode === 'live'
                ? "border-[#0A0A0A] bg-[#0A0A0A] text-[#F5F0E8]"
                : "border-[#E5E0D8] bg-[#F8F6F2] text-[#0A0A0A] hover:border-[#C9A84C]/35"
            )}
          >
            <div className="mb-3 flex items-center space-x-3">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border",
                config.fidepay_mode === 'live'
                  ? "border-[#C9A84C]/35 bg-[#C9A84C]/10 text-[#C9A84C]"
                  : "border-[#E5E0D8] bg-white text-[#9A9A8A]"
              )}>
                <Zap size={20} />
              </div>
              <div>
                <h4 className={cn("text-sm font-semibold", config.fidepay_mode === 'live' ? "text-[#F5F0E8]" : "text-[#0A0A0A]")}>Live</h4>
                {config.fidepay_mode === 'live' && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">Actif</span>
                )}
              </div>
            </div>
            <p className={cn("text-xs leading-relaxed", config.fidepay_mode === 'live' ? "text-[#D7CFBF]" : "text-[#6F675B]")}>
              Mode de production pour les transactions reelles. Les clients seront debites.
            </p>
          </button>
        </div>
      </AdminSectionShell>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminSectionShell className="rounded-xl">
          <AdminSectionHeader
            eyebrow="Configuration API"
            title="Clés & endpoints"
            description="Renseignez les URL et les clés FIDEPAY nécessaires au fonctionnement du paiement."
            className="rounded-none px-6 py-5"
          />
          <div className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">
              URL Access Token
            </label>
            <input
              type="url"
              value={config.fidepay_access_token_url}
              onChange={(e) => setConfig({ ...config, fidepay_access_token_url: e.target.value })}
              placeholder="https://admin.fide-pay.com/api/merchant/access-token"
              className={`${adminInputClass} rounded-lg p-3 font-mono`}
            />
            <p className="mt-1.5 text-[11px] text-[#9A9A8A]">
              Endpoint pour obtenir le token d'authentification.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">
              URL Make Payment
            </label>
            <input
              type="url"
              value={config.fidepay_make_payment_url}
              onChange={(e) => setConfig({ ...config, fidepay_make_payment_url: e.target.value })}
              placeholder="https://admin.fide-pay.com/api/merchant/make-payment"
              className={`${adminInputClass} rounded-lg p-3 font-mono`}
            />
            <p className="mt-1.5 text-[11px] text-[#9A9A8A]">
              Endpoint pour creer un paiement.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">
                Clé publique
              </label>
              <input
                type="text"
                value={config.fidepay_public_key}
                onChange={(e) => setConfig({ ...config, fidepay_public_key: e.target.value })}
                placeholder="Entrez votre cle publique FIDEPAY..."
                autoComplete="off"
                className={`${adminInputClass} rounded-lg p-3 font-mono`}
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">
                Clé secrète
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={config.fidepay_secret_key}
                  onChange={(e) => setConfig({ ...config, fidepay_secret_key: e.target.value })}
                  placeholder="Entrez votre cle secrete FIDEPAY..."
                  autoComplete="off"
                  className={`${adminInputClass} rounded-lg p-3 pr-12 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A8A] transition-colors hover:text-[#0A0A0A]"
                >
                  {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-[#9A9A8A]">
            Copiez ces informations depuis la page <a href="https://merchant.fide-pay.com/dashboard/api-access-key" target="_blank" rel="noopener noreferrer" className="font-medium text-[#C9A84C] hover:underline">Clé d’accès API</a> de votre dashboard FIDEPAY.
          </p>
          </div>
        </AdminSectionShell>

        <AdminSectionShell className="rounded-xl">
          <AdminSectionHeader
            eyebrow="Vérification"
            title="Tester la connexion"
            description="Vérifiez rapidement si les informations de connexion FIDEPAY répondent correctement."
            className="rounded-none px-6 py-5"
          />
          <div className="space-y-4 p-6">
          <button
            onClick={handleTestConnection}
            disabled={testing || !config.fidepay_public_key}
            className={cn(
              "inline-flex items-center rounded-lg border px-5 py-3 text-sm font-semibold transition-all",
              testing
                ? "border-[#E5E0D8] bg-[#F5F3EF] text-[#9A9A8A]"
                : "border-[#0A0A0A] bg-[#0A0A0A] text-[#F5F0E8] hover:border-[#C9A84C] hover:bg-[#1A1A1A]"
            )}
          >
            {testing ? (
              <>
                <RefreshCw size={18} className="mr-2 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <RefreshCw size={18} className="mr-2" />
                Tester la connexion
              </>
            )}
          </button>

          {testResult && (
            <AdminAlert tone={testResult.success ? 'success' : 'error'}>
              {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="text-sm">{testResult.message}</span>
            </AdminAlert>
          )}
          </div>
        </AdminSectionShell>
      </div>

      <div className="flex items-start gap-4 rounded-lg border border-[#E5E0D8] bg-[#FBF8F2] px-5 py-4">
        <AdminIconBadge icon={Shield} className="h-10 w-10 rounded-lg" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Sécurité</p>
          <p className="mt-2 text-sm leading-relaxed text-[#6F675B]">
            La clé secrète doit rester côté serveur. Les paiements sont traités uniquement via FIDEPAY.
          </p>
        </div>
      </div>
    </div>
  );
}
