import { useState, useEffect } from 'react';
import {
  Save,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import {
  AdminAlert,
  AdminIconBadge,
  AdminSectionHeader,
  AdminSectionShell,
  adminInputClass,
  adminPrimaryButtonClass,
} from '../components/AdminPrimitives';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://afrikher-client.vercel.app';

interface BrevoConfig {
  brevo_api_key: string;
  brevo_sender_email: string;
  brevo_sender_name: string;
  brevo_newsletter_list_id: string;
}

const ALL_KEYS = [
  'brevo_api_key',
  'brevo_sender_email',
  'brevo_sender_name',
  'brevo_newsletter_list_id',
];

export default function SettingsEmail() {
  const [config, setConfig] = useState<BrevoConfig>({
    brevo_api_key: '',
    brevo_sender_email: 'noreply@afrikher.com',
    brevo_sender_name: 'AFRIKHER',
    brevo_newsletter_list_id: '2',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);
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
        brevo_api_key: configMap['brevo_api_key'] || '',
        brevo_sender_email: configMap['brevo_sender_email'] || 'noreply@afrikher.com',
        brevo_sender_name: configMap['brevo_sender_name'] || 'AFRIKHER',
        brevo_newsletter_list_id: configMap['brevo_newsletter_list_id'] || '2',
      });
    } catch (err) {
      console.error('Error loading Brevo config:', err);
      setError('Impossible de charger la configuration email.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      // Try direct Supabase upsert first
      let directSaveOk = true;
      const updates = Object.entries(config).map(([key, value]) => ({ key, value }));

      for (const update of updates) {
        const { error: upsertError } = await supabase
          .from('site_config')
          .upsert(
            { key: update.key, value: update.value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );

        if (upsertError) {
          console.warn('Direct upsert failed for', update.key, upsertError);
          directSaveOk = false;
        }
      }

      // Fallback: save via server API (uses service role, bypasses RLS)
      if (!directSaveOk) {
        console.log('Falling back to server-side save...');
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const res = await fetch(`${API_BASE}/api/brevo/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(config),
        });

        if (!res.ok) {
          throw new Error('Fallback save also failed');
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving Brevo config:', err);
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);

    try {
      if (!config.brevo_api_key) {
        setTestResult({ success: false, message: 'La clé API Brevo est requise pour tester.' });
        setTesting(false);
        return;
      }

      // Call the Brevo API to get account info — simplest test
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      // Send config in body so the server can save it via service role (bypasses RLS)
      const res = await fetch(`${API_BASE}/api/brevo/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          brevo_api_key: config.brevo_api_key,
          brevo_sender_email: config.brevo_sender_email,
          brevo_sender_name: config.brevo_sender_name,
          brevo_newsletter_list_id: config.brevo_newsletter_list_id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: data.message || `Connexion réussie. Compte : ${data.email || 'vérifié'}`,
        });
      } else {
        const data = await res.json().catch(() => ({ error: 'Erreur réseau' }));
        setTestResult({
          success: false,
          message: data.error || 'Échec de la connexion.',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Impossible de joindre le serveur.',
      });
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
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A8A]">Paramètres</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-[#0A0A0A]">Emails</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6F675B]">
            Configurez Brevo pour les emails transactionnels et les campagnes newsletter.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`${adminPrimaryButtonClass} !tracking-[0.08em] rounded-xl px-6 py-3 disabled:opacity-50`}
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

      {error && (
        <AdminAlert tone="error">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-sm">{error}</p>
        </AdminAlert>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        {/* API Key + Sender */}
        <AdminSectionShell className="rounded-xl">
          <AdminSectionHeader
            eyebrow="Configuration Brevo"
            title="Clé API & expéditeur"
            description="Renseignez votre clé API Brevo et les informations d'expéditeur."
            className="rounded-none px-6 py-5"
          />
          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9A9A8A]">
                Clé API Brevo
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.brevo_api_key}
                  onChange={(e) => setConfig({ ...config, brevo_api_key: e.target.value })}
                  placeholder="xkeysib-..."
                  autoComplete="off"
                  className={`${adminInputClass} rounded-lg p-3 pr-12 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A8A] transition-colors hover:text-[#0A0A0A]"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-[#9A9A8A]">
                Disponible dans{' '}
                <a
                  href="https://app.brevo.com/settings/keys/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#C9A84C] hover:underline"
                >
                  Brevo → Paramètres → Clés API
                </a>
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9A9A8A]">
                  Email expéditeur
                </label>
                <input
                  type="email"
                  value={config.brevo_sender_email}
                  onChange={(e) => setConfig({ ...config, brevo_sender_email: e.target.value })}
                  placeholder="noreply@afrikher.com"
                  className={`${adminInputClass} rounded-lg p-3`}
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9A9A8A]">
                  Nom expéditeur
                </label>
                <input
                  type="text"
                  value={config.brevo_sender_name}
                  onChange={(e) => setConfig({ ...config, brevo_sender_name: e.target.value })}
                  placeholder="AFRIKHER"
                  className={`${adminInputClass} rounded-lg p-3`}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9A9A8A]">
                ID Liste newsletter
              </label>
              <input
                type="text"
                value={config.brevo_newsletter_list_id}
                onChange={(e) => setConfig({ ...config, brevo_newsletter_list_id: e.target.value })}
                placeholder="2"
                className={`${adminInputClass} rounded-lg p-3 max-w-[120px] font-mono`}
              />
              <p className="mt-1.5 text-[11px] text-[#9A9A8A]">
                L'identifiant de la liste Brevo utilisée pour les campagnes newsletter.
              </p>
            </div>
          </div>
        </AdminSectionShell>

        {/* Test connection */}
        <AdminSectionShell className="rounded-xl">
          <AdminSectionHeader
            eyebrow="Vérification"
            title="Tester la connexion"
            description="Vérifiez que la clé API Brevo est valide et que le compte répond."
            className="rounded-none px-6 py-5"
          />
          <div className="space-y-4 p-6">
            <button
              onClick={handleTestConnection}
              disabled={testing || !config.brevo_api_key}
              className={cn(
                'inline-flex items-center rounded-lg border px-5 py-3 text-sm font-semibold transition-all',
                testing
                  ? 'border-[#E5E0D8] bg-[#F5F3EF] text-[#9A9A8A]'
                  : 'border-[#0A0A0A] bg-[#0A0A0A] text-[#F5F0E8] hover:border-[#C9A84C] hover:bg-[#1A1A1A]'
              )}
            >
              {testing ? (
                <>
                  <RefreshCw size={18} className="mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
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

            <div className="mt-4 space-y-3 border-t border-[#0A0A0A]/8 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9A9A8A]">
                Emails automatiques activés
              </p>
              <ul className="space-y-2 text-sm text-[#6F675B]">
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-[#C9A84C]" />
                  Bienvenue à l'inscription
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-[#C9A84C]" />
                  Confirmation d'abonnement
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-[#C9A84C]" />
                  Confirmation de commande
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-[#C9A84C]" />
                  Réception de soumission partenaire
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-[#C9A84C]" />
                  Bienvenue newsletter
                </li>
              </ul>
            </div>
          </div>
        </AdminSectionShell>
      </div>

      <div className="flex items-start gap-4 rounded-lg border border-[#E5E0D8] bg-[#FBF8F2] px-5 py-4">
        <AdminIconBadge icon={Shield} className="h-10 w-10 rounded-lg" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9A9A8A]">Sécurité</p>
          <p className="mt-2 text-sm leading-relaxed text-[#6F675B]">
            La clé API Brevo est stockée de manière sécurisée et utilisée uniquement côté serveur pour l'envoi des emails.
          </p>
        </div>
      </div>
    </div>
  );
}
