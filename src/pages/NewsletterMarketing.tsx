import { useEffect, useState, useCallback } from 'react';
import {
  Send,
  Users,
  Mail,
  RefreshCw,
  Check,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AdminSectionShell,
  AdminSectionHeader,
  AdminFieldRow,
  AdminAlert,
  adminInputClass,
  adminTextareaClass,
  adminGhostButtonClass,
  adminPrimaryButtonClass,
} from '../components/AdminPrimitives';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://afrikher-client.vercel.app';

interface Subscriber {
  id: string;
  email: string;
  full_name: string | null;
  active: boolean;
  subscribed_at: string;
}

interface Campaign {
  id: string;
  subject: string;
  preview_text: string | null;
  status: 'draft' | 'sent';
  sent_at: string | null;
  recipient_count: number | null;
  created_at: string;
}

type Tab = 'subscribers' | 'campaigns' | 'compose';

export default function NewsletterMarketing() {
  const [tab, setTab] = useState<Tab>('subscribers');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [activeSubscribers, setActiveSubscribers] = useState(0);
  const [loading, setLoading] = useState(true);

  // Compose state
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch subscribers
      const { data: subs, count: totalCount } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact' })
        .order('subscribed_at', { ascending: false });

      if (subs) {
        setSubscribers(subs);
        setTotalSubscribers(totalCount || subs.length);
        setActiveSubscribers(subs.filter((s: Subscriber) => s.active).length);
      }

      // Fetch campaigns
      const { data: camps } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (camps) setCampaigns(camps);
    } catch (err) {
      console.error('Failed to fetch newsletter data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function buildHtmlContent(): string {
    const paragraphs = bodyText
      .split('\n\n')
      .filter(Boolean)
      .map((p) => `<p style="margin:0 0 18px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#2A2A2A;">${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background-color:#0A0A0A;padding:32px 40px;text-align:center;">
    <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;letter-spacing:0.15em;color:#C9A84C;">AFRIKHER</span>
    <span style="display:inline-block;margin-left:10px;border:1px solid rgba(201,168,76,0.3);padding:2px 6px;font-size:8px;letter-spacing:0.12em;color:rgba(201,168,76,0.7);font-family:'DM Sans',sans-serif;text-transform:uppercase;">Magazine</span>
  </td></tr>
  <tr><td style="background-color:#FFFFFF;padding:40px 40px 32px;">
    <h1 style="margin:0 0 24px;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:#0A0A0A;line-height:1.3;">${subject}</h1>
    ${paragraphs}
  </td></tr>
  <tr><td style="background-color:#0A0A0A;padding:28px 40px;text-align:center;">
    <p style="margin:0 0 6px;font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;letter-spacing:0.1em;color:#C9A84C;">AFRIKHER</p>
    <p style="margin:0;font-family:'DM Sans',sans-serif;font-size:11px;color:rgba(245,240,232,0.4);">L'élégance hors du commun. Le Business au féminin.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }

  async function handleSend() {
    if (!subject.trim() || !bodyText.trim()) return;
    setSending(true);
    setSendResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setSendResult({ type: 'error', message: 'Session expirée. Reconnectez-vous.' });
        setSending(false);
        return;
      }

      const htmlContent = buildHtmlContent();

      const res = await fetch(`${API_BASE}/api/admin/newsletter/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: subject.trim(),
          htmlContent,
          listIds: [2],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
        setSendResult({ type: 'error', message: err.error || 'Échec de l\'envoi' });
      } else {
        setSendResult({ type: 'success', message: 'Campagne envoyée avec succès' });
        setSubject('');
        setPreviewText('');
        setBodyText('');
        setShowPreview(false);
        fetchData();
        setTimeout(() => setTab('campaigns'), 2000);
      }
    } catch (err) {
      setSendResult({ type: 'error', message: 'Erreur inattendue' });
    } finally {
      setSending(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ─── Tabs ─────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'subscribers', label: 'Abonnés', icon: <Users size={15} /> },
    { key: 'campaigns', label: 'Campagnes', icon: <Mail size={15} /> },
    { key: 'compose', label: 'Nouvelle campagne', icon: <Send size={15} /> },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]">Marketing</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#0A0A0A]">Newsletter</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#9A9A8A]">
          Gérez vos abonnés et envoyez des campagnes éditoriales.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <AdminSectionShell className="px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A8A]">Total abonnés</p>
          <p className="mt-1 font-display text-2xl font-semibold text-[#0A0A0A]">{totalSubscribers}</p>
        </AdminSectionShell>
        <AdminSectionShell className="px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A8A]">Actifs</p>
          <p className="mt-1 font-display text-2xl font-semibold text-[#0A0A0A]">{activeSubscribers}</p>
        </AdminSectionShell>
        <AdminSectionShell className="px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A8A]">Campagnes envoyées</p>
          <p className="mt-1 font-display text-2xl font-semibold text-[#0A0A0A]">
            {campaigns.filter((c) => c.status === 'sent').length}
          </p>
        </AdminSectionShell>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#0A0A0A]/8">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-all ${
              tab === t.key
                ? 'border-[#C9A84C] text-[#0A0A0A]'
                : 'border-transparent text-[#9A9A8A] hover:text-[#0A0A0A]'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={20} className="animate-spin text-[#C9A84C]" />
        </div>
      ) : (
        <>
          {/* ─── Subscribers ─── */}
          {tab === 'subscribers' && (
            <AdminSectionShell>
              <AdminSectionHeader
                eyebrow="Liste"
                title="Abonnés newsletter"
                description={`${activeSubscribers} abonnés actifs sur ${totalSubscribers} inscrits`}
              />
              <div className="divide-y divide-[#0A0A0A]/6">
                {subscribers.length === 0 ? (
                  <div className="px-8 py-16 text-center">
                    <Users size={32} className="mx-auto mb-4 text-[#C9A84C]/40" />
                    <p className="text-sm text-[#9A9A8A]">Aucun abonné pour le moment.</p>
                  </div>
                ) : (
                  subscribers.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-2 w-2 rounded-full ${sub.active ? 'bg-[#C9A84C]' : 'bg-[#D4D0C8]'}`}
                        />
                        <div>
                          <p className="text-sm font-medium text-[#0A0A0A]">{sub.email}</p>
                          {sub.full_name && (
                            <p className="text-xs text-[#9A9A8A]">{sub.full_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-[10px] uppercase tracking-[0.12em] ${
                            sub.active ? 'text-[#C9A84C]' : 'text-[#9A9A8A]'
                          }`}
                        >
                          {sub.active ? 'Actif' : 'Désabonné'}
                        </span>
                        <span className="text-xs text-[#9A9A8A]">
                          {formatDate(sub.subscribed_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AdminSectionShell>
          )}

          {/* ─── Campaigns ─── */}
          {tab === 'campaigns' && (
            <AdminSectionShell>
              <AdminSectionHeader
                eyebrow="Historique"
                title="Campagnes envoyées"
                description="Toutes les campagnes newsletter envoyées depuis l'administration."
              />
              <div className="divide-y divide-[#0A0A0A]/6">
                {campaigns.length === 0 ? (
                  <div className="px-8 py-16 text-center">
                    <Mail size={32} className="mx-auto mb-4 text-[#C9A84C]/40" />
                    <p className="text-sm text-[#9A9A8A]">Aucune campagne envoyée.</p>
                    <button
                      onClick={() => setTab('compose')}
                      className={`${adminGhostButtonClass} mt-4 !tracking-[0.08em]`}
                    >
                      <Send size={14} /> Créer une campagne
                    </button>
                  </div>
                ) : (
                  campaigns.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-8 py-5">
                      <div>
                        <p className="text-sm font-medium text-[#0A0A0A]">{c.subject}</p>
                        {c.preview_text && (
                          <p className="mt-1 text-xs text-[#9A9A8A] line-clamp-1">{c.preview_text}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] ${
                            c.status === 'sent' ? 'text-[#C9A84C]' : 'text-[#9A9A8A]'
                          }`}
                        >
                          {c.status === 'sent' ? <Check size={12} /> : <Clock size={12} />}
                          {c.status === 'sent' ? 'Envoyée' : 'Brouillon'}
                        </span>
                        <span className="text-xs text-[#9A9A8A]">
                          {c.sent_at ? formatDateTime(c.sent_at) : formatDate(c.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AdminSectionShell>
          )}

          {/* ─── Compose ─── */}
          {tab === 'compose' && (
            <div className="space-y-6">
              {sendResult && (
                <AdminAlert tone={sendResult.type === 'success' ? 'success' : 'error'}>
                  {sendResult.message}
                </AdminAlert>
              )}

              <AdminSectionShell>
                <AdminSectionHeader
                  eyebrow="Rédaction"
                  title="Nouvelle campagne"
                  description="Rédigez votre newsletter en texte simple. Elle sera mise en forme avec le design AFRIKHER."
                />
                <div className="space-y-0 px-8 pb-8">
                  <AdminFieldRow label="Objet" description="Le sujet qui apparaîtra dans la boîte de réception.">
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={adminInputClass}
                      placeholder="Ex : AFRIKHER — Édition de mai 2026"
                    />
                  </AdminFieldRow>

                  <AdminFieldRow label="Aperçu" description="Court texte visible avant l'ouverture (optionnel)." noBorder>
                    <input
                      type="text"
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      className={adminInputClass}
                      placeholder="Ex : Découvrez les portraits de ce mois..."
                    />
                  </AdminFieldRow>
                </div>
              </AdminSectionShell>

              <AdminSectionShell>
                <AdminSectionHeader
                  eyebrow="Contenu"
                  title="Corps de la newsletter"
                  description="Écrivez en texte simple. Séparez les paragraphes par une ligne vide."
                />
                <div className="px-8 pb-8 pt-6">
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    rows={14}
                    className={`${adminTextareaClass} min-h-[300px]`}
                    placeholder={`Chères lectrices,\n\nCe mois-ci, AFRIKHER vous emmène à la rencontre de femmes qui transforment le continent...\n\nDans ce numéro :\n• Portrait de Fatou Diallo, pionnière de la FinTech\n• Dossier : Entreprendre avec style\n• Start-up Stories : trois parcours inspirants\n\nBonne lecture,\nL'équipe AFRIKHER`}
                  />
                </div>
              </AdminSectionShell>

              {/* Preview toggle */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`${adminGhostButtonClass} !tracking-[0.08em]`}
              >
                <Eye size={14} />
                {showPreview ? 'Masquer l\'aperçu' : 'Aperçu de l\'email'}
                {showPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showPreview && bodyText.trim() && (
                <AdminSectionShell className="overflow-hidden">
                  <div className="border-b border-[#0A0A0A]/8 bg-[#FBF8F2] px-6 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A8A]">Aperçu du rendu</p>
                  </div>
                  <div className="bg-[#F5F0E8] p-6">
                    <div
                      className="mx-auto max-w-[600px] shadow-lg"
                      dangerouslySetInnerHTML={{ __html: buildHtmlContent() }}
                    />
                  </div>
                </AdminSectionShell>
              )}

              {/* Send button */}
              <div className="flex items-center justify-between border-t border-[#0A0A0A]/8 pt-6">
                <p className="text-xs text-[#9A9A8A]">
                  Destinataires : {activeSubscribers} abonnés actifs
                </p>
                <button
                  onClick={handleSend}
                  disabled={sending || !subject.trim() || !bodyText.trim()}
                  className={`${adminPrimaryButtonClass} !tracking-[0.08em]`}
                >
                  {sending ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  {sending ? 'Envoi en cours...' : 'Envoyer la campagne'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
