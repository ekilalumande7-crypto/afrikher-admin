import React, { useState, useEffect } from 'react';
import { Save, CreditCard, Shield, TestTube, Zap, CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw, Link2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

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
        <div className="h-12 bg-gray-100 rounded-2xl w-64 animate-pulse" />
        <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm">
          <div className="space-y-6">
            <div className="h-6 bg-gray-100 rounded-xl w-48 animate-pulse" />
            <div className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-sans font-bold text-slate-900">Paiements</h1>
          <p className="text-gray-400 text-sm mt-1">Configurez votre integration FIDEPAY pour recevoir les paiements.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-8 py-3.5 bg-white text-slate-900 rounded-2xl hover:bg-slate-100 transition-all font-bold tracking-wide shadow-lg shadow-slate-200 disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center">
              <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin mr-2" />
              Enregistrement...
            </span>
          ) : saved ? (
            <span className="flex items-center">
              <CheckCircle size={20} className="mr-2 text-green-400" />
              Enregistre !
            </span>
          ) : (
            <span className="flex items-center">
              <Save size={20} className="mr-2 text-green-600" />
              Enregistrer
            </span>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center space-x-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Mode selector */}
      <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-6">
        <div className="border-b border-gray-50 pb-6">
          <h3 className="text-xl font-sans font-bold text-slate-900">Mode de paiement</h3>
          <p className="text-sm text-gray-400 mt-1">Choisissez entre le mode test (sandbox) et le mode production (live).</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setConfig({ ...config, fidepay_mode: 'test' })}
            className={cn(
              "p-6 rounded-2xl border-2 transition-all text-left",
              config.fidepay_mode === 'test'
                ? "border-gold bg-green-50"
                : "border-gray-100 hover:border-gray-200"
            )}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                config.fidepay_mode === 'test' ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
              )}>
                <TestTube size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Mode Test (Sandbox)</h4>
                {config.fidepay_mode === 'test' && (
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Actif</span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Utilisez ce mode pour tester les paiements sans transactions reelles.
            </p>
          </button>

          <button
            onClick={() => setConfig({ ...config, fidepay_mode: 'live' })}
            className={cn(
              "p-6 rounded-2xl border-2 transition-all text-left",
              config.fidepay_mode === 'live'
                ? "border-green-500 bg-green-50"
                : "border-gray-100 hover:border-gray-200"
            )}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                config.fidepay_mode === 'live' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
              )}>
                <Zap size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Mode Production (Live)</h4>
                {config.fidepay_mode === 'live' && (
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Actif</span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Mode de production pour les transactions reelles. Les clients seront debites.
            </p>
          </button>
        </div>
      </div>

      {/* API URLs */}
      <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-6">
        <div className="border-b border-gray-50 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
              <Link2 size={20} />
            </div>
            <div>
              <h3 className="text-xl font-sans font-bold text-slate-900">URLs API FIDEPAY</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Copiez les URLs depuis la page{' '}
                <a href="https://merchant.fide-pay.com/dashboard/api-access-key" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">
                  Cle d'acces API
                </a>
                {' '}de votre dashboard FIDEPAY.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Access Token URL */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
              URL Access Token
            </label>
            <input
              type="url"
              value={config.fidepay_access_token_url}
              onChange={(e) => setConfig({ ...config, fidepay_access_token_url: e.target.value })}
              placeholder="https://admin.fide-pay.com/api/merchant/access-token"
              className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-mono outline-none focus:ring-2 focus:ring-green-500/20 placeholder:text-gray-300"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Endpoint pour obtenir le token d'authentification.
            </p>
          </div>

          {/* Make Payment URL */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
              URL Make Payment
            </label>
            <input
              type="url"
              value={config.fidepay_make_payment_url}
              onChange={(e) => setConfig({ ...config, fidepay_make_payment_url: e.target.value })}
              placeholder="https://admin.fide-pay.com/api/merchant/make-payment"
              className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-mono outline-none focus:ring-2 focus:ring-green-500/20 placeholder:text-gray-300"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Endpoint pour creer un paiement.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-6">
        <div className="border-b border-gray-50 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-xl font-sans font-bold text-slate-900">Cles API FIDEPAY</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Obtenez vos cles depuis votre{' '}
                <a href="https://merchant.fide-pay.com/dashboard/api-access-key" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">
                  dashboard FIDEPAY
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Public Key */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
              Cle publique (Public Key)
            </label>
            <input
              type="text"
              value={config.fidepay_public_key}
              onChange={(e) => setConfig({ ...config, fidepay_public_key: e.target.value })}
              placeholder="Entrez votre cle publique FIDEPAY..."
              autoComplete="off"
              className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-mono outline-none focus:ring-2 focus:ring-green-500/20 placeholder:text-gray-300"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Utilisee pour obtenir le token d'acces.
            </p>
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
              Cle secrete (Secret Key)
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={config.fidepay_secret_key}
                onChange={(e) => setConfig({ ...config, fidepay_secret_key: e.target.value })}
                placeholder="Entrez votre cle secrete FIDEPAY..."
                autoComplete="off"
                className="w-full p-4 pr-12 bg-gray-50 border-none rounded-2xl text-sm font-mono outline-none focus:ring-2 focus:ring-green-500/20 placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-900 transition-colors"
              >
                {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Utilisee pour verifier les signatures des webhooks (IPN). Ne jamais exposer cote client.
            </p>
          </div>
        </div>
      </div>

      {/* Test connection */}
      <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-6">
        <div className="border-b border-gray-50 pb-6">
          <h3 className="text-xl font-sans font-bold text-slate-900">Tester la connexion</h3>
          <p className="text-sm text-gray-400 mt-1">Verifiez que vos cles API fonctionnent correctement.</p>
        </div>

        <div className="flex items-center space-x-4 flex-wrap gap-y-3">
          <button
            onClick={handleTestConnection}
            disabled={testing || !config.fidepay_public_key}
            className={cn(
              "flex items-center px-6 py-3 rounded-2xl font-bold text-sm transition-all",
              testing
                ? "bg-gray-100 text-gray-400"
                : "bg-green-50 text-green-600 hover:bg-green-600/20"
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
            <div className={cn(
              "flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium",
              testResult.success
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            )}>
              {testResult.success
                ? <CheckCircle size={16} />
                : <AlertCircle size={16} />
              }
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Security notice */}
      <div className="bg-green-50 p-8 rounded-[32px] border border-gold/10 flex items-start space-x-6">
        <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-slate-900 shrink-0">
          <Shield size={24} />
        </div>
        <div>
          <h4 className="text-lg font-sans font-bold text-slate-900">Securite</h4>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Vos cles API sont stockees de maniere securisee dans la base de donnees. La cle secrete n'est jamais exposee cote client.
            Les paiements sont traites exclusivement par FIDEPAY, qui integre Stripe et Mobile Money.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-gray-500 border border-gray-100">Visa / Mastercard</span>
            <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-gray-500 border border-gray-100">Orange Money</span>
            <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-gray-500 border border-gray-100">M-Pesa</span>
            <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-gray-500 border border-gray-100">Airtel Money</span>
            <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-gray-500 border border-gray-100">QR Code</span>
          </div>
        </div>
      </div>
    </div>
  );
}
