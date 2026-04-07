import { useEffect, useState, useCallback } from 'react';
import {
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Mail,
  MapPin,
  Phone,
  Globe,
  MessageCircle,
  ExternalLink,
  Instagram,
  Facebook,
  Linkedin,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AdminAlert,
  AdminFieldRow,
  AdminIconBadge,
  AdminSectionHeader,
  AdminSectionShell,
  AdminToggle,
  adminGhostButtonClass,
  adminInputClass,
  adminPrimaryButtonClass,
  adminTextareaClass,
} from '../components/AdminPrimitives';

interface SiteConfigMap {
  [key: string]: string;
}

type ActiveTab = 'presentation' | 'coordonnees' | 'reseaux' | 'formulaire' | 'options';

function PreviewCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#F1EFEA] bg-[#FBF8F2] p-5">
      <div className="flex items-start gap-4">
        <AdminIconBadge icon={Icon} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">{label}</p>
          <p className="mt-2 break-words text-sm leading-relaxed text-[#0A0A0A]">{value || 'Non renseigné'}</p>
          {helper && <p className="mt-2 text-xs leading-relaxed text-[#9A9A8A]">{helper}</p>}
        </div>
      </div>
    </div>
  );
}

export default function CMSContact() {
  const [config, setConfig] = useState<SiteConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('presentation');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('site_config')
        .select('key, value')
        .or('key.like.contact_%,key.like.social_%');
      if (fetchError) throw fetchError;
      const map: SiteConfigMap = {};
      data?.forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value || '';
      });
      setConfig(map);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = useCallback((key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const toggleConfig = useCallback((key: string) => {
    updateConfig(key, config[key] === 'true' ? 'false' : 'true');
  }, [config, updateConfig]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updates = Object.entries(config).map(([key, value]) => ({
        key,
        value: value || '',
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error: upsertError } = await supabase
          .from('site_config')
          .upsert(update, { onConflict: 'key' });
        if (upsertError) throw upsertError;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4 text-center">
          <RefreshCw size={28} className="animate-spin text-[#C9A84C]" />
          <p className="text-sm uppercase tracking-[0.24em] text-[#9A9A8A]">Chargement des relations</p>
        </div>
      </div>
    );
  }

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'presentation', label: 'Présentation' },
    { id: 'coordonnees', label: 'Coordonnées' },
    { id: 'reseaux', label: 'Réseaux' },
    { id: 'formulaire', label: 'Formulaire' },
    { id: 'options', label: 'Options' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 border-b border-[#0A0A0A]/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#9A9A8A]">Contact & Relations</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none text-[#0A0A0A]">Nous contacter</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9A9A8A]">
            Une question, une collaboration, une opportunité ? Cette page doit transmettre confiance, accessibilité et sérieux dès le premier regard.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://afrikher-client.vercel.app/contact"
            target="_blank"
            rel="noopener noreferrer"
            className={ghostButtonClass}
          >
            <ExternalLink size={16} />
            Voir la page
          </a>
          <button onClick={handleSave} disabled={saving} className={primaryButtonClass}>
            {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error && (
        <AdminAlert tone="error">
          <AlertCircle size={18} className="shrink-0" />
          <span className="text-sm">{error}</span>
        </AdminAlert>
      )}

      {saved && (
        <AdminAlert tone="success">
          <Check size={18} className="shrink-0 text-[#C9A84C]" />
          <span className="text-sm">Les informations de contact ont bien été enregistrées.</span>
        </AdminAlert>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[#F1EFEA] bg-[#FBF8F2] p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`mr-2 inline-flex items-center px-5 py-3 text-sm transition-all ${
              activeTab === tab.id
                ? 'rounded-2xl bg-[#0A0A0A] text-[#F5F0E8]'
                : 'rounded-2xl bg-transparent text-[#7C786E] hover:bg-white hover:text-[#0A0A0A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'presentation' && (
        <AdminSectionShell>
          <AdminSectionHeader
            eyebrow="Tonalité"
            title="Présentation"
            description="Introduisez la relation avec une voix humaine, claire et confiante. Ici, on ne configure pas un formulaire : on cadre une prise de contact."
          />
          <div className="px-8 pb-8">
            <AdminFieldRow label="Badge" description="Petit label au-dessus du hero.">
              <input
                type="text"
                value={config.contact_hero_label || ''}
                onChange={(e) => updateConfig('contact_hero_label', e.target.value)}
                className={`${adminInputClass} max-w-md`}
                placeholder="PRENDRE CONTACT"
              />
            </AdminFieldRow>
            <AdminFieldRow label="Titre" description="Titre principal de la page contact.">
              <input
                type="text"
                value={config.contact_page_title || ''}
                onChange={(e) => updateConfig('contact_page_title', e.target.value)}
                className={`${adminInputClass} font-display text-xl`}
                placeholder="Contact"
              />
            </AdminFieldRow>
            <AdminFieldRow label="Sous-titre" description="Phrase courte juste sous le titre principal.">
              <input
                type="text"
                value={config.contact_page_subtitle || ''}
                onChange={(e) => updateConfig('contact_page_subtitle', e.target.value)}
                className={adminInputClass}
                placeholder="Une question, une collaboration ? Nous sommes à votre écoute."
              />
            </AdminFieldRow>
            <AdminFieldRow label="Label intro" description="Petit label de la colonne éditoriale.">
              <input
                type="text"
                value={config.contact_intro_label || ''}
                onChange={(e) => updateConfig('contact_intro_label', e.target.value)}
                className={`${adminInputClass} max-w-md`}
                placeholder="RESTONS EN CONTACT"
              />
            </AdminFieldRow>
            <AdminFieldRow label="Titre intro" description="Titre narratif du bloc de gauche.">
              <input
                type="text"
                value={config.contact_intro_title || ''}
                onChange={(e) => updateConfig('contact_intro_title', e.target.value)}
                className={`${adminInputClass} font-display text-xl`}
                placeholder="Parlons de votre projet, de votre message ou d'une collaboration."
              />
            </AdminFieldRow>
            <AdminFieldRow label="Texte d’introduction" description="Grand bloc éditorial d’accueil." noBorder>
              <textarea
                value={config.contact_intro_text || ''}
                onChange={(e) => updateConfig('contact_intro_text', e.target.value)}
                rows={6}
                className={`${adminTextareaClass} max-w-3xl`}
                placeholder="AFRIKHER est toujours ouvert aux échanges, collaborations et nouvelles perspectives..."
              />
            </AdminFieldRow>
          </div>
        </AdminSectionShell>
      )}

      {activeTab === 'coordonnees' && (
        <div className="space-y-6">
          <AdminSectionShell>
            <AdminSectionHeader
              eyebrow="Contact direct"
              title="Coordonnées"
              description="Découpez les points de contact pour qu’ils inspirent sérieux et disponibilité. Le WhatsApp mérite ici un traitement un peu plus incarné."
            />
            <div className="px-8 pb-8">
              <AdminFieldRow label="Email" description="Affiché sur la page contact et dans le footer.">
                <div className="space-y-4">
                  <input
                    type="email"
                    value={config.contact_email || ''}
                    onChange={(e) => updateConfig('contact_email', e.target.value)}
                    className={`${adminInputClass} max-w-lg`}
                    placeholder="contact@afrikher.com"
                  />
                  <PreviewCard icon={Mail} label="Email direct" value={config.contact_email || 'contact@afrikher.com'} />
                </div>
              </AdminFieldRow>

              <AdminFieldRow label="Téléphone" description="Numéro affiché sur la page contact.">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={config.contact_phone || ''}
                    onChange={(e) => updateConfig('contact_phone', e.target.value)}
                    className={`${adminInputClass} max-w-lg`}
                    placeholder="+32 xxx xxx xxx"
                  />
                  <PreviewCard icon={Phone} label="Téléphone" value={config.contact_phone || 'Sur rendez-vous'} />
                </div>
              </AdminFieldRow>

              <AdminFieldRow label="WhatsApp" description="Lien du groupe ou du point d’échange WhatsApp.">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#C9A84C]/25 bg-[#FBF7ED] p-5">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[#9A9A8A]">Canal communautaire</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#0A0A0A]">
                      Rejoindre la communauté ou discuter avec l’équipe. Ce bloc doit rester visible sans devenir agressif.
                    </p>
                  </div>
                  <input
                    type="url"
                    value={config.contact_whatsapp || ''}
                    onChange={(e) => updateConfig('contact_whatsapp', e.target.value)}
                    className={`${adminInputClass} max-w-lg`}
                    placeholder="https://chat.whatsapp.com/..."
                  />
                  <PreviewCard
                    icon={MessageCircle}
                    label="WhatsApp"
                    value={config.contact_whatsapp || 'Lien non renseigné'}
                    helper="Rejoindre la communauté / discuter avec l’équipe"
                  />
                </div>
              </AdminFieldRow>

              <AdminFieldRow label="Adresse" description="Adresse principale ou siège de référence." noBorder>
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={config.contact_address_1 || ''}
                      onChange={(e) => updateConfig('contact_address_1', e.target.value)}
                      className={adminInputClass}
                      placeholder="Waterloo, Belgique"
                    />
                    <input
                      type="text"
                      value={config.contact_address_2 || ''}
                      onChange={(e) => updateConfig('contact_address_2', e.target.value)}
                      className={adminInputClass}
                      placeholder="Abidjan, Côte d'Ivoire"
                    />
                    <input
                      type="text"
                      value={config.contact_address_3 || ''}
                      onChange={(e) => updateConfig('contact_address_3', e.target.value)}
                      className={adminInputClass}
                      placeholder="Paris, France"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <PreviewCard
                      icon={MapPin}
                      label="Présence"
                      value={[config.contact_address_1, config.contact_address_2, config.contact_address_3].filter(Boolean).join(' • ') || 'Adresse non renseignée'}
                      helper="L’adresse reste informative. Elle ne doit jamais dominer la relation."
                    />
                  </div>
                </div>
              </AdminFieldRow>
            </div>
          </AdminSectionShell>
        </div>
      )}

      {activeTab === 'reseaux' && (
        <AdminSectionShell>
          <AdminSectionHeader
            eyebrow="Crédibilité"
            title="Réseaux sociaux"
            description="Ici, on ne montre pas une liste brute d’URLs. On montre des points d’ancrage crédibles et cohérents avec la présence AFRIKHER."
          />
          <div className="grid gap-6 px-8 py-8 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                key: 'social_instagram',
                label: 'Instagram',
                placeholder: 'https://instagram.com/afrikher',
                icon: Instagram,
              },
              {
                key: 'social_facebook',
                label: 'Facebook',
                placeholder: 'https://facebook.com/afrikher',
                icon: Facebook,
              },
              {
                key: 'social_linkedin',
                label: 'LinkedIn',
                placeholder: 'https://linkedin.com/company/afrikher',
                icon: Linkedin,
              },
              {
                key: 'contact_website',
                label: 'Site web',
                placeholder: 'https://afrikher.com',
                icon: Globe,
              },
            ].map((network) => {
              const Icon = network.icon;
              const value = config[network.key] || '';

              return (
                <div key={network.key} className="rounded-2xl border border-[#F1EFEA] bg-[#FBF8F2] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#C9A84C]/25 bg-white text-[#C9A84C]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Réseau</p>
                      <h3 className="mt-1 font-display text-2xl font-semibold text-[#0A0A0A]">{network.label}</h3>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={value}
                    onChange={(e) => updateConfig(network.key, e.target.value)}
                    className="mt-5 w-full border border-[#E5E0D8] bg-white px-4 py-3 text-sm text-[#0A0A0A] outline-none transition-all placeholder:text-[#9A9A8A] focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/12"
                    placeholder={network.placeholder}
                  />
                  <div className="mt-4 rounded-2xl border border-[#F1EFEA] bg-white p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Aperçu</p>
                    <p className="mt-2 break-words text-sm leading-relaxed text-[#0A0A0A]">{value || 'Lien non renseigné'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminSectionShell>
      )}

      {activeTab === 'formulaire' && (
        <AdminSectionShell>
          <AdminSectionHeader
            eyebrow="Formulaire"
            title="Structure du formulaire"
            description="Même sans toucher au backend, cette zone doit cadrer l’expérience de contact avec une écriture claire et une promesse de réponse."
          />
          <div className="px-8 pb-8">
            <AdminFieldRow label="Titre du formulaire" description="Titre principal du module de contact.">
              <input
                type="text"
                value={config.contact_help_title || ''}
                onChange={(e) => updateConfig('contact_help_title', e.target.value)}
                className={`${adminInputClass} font-display text-xl`}
                placeholder="Nous vous répondons avec attention."
              />
            </AdminFieldRow>

            <AdminFieldRow label="Description" description="Texte d’accompagnement sous le titre.">
              <textarea
                value={config.contact_help_text || ''}
                onChange={(e) => updateConfig('contact_help_text', e.target.value)}
                rows={4}
                className={`${adminTextareaClass} max-w-3xl`}
                placeholder="Chaque message est lu avec soin..."
              />
            </AdminFieldRow>

            <AdminFieldRow label="Texte du bouton" description="Texte du CTA de contact ou du bloc final.">
              <input
                type="text"
                value={config.contact_cta_label || ''}
                onChange={(e) => updateConfig('contact_cta_label', e.target.value)}
                className={`${adminInputClass} max-w-md`}
                placeholder="Écrire à l'équipe"
              />
            </AdminFieldRow>

            <AdminFieldRow label="Message de succès / lien de sortie" description="Peut servir de lien `mailto:` ou de sortie finale selon l’intégration actuelle." noBorder>
              <input
                type="text"
                value={config.contact_cta_link || ''}
                onChange={(e) => updateConfig('contact_cta_link', e.target.value)}
                className={adminInputClass}
                placeholder="mailto:contact@afrikher.com"
              />
            </AdminFieldRow>
          </div>
        </AdminSectionShell>
      )}

      {activeTab === 'options' && (
        <AdminSectionShell>
          <AdminSectionHeader
            eyebrow="Affichage"
            title="Options"
            description="Toggles sobres pour cadrer la visibilité des blocs de contact. Palette AFRIKHER uniquement."
          />
          <div className="px-8 pb-8">
            {[
              {
                key: 'contact_show_form',
                label: 'Afficher le formulaire',
                description: "Garder visible le bloc de prise de contact principal.",
              },
              {
                key: 'contact_show_whatsapp',
                label: 'Afficher WhatsApp',
                description: 'Montrer le canal communautaire ou conversationnel.',
              },
              {
                key: 'contact_show_email',
                label: 'Afficher l’email',
                description: 'Laisser l’adresse email visible comme point de contact direct.',
              },
            ].map((option, index, arr) => {
              const active = config[option.key] === 'true';

              return (
                <div
                  key={option.key}
                  className={`flex items-center justify-between gap-6 py-6 ${index === arr.length - 1 ? '' : 'border-b border-[#0A0A0A]/8'}`}
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0A0A0A]">{option.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#9A9A8A]">{option.description}</p>
                  </div>
                  <AdminToggle checked={active} onToggle={() => toggleConfig(option.key)} />
                </div>
              );
            })}
          </div>
        </AdminSectionShell>
      )}
    </div>
  );
}
