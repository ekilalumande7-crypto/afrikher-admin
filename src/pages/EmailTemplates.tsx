import { useEffect, useState, useCallback } from 'react';
import {
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Mail,
  UserPlus,
  ShoppingBag,
  CreditCard,
  BookOpen,
  Bell,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AdminAlert,
  AdminFieldRow,
  AdminIconBadge,
  AdminSectionHeader,
  AdminSectionShell,
  adminGhostButtonClass,
  adminPrimaryButtonClass,
  adminTextareaClass,
} from '../components/AdminPrimitives';

/* ─────────────────────────────────────────── */
/*  Template definitions                        */
/* ─────────────────────────────────────────── */

type TemplateKey =
  | 'welcome'
  | 'order'
  | 'subscription'
  | 'subscription_cancel'
  | 'newsletter'
  | 'contact'
  | 'submission'
  | 'magazine_purchase';

interface TemplateDef {
  key: TemplateKey;
  label: string;
  description: string;
  icon: typeof Mail;
  variables: string[];
  defaultSubject: string;
  defaultBody: string;
}

const TEMPLATES: TemplateDef[] = [
  {
    key: 'welcome',
    label: 'Inscription',
    description: 'Email envoyé quand un nouveau lecteur crée son compte.',
    icon: UserPlus,
    variables: ['{{nom}}'],
    defaultSubject: 'Bienvenue sur AFRIKHER',
    defaultBody: `Bienvenue, {{nom}}.

Nous sommes ravies de vous accueillir dans l'univers AFRIKHER — le magazine premium dédié au business et au leadership féminin africain.

Votre compte est maintenant actif. Vous pouvez découvrir nos contenus éditoriaux, parcourir notre boutique et rejoindre notre communauté.

À bientôt dans nos pages.`,
  },
  {
    key: 'order',
    label: 'Confirmation de commande',
    description: 'Email envoyé après un achat en boutique.',
    icon: ShoppingBag,
    variables: ['{{nom}}', '{{reference}}', '{{total}}'],
    defaultSubject: 'Confirmation de votre commande — AFRIKHER',
    defaultBody: `Commande confirmée

Merci {{nom}} pour votre commande. Votre paiement a été reçu avec succès.

Référence : {{reference}}
Total : {{total}} EUR

Vous recevrez un email quand votre commande sera expédiée.`,
  },
  {
    key: 'subscription',
    label: 'Abonnement activé',
    description: 'Email envoyé quand un abonnement est activé après paiement.',
    icon: CreditCard,
    variables: ['{{nom}}', '{{plan}}'],
    defaultSubject: 'Abonnement activé — AFRIKHER',
    defaultBody: `Votre abonnement est actif

Félicitations {{nom}} ! Votre abonnement AFRIKHER ({{plan}}) est maintenant actif.

Vous avez désormais accès à l'intégralité de nos contenus premium : articles éditoriaux, interviews exclusives, dossiers et bien plus.

Gérez votre abonnement depuis votre espace membre.`,
  },
  {
    key: 'subscription_cancel',
    label: 'Abonnement désactivé',
    description: 'Email envoyé quand un abonnement est annulé.',
    icon: Bell,
    variables: ['{{nom}}', '{{plan}}'],
    defaultSubject: 'Votre abonnement AFRIKHER a été désactivé',
    defaultBody: `Abonnement désactivé

{{nom}}, votre abonnement AFRIKHER ({{plan}}) a été désactivé.

Vous conservez l'accès à vos contenus jusqu'à la fin de votre période en cours. Après cette date, l'accès aux contenus premium sera suspendu.

Vous pouvez réactiver votre abonnement à tout moment depuis votre espace membre.

Nous espérons vous revoir bientôt.`,
  },
  {
    key: 'newsletter',
    label: 'Bienvenue newsletter',
    description: 'Email envoyé quand quelqu\'un s\'inscrit à la newsletter.',
    icon: Send,
    variables: ['{{nom}}'],
    defaultSubject: 'Bienvenue dans la newsletter AFRIKHER',
    defaultBody: `Vous êtes inscrit(e)

{{nom}}, merci de rejoindre la communauté AFRIKHER.

Vous recevrez nos meilleurs contenus, nos analyses et nos découvertes directement dans votre boîte mail.

Vous pouvez vous désabonner à tout moment.`,
  },
  {
    key: 'contact',
    label: 'Formulaire de contact',
    description: 'Email de confirmation envoyé quand quelqu\'un utilise le formulaire de contact.',
    icon: Mail,
    variables: ['{{nom}}', '{{sujet}}'],
    defaultSubject: 'Nous avons bien reçu votre message — AFRIKHER',
    defaultBody: `Message reçu

{{nom}}, nous avons bien reçu votre message concernant « {{sujet}} ».

Notre équipe vous répondra dans les meilleurs délais, généralement sous 24 à 48 heures.

Merci pour votre intérêt envers AFRIKHER.`,
  },
  {
    key: 'submission',
    label: 'Soumission partenaire',
    description: 'Email envoyé quand un partenaire soumet un contenu.',
    icon: BookOpen,
    variables: ['{{nom}}', '{{titre}}'],
    defaultSubject: 'Soumission reçue — AFRIKHER',
    defaultBody: `Votre contenu a été reçu

Merci {{nom}}. Votre soumission « {{titre}} » a bien été enregistrée.

Notre équipe éditoriale va l'examiner dans les meilleurs délais. Vous recevrez une notification dès que le statut sera mis à jour.

Délai de traitement habituel : 48 à 72 heures.`,
  },
  {
    key: 'magazine_purchase',
    label: 'Achat magazine',
    description: 'Email envoyé après l\'achat d\'un numéro du magazine.',
    icon: BookOpen,
    variables: ['{{nom}}', '{{titre_magazine}}'],
    defaultSubject: 'Votre magazine AFRIKHER est prêt',
    defaultBody: `Achat confirmé

{{nom}}, merci pour votre achat.

Votre exemplaire de {{titre_magazine}} est désormais accessible dans votre espace AFRIKHER.

Cet achat est définitif. Vous pouvez relire votre magazine à tout moment depuis votre compte.`,
  },
];

/* ─────────────────────────────────────────── */
/*  Component                                   */
/* ─────────────────────────────────────────── */

export default function EmailTemplates() {
  const [activeTab, setActiveTab] = useState<TemplateKey>('welcome');
  const [data, setData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  /* ── Load all email template keys from site_config ── */
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rows, error: err } = await supabase
        .from('site_config')
        .select('key, value')
        .like('key', 'email_tpl_%');

      if (err) throw err;

      const map: Record<string, string> = {};
      rows?.forEach((r: { key: string; value: string }) => {
        map[r.key] = r.value || '';
      });
      setData(map);
    } catch (e: any) {
      console.error('Load email templates:', e);
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /* ── Get value with fallback to default ── */
  const getValue = (tplKey: TemplateKey, field: 'subject' | 'body'): string => {
    const siteKey = `email_tpl_${tplKey}_${field}`;
    if (data[siteKey] !== undefined && data[siteKey] !== '') return data[siteKey];
    const tpl = TEMPLATES.find((t) => t.key === tplKey);
    if (!tpl) return '';
    return field === 'subject' ? tpl.defaultSubject : tpl.defaultBody;
  };

  /* ── Update local state ── */
  const updateField = (tplKey: TemplateKey, field: 'subject' | 'body', value: string) => {
    const siteKey = `email_tpl_${tplKey}_${field}`;
    setData((prev) => ({ ...prev, [siteKey]: value }));
    setSaved(false);
  };

  /* ── Save via API (service role bypass RLS) ── */
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const tpl = TEMPLATES.find((t) => t.key === activeTab);
      if (!tpl) return;

      const subjectKey = `email_tpl_${activeTab}_subject`;
      const bodyKey = `email_tpl_${activeTab}_body`;

      const subjectVal = data[subjectKey] || '';
      const bodyVal = data[bodyKey] || '';

      // Use the brevo/test endpoint pattern — save via service role
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const API = import.meta.env.VITE_API_BASE_URL || 'https://afrikher-client.vercel.app';
      const res = await fetch(`${API}/api/admin/site-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          updates: [
            { key: subjectKey, value: subjectVal },
            { key: bodyKey, value: bodyVal },
          ],
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Erreur ${res.status}`);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      console.error('Save email template:', e);
      setError(e.message || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  /* ── Reset to default ── */
  const handleReset = () => {
    const tpl = TEMPLATES.find((t) => t.key === activeTab);
    if (!tpl) return;
    updateField(activeTab, 'subject', tpl.defaultSubject);
    updateField(activeTab, 'body', tpl.defaultBody);
  };

  /* ── Build preview HTML ── */
  const buildPreview = (): string => {
    const subject = getValue(activeTab, 'subject');
    let body = getValue(activeTab, 'body');

    // Replace variables with example values
    body = body
      .replace(/\{\{nom\}\}/g, 'Marie Dupont')
      .replace(/\{\{reference\}\}/g, 'AF-2026-0042')
      .replace(/\{\{total\}\}/g, '24,99')
      .replace(/\{\{plan\}\}/g, 'mensuel')
      .replace(/\{\{sujet\}\}/g, 'Collaboration éditoriale')
      .replace(/\{\{titre\}\}/g, 'Leadership féminin en Afrique de l\'Ouest')
      .replace(/\{\{titre_magazine\}\}/g, 'AFRIKHER N°3 — Spécial Entrepreneuriat');

    // Convert plain text to styled paragraphs
    const paragraphs = body
      .split('\n\n')
      .filter(Boolean)
      .map(
        (p) =>
          `<p style="margin:0 0 16px;color:#F5F0E8;font-size:15px;line-height:1.7">${p.replace(
            /\n/g,
            '<br>'
          )}</p>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
  <tr><td style="padding-bottom:32px;text-align:center">
    <span style="font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:0.2em;color:#C9A84C">AFRIKHER</span>
    <div style="font-size:8px;letter-spacing:0.15em;color:#C9A84C;opacity:0.5;margin-top:4px;text-transform:uppercase">Magazine</div>
  </td></tr>
  <tr><td style="padding-bottom:32px"><div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent)"></div></td></tr>
  <tr><td>
    <p style="font-size:11px;color:#C9A84C;opacity:0.5;margin:0 0 8px;letter-spacing:0.1em;text-transform:uppercase">Objet : ${subject}</p>
    ${paragraphs}
    <table cellpadding="0" cellspacing="0" style="margin:28px 0"><tr><td>
      <span style="display:inline-block;padding:14px 32px;background:#C9A84C;color:#0A0A0A;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase">Bouton d'action</span>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding-top:40px;padding-bottom:24px"><div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C33,transparent)"></div></td></tr>
  <tr><td style="text-align:center;font-size:11px;color:#F5F0E8;opacity:0.3;line-height:1.6">
    AFRIKHER Magazine — L'élégance hors du commun.<br>
    <span style="color:#C9A84C;opacity:0.5">afrikher.com</span>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  };

  const activeTpl = TEMPLATES.find((t) => t.key === activeTab)!;

  if (loading) {
    return (
      <AdminSectionShell>
        <div className="flex items-center justify-center py-32">
          <RefreshCw className="w-5 h-5 animate-spin text-[#C9A84C]" />
        </div>
      </AdminSectionShell>
    );
  }

  return (
    <AdminSectionShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.1em] text-[#C9A84C]/60 mb-1">
            Communication
          </p>
          <h1 className="text-2xl font-serif text-[#1A1A1A]">Templates Email</h1>
          <p className="text-sm text-[#9A9A8A] mt-1">
            Personnalisez le contenu de chaque email automatique envoyé par AFRIKHER.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className={`${adminGhostButtonClass} !tracking-[0.08em]`}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`${adminPrimaryButtonClass} !tracking-[0.08em]`}
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : saved ? (
              <Check className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {saving ? 'Enregistrement...' : saved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error && (
        <AdminAlert variant="error" className="mb-6">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </AdminAlert>
      )}

      {saved && (
        <AdminAlert variant="success" className="mb-6">
          <Check className="w-4 h-4" />
          <span>Template enregistré avec succès.</span>
        </AdminAlert>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-[#E8E4DC] pb-4">
        {TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          const isActive = activeTab === tpl.key;
          return (
            <button
              key={tpl.key}
              onClick={() => {
                setActiveTab(tpl.key);
                setPreviewOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-[0.7rem] tracking-[0.06em] uppercase transition-all rounded-lg ${
                isActive
                  ? 'bg-[#1A1A1A] text-[#F5F0E8]'
                  : 'text-[#9A9A8A] hover:text-[#1A1A1A] hover:bg-[#F5F0E8]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tpl.label}
            </button>
          );
        })}
      </div>

      {/* Active template editor */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left: Editor */}
        <div>
          <AdminSectionHeader
            icon={<AdminIconBadge icon={activeTpl.icon} />}
            title={activeTpl.label}
            subtitle={activeTpl.description}
          />

          <div className="mt-6 space-y-5">
            <AdminFieldRow label="Objet de l'email">
              <input
                type="text"
                value={getValue(activeTab, 'subject')}
                onChange={(e) => updateField(activeTab, 'subject', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#E8E4DC] rounded-xl text-[#1A1A1A] text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-all"
                placeholder="Objet de l'email..."
              />
            </AdminFieldRow>

            <AdminFieldRow label="Contenu du message">
              <textarea
                value={getValue(activeTab, 'body')}
                onChange={(e) => updateField(activeTab, 'body', e.target.value)}
                rows={14}
                className={`${adminTextareaClass} min-h-[300px]`}
                placeholder="Contenu de l'email..."
              />
            </AdminFieldRow>

            {/* Variables info */}
            <div className="bg-[#F5F0E8]/50 border border-[#E8E4DC] rounded-xl p-4">
              <p className="text-[0.65rem] uppercase tracking-[0.1em] text-[#9A9A8A] mb-2">
                Variables disponibles
              </p>
              <div className="flex flex-wrap gap-2">
                {activeTpl.variables.map((v) => (
                  <span
                    key={v}
                    className="px-2.5 py-1 bg-white border border-[#E8E4DC] rounded-lg text-xs text-[#1A1A1A] font-mono"
                  >
                    {v}
                  </span>
                ))}
              </div>
              <p className="text-xs text-[#9A9A8A] mt-2">
                Ces variables seront remplacées automatiquement par les vraies valeurs lors de l'envoi.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.65rem] uppercase tracking-[0.1em] text-[#9A9A8A]">
              Aperçu de l'email
            </p>
            <button
              onClick={() => setPreviewOpen(!previewOpen)}
              className="flex items-center gap-1.5 text-xs text-[#9A9A8A] hover:text-[#1A1A1A] transition-colors"
            >
              {previewOpen ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Masquer
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Afficher
                </>
              )}
            </button>
          </div>

          {previewOpen ? (
            <div className="border border-[#E8E4DC] rounded-xl overflow-hidden bg-[#0A0A0A]">
              <iframe
                srcDoc={buildPreview()}
                title="Aperçu email"
                className="w-full border-0"
                style={{ height: '600px' }}
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div
              className="border border-[#E8E4DC] rounded-xl bg-[#F5F0E8]/30 flex flex-col items-center justify-center py-20 cursor-pointer hover:bg-[#F5F0E8]/50 transition-colors"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="w-8 h-8 text-[#C9A84C]/40 mb-3" />
              <p className="text-sm text-[#9A9A8A]">Cliquez pour afficher l'aperçu</p>
            </div>
          )}
        </div>
      </div>
    </AdminSectionShell>
  );
}
