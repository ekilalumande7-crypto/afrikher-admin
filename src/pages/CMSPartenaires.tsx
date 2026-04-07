import { useEffect, useMemo, useState } from 'react';
import {
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Building2,
  Star,
  Link as LinkIcon,
  Mail,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AdminAlert,
  AdminFieldRow,
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

interface PartnerItem {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  image_url: string;
  company_owner: string;
  role_label: string;
  short_description: string;
  long_description: string;
  website_url: string;
  linkedin_url: string;
  instagram_url: string;
  contact_email: string;
  featured: boolean;
  sort_order: number;
  is_active: boolean;
}

type ActiveTab = 'presentation' | 'partenaires' | 'options';

function parsePartners(raw: string | undefined): { items: PartnerItem[]; error: string | null } {
  if (!raw || !raw.trim()) return { items: [], error: null };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { items: [], error: 'Le contenu JSON de `partners_items` est invalide : un tableau est attendu.' };
    }
    return { items: parsed.map((item: any, index: number) => ({
      id: String(item.id || crypto.randomUUID()),
      name: item.name || '',
      slug: item.slug || '',
      logo_url: item.logo_url || '',
      image_url: item.image_url || item.cover_image || '',
      company_owner: item.company_owner || '',
      role_label: item.role_label || '',
      short_description: item.short_description || '',
      long_description: item.long_description || '',
      website_url: item.website_url || '',
      linkedin_url: item.linkedin_url || '',
      instagram_url: item.instagram_url || '',
      contact_email: item.contact_email || '',
      featured: Boolean(item.featured),
      sort_order: Number.isFinite(item.sort_order) ? item.sort_order : index,
      is_active: item.is_active !== false,
    })), error: null };
  } catch {
    return { items: [], error: 'Le contenu JSON de `partners_items` n’a pas pu être lu. Corrigez la valeur enregistrée dans `site_config`.' };
  }
}

function serializePartners(partners: PartnerItem[]) {
  return JSON.stringify(
    partners.map((partner, index) => ({
      ...partner,
      sort_order: index,
    }))
  );
}

export default function CMSPartenaires() {
  const [config, setConfig] = useState<SiteConfigMap>({});
  const [originalConfig, setOriginalConfig] = useState<SiteConfigMap>({});
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [originalPartners, setOriginalPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('presentation');

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        setError('');
        const { data, error: fetchError } = await supabase
          .from('site_config')
          .select('key, value')
          .like('key', 'partners_%');
        if (fetchError) throw fetchError;

        const map: SiteConfigMap = {};
        data?.forEach((row: { key: string; value: string }) => {
          map[row.key] = row.value || '';
        });

        const parsedPartners = parsePartners(map.partners_items);
        setConfig(map);
        setOriginalConfig(map);
        setPartners(parsedPartners.items);
        setOriginalPartners(parsedPartners.items);
        setJsonError(parsedPartners.error || '');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  const hasChanges = useMemo(() => {
    const configChanged = Object.keys(config).some((key) => config[key] !== originalConfig[key]);
    const partnersChanged = JSON.stringify(partners) !== JSON.stringify(originalPartners);
    return configChanged || partnersChanged;
  }, [config, originalConfig, partners, originalPartners]);

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const toggleConfig = (key: string) => {
    updateConfig(key, config[key] === 'true' ? 'false' : 'true');
  };

  const updatePartner = (id: string, field: keyof PartnerItem, value: string | boolean | number) => {
    setPartners((prev) =>
      prev.map((partner) => (partner.id === id ? { ...partner, [field]: value } : partner))
    );
    setSaved(false);
  };

  const addPartner = () => {
    setPartners((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        slug: '',
        logo_url: '',
        image_url: '',
        company_owner: '',
        role_label: '',
        short_description: '',
        long_description: '',
        website_url: '',
        linkedin_url: '',
        instagram_url: '',
        contact_email: '',
        featured: false,
        sort_order: prev.length,
        is_active: true,
      },
    ]);
    setSaved(false);
  };

  const removePartner = (id: string) => {
    setPartners((prev) => prev.filter((partner) => partner.id !== id));
    setSaved(false);
  };

  const movePartner = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= partners.length) return;
    const clone = [...partners];
    [clone[index], clone[nextIndex]] = [clone[nextIndex], clone[index]];
    setPartners(clone.map((partner, idx) => ({ ...partner, sort_order: idx })));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const updates = {
        ...config,
        partners_items: serializePartners(partners),
      };

      for (const [key, value] of Object.entries(updates)) {
        const { error: upsertError } = await supabase
          .from('site_config')
          .upsert(
            {
              key,
              value: value || '',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          );
        if (upsertError) throw upsertError;
      }

      setOriginalConfig({ ...updates });
      setOriginalPartners(partners);
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
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <RefreshCw size={28} className="animate-spin text-[#C9A84C]" />
          <p className="text-sm uppercase tracking-[0.24em] text-[#9A9A8A]">Chargement du réseau</p>
        </div>
      </div>
    );
  }

  const pageIsActive = config.partners_enabled !== 'false';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 border-b border-[#0A0A0A]/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#9A9A8A]">Réseau & Partenaires</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none text-[#0A0A0A]">Partenaires AFRIKHER</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9A9A8A]">
            Entreprises, marques et institutions qui accompagnent notre vision. Ici, tout doit évoquer la sélection, le niveau et la crédibilité.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://afrikher-client.vercel.app/partenaires"
            target="_blank"
            rel="noopener noreferrer"
            className={ghostButtonClass}
          >
            <ExternalLink size={16} />
            Voir la page
          </a>
          <button onClick={handleSave} disabled={saving || !hasChanges} className={primaryButtonClass}>
            {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Enregistrement...' : saved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error && (
        <AdminAlert tone="error">
          <AlertCircle size={18} className="shrink-0 text-[#7C2D2D]" />
          <p className="flex-1 text-sm text-[#7C2D2D]">{error}</p>
        </AdminAlert>
      )}

      {jsonError && !error && (
        <AdminAlert tone="error">
          <AlertCircle size={18} className="shrink-0 text-[#7C2D2D]" />
          <p className="flex-1 text-sm text-[#7C2D2D]">{jsonError}</p>
        </AdminAlert>
      )}

      {hasChanges && !error && !jsonError && (
        <AdminAlert tone="warning">
          Modifications non enregistrées.
        </AdminAlert>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[#F1EFEA] bg-[#FBF8F2] p-2">
        {[
          { id: 'presentation' as const, label: 'Présentation' },
          { id: 'partenaires' as const, label: 'Partenaires' },
          { id: 'options' as const, label: 'Options' },
        ].map((tab) => (
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
            eyebrow="Positionnement"
            title="Présentation du réseau"
            description="Ce bloc doit se lire comme une introduction institutionnelle. On parle ici d’alliances choisies, pas d’une liste exhaustive."
          />
          <div className="px-8 pb-8">
            <AdminFieldRow label="Badge" description="Petit label au-dessus du hero.">
              <input
                type="text"
                value={config.partners_hero_label || ''}
                onChange={(e) => updateConfig('partners_hero_label', e.target.value)}
                className={`${adminInputClass} max-w-md`}
                placeholder="ÉCOSYSTÈME AFRIKHER"
              />
            </AdminFieldRow>

            <AdminFieldRow label="Titre" description="Titre principal de la page partenaires.">
              <input
                type="text"
                value={config.partners_hero_title || ''}
                onChange={(e) => updateConfig('partners_hero_title', e.target.value)}
                className={`${adminInputClass} max-w-md font-display text-xl`}
                placeholder="Partenaires"
              />
            </AdminFieldRow>

            <AdminFieldRow label="Texte hero" description="Texte éditorial sous le titre principal.">
              <textarea
                value={config.partners_hero_subtitle || ''}
                onChange={(e) => updateConfig('partners_hero_subtitle', e.target.value)}
                rows={4}
                className={adminTextareaClass}
                placeholder="Ensemble, nous bâtissons un écosystème d'excellence..."
              />
            </AdminFieldRow>

            <AdminFieldRow label="Label intro" description="Petit label au-dessus du bloc d’introduction.">
              <input
                type="text"
                value={config.partners_intro_label || ''}
                onChange={(e) => updateConfig('partners_intro_label', e.target.value)}
                className={`${adminInputClass} max-w-md`}
                placeholder="Sélection de partenaires"
              />
            </AdminFieldRow>

            <AdminFieldRow label="Titre intro" description="Titre du bloc d’introduction.">
              <input
                type="text"
                value={config.partners_intro_title || ''}
                onChange={(e) => updateConfig('partners_intro_title', e.target.value)}
                className={`${adminInputClass} font-display text-xl`}
                placeholder="Des alliances construites avec intention"
              />
            </AdminFieldRow>

            <AdminFieldRow label="Texte intro" description="Paragraphe éditorial du bloc d’introduction.">
              <textarea
                value={config.partners_intro_text || ''}
                onChange={(e) => updateConfig('partners_intro_text', e.target.value)}
                rows={5}
                className={adminTextareaClass}
                placeholder="AFRIKHER construit un écosystème avec des partenaires choisis..."
              />
            </AdminFieldRow>

            <AdminFieldRow label="Titre CTA final" description="Titre du bloc d’appel final.">
              <input
                type="text"
                value={config.partners_cta_title || ''}
                onChange={(e) => updateConfig('partners_cta_title', e.target.value)}
                className={`${adminInputClass} font-display text-xl`}
                placeholder="Devenir partenaire"
              />
            </AdminFieldRow>

            <AdminFieldRow label="Texte CTA final" description="Texte du bloc final avant footer.">
              <textarea
                value={config.partners_cta_text || ''}
                onChange={(e) => updateConfig('partners_cta_text', e.target.value)}
                rows={4}
                className={adminTextareaClass}
                placeholder="Vous souhaitez associer votre marque à AFRIKHER..."
              />
            </AdminFieldRow>

            <AdminFieldRow label="Libellé du bouton" description="Texte du CTA final.">
              <input
                type="text"
                value={config.partners_cta_label || ''}
                onChange={(e) => updateConfig('partners_cta_label', e.target.value)}
                className={`${adminInputClass} max-w-md`}
                placeholder="Devenir partenaire"
              />
            </AdminFieldRow>

            <AdminFieldRow label="Lien du bouton" description="Lien du CTA final." noBorder>
              <input
                type="text"
                value={config.partners_cta_link || ''}
                onChange={(e) => updateConfig('partners_cta_link', e.target.value)}
                className={adminInputClass}
                placeholder="/contact"
              />
            </AdminFieldRow>
          </div>
        </AdminSectionShell>
      )}

      {activeTab === 'partenaires' && (
        <div className="space-y-6">
          <AdminSectionShell>
            <AdminSectionHeader
              eyebrow="Sélection"
              title="Liste des partenaires"
              description="Chaque fiche doit ressembler à une carte de réseau premium. On hiérarchise le logo, le nom, le rôle et le niveau de relation."
            />
            <div className="flex items-center justify-between px-8 py-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Réseau actif</p>
                <p className="mt-2 text-sm text-[#9A9A8A]">{partners.length} partenaire(s) configuré(s)</p>
              </div>
              <button onClick={addPartner} className={primaryButtonClass}>
                <Plus size={16} />
                Ajouter un partenaire
              </button>
            </div>
          </AdminSectionShell>

          <div className="grid gap-6">
            {partners.map((partner, index) => (
              <AdminSectionShell key={partner.id}>
                <div className={`border-b px-8 py-6 ${partner.featured ? 'border-[#C9A84C]/25 bg-[#FBF7ED]' : 'border-[#0A0A0A]/8 bg-[#FBF8F2]'}`}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-5">
                      <div className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border ${partner.featured ? 'border-[#C9A84C]/30 bg-white' : 'border-[#F1EFEA] bg-white'}`}>
                        {partner.logo_url ? (
                          <img src={partner.logo_url} alt={partner.name} className="h-full w-full object-contain p-3" />
                        ) : (
                          <Building2 size={28} className="text-[#9A9A8A]" />
                        )}
                      </div>
                      <div className="max-w-2xl">
                        <div className="flex flex-wrap items-center gap-3">
                          {partner.featured && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#C9A84C]">
                              <Star size={12} />
                              Partenaire clé
                            </span>
                          )}
                          {!partner.is_active && (
                            <span className="inline-flex rounded-full border border-[#0A0A0A]/12 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#9A9A8A]">
                              Masqué
                            </span>
                          )}
                        </div>
                        <h3 className="mt-4 font-display text-3xl font-semibold text-[#0A0A0A]">
                          {partner.name || `Partenaire ${index + 1}`}
                        </h3>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-[#9A9A8A]">
                          {partner.role_label || 'Rôle à définir'}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-[#0A0A0A]">
                          {partner.short_description || 'Ajoutez ici une courte présentation qui positionne le partenaire avec clarté.'}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#9A9A8A]">
                          {partner.website_url && (
                            <span className="inline-flex items-center gap-2">
                              <LinkIcon size={14} className="text-[#C9A84C]" />
                              {partner.website_url}
                            </span>
                          )}
                          {partner.contact_email && (
                            <span className="inline-flex items-center gap-2">
                              <Mail size={14} className="text-[#C9A84C]" />
                              {partner.contact_email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => movePartner(index, -1)}
                        className="rounded-2xl bg-[#F5F3EF] p-2 text-[#7C786E] transition hover:bg-[#ECE7DF] hover:text-[#0A0A0A]"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => movePartner(index, 1)}
                        className="rounded-2xl bg-[#F5F3EF] p-2 text-[#7C786E] transition hover:bg-[#ECE7DF] hover:text-[#0A0A0A]"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={() => removePartner(partner.id)}
                        className="rounded-2xl bg-[#F5F3EF] p-2 text-[#7C786E] transition hover:bg-[#FBF1F0] hover:text-[#7C2D2D]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-[1.3fr,0.7fr]">
                  <div className="px-8 py-8">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Nom</label>
                        <input
                          type="text"
                          value={partner.name}
                          onChange={(e) => updatePartner(partner.id, 'name', e.target.value)}
                          className={`${adminInputClass} font-display text-xl`}
                          placeholder="Nom de l'entreprise"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Slug</label>
                        <input
                          type="text"
                          value={partner.slug}
                          onChange={(e) => updatePartner(partner.id, 'slug', e.target.value)}
                          className={adminInputClass}
                          placeholder="slug"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Responsable</label>
                        <input
                          type="text"
                          value={partner.company_owner}
                          onChange={(e) => updatePartner(partner.id, 'company_owner', e.target.value)}
                          className={adminInputClass}
                          placeholder="Responsable / fondateur"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Rôle / statut</label>
                        <input
                          type="text"
                          value={partner.role_label}
                          onChange={(e) => updatePartner(partner.id, 'role_label', e.target.value)}
                          className={adminInputClass}
                          placeholder="Partenaire officiel, sponsor, partenaire technologique..."
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Logo</label>
                        <input
                          type="text"
                          value={partner.logo_url}
                          onChange={(e) => updatePartner(partner.id, 'logo_url', e.target.value)}
                          className={adminInputClass}
                          placeholder="Logo URL"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Image</label>
                        <input
                          type="text"
                          value={partner.image_url}
                          onChange={(e) => updatePartner(partner.id, 'image_url', e.target.value)}
                          className={adminInputClass}
                          placeholder="Image / cover URL"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Description courte</label>
                        <textarea
                          value={partner.short_description}
                          onChange={(e) => updatePartner(partner.id, 'short_description', e.target.value)}
                          rows={3}
                          className={adminTextareaClass}
                          placeholder="Description courte"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Description longue</label>
                        <textarea
                          value={partner.long_description}
                          onChange={(e) => updatePartner(partner.id, 'long_description', e.target.value)}
                          rows={4}
                          className={adminTextareaClass}
                          placeholder="Description longue"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-l border-[#F1EFEA] bg-[#FBF8F2] px-8 py-8">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Site web</label>
                        <input
                          type="text"
                          value={partner.website_url}
                          onChange={(e) => updatePartner(partner.id, 'website_url', e.target.value)}
                          className={adminInputClass}
                          placeholder="Site web"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Email</label>
                        <input
                          type="email"
                          value={partner.contact_email}
                          onChange={(e) => updatePartner(partner.id, 'contact_email', e.target.value)}
                          className={adminInputClass}
                          placeholder="Email de contact"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">LinkedIn</label>
                        <input
                          type="text"
                          value={partner.linkedin_url}
                          onChange={(e) => updatePartner(partner.id, 'linkedin_url', e.target.value)}
                          className={adminInputClass}
                          placeholder="LinkedIn URL"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Instagram</label>
                        <input
                          type="text"
                          value={partner.instagram_url}
                          onChange={(e) => updatePartner(partner.id, 'instagram_url', e.target.value)}
                          className={adminInputClass}
                          placeholder="Instagram URL"
                        />
                      </div>

                      <div className="space-y-4 rounded-2xl border border-[#F1EFEA] bg-white p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Mise en avant</p>
                            <p className="mt-2 text-sm leading-relaxed text-[#0A0A0A]">Signale un partenaire clé ou à la une.</p>
                          </div>
                          <AdminToggle checked={partner.featured} onToggle={() => updatePartner(partner.id, 'featured', !partner.featured)} />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Visible</p>
                            <p className="mt-2 text-sm leading-relaxed text-[#0A0A0A]">Afficher ou masquer ce partenaire.</p>
                          </div>
                          <AdminToggle checked={partner.is_active} onToggle={() => updatePartner(partner.id, 'is_active', !partner.is_active)} />
                        </div>

                        <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 p-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-[#C9A84C]">Statut prestige</p>
                          <p className="mt-2 text-sm leading-relaxed text-[#6D5622]">
                            {partner.featured ? 'Partenaire mis en avant dans la sélection.' : 'Partenaire standard dans la sélection.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AdminSectionShell>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'options' && (
        <AdminSectionShell>
          <AdminSectionHeader
            eyebrow="Affichage"
            title="Options"
            description="Paramètres globaux de la section partenaires. On garde ici une logique sobre et institutionnelle."
          />
          <div className="px-8 pb-8">
            <div className="flex items-center justify-between gap-6 border-b border-[#0A0A0A]/8 py-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0A0A0A]">Page active</p>
                <p className="mt-2 text-sm leading-relaxed text-[#9A9A8A]">Activer ou désactiver la page publique partenaires.</p>
              </div>
              <AdminToggle checked={pageIsActive} onToggle={() => toggleConfig('partners_enabled')} />
            </div>

            <div className="grid gap-6 py-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#F1EFEA] bg-[#FBF8F2] p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">État</p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-[#0A0A0A]">
                  {pageIsActive ? 'Page visible' : 'Page masquée'}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9A9A8A]">
                  {pageIsActive
                    ? 'Le réseau AFRIKHER est actuellement accessible côté public.'
                    : 'La page partenaires reste masquée tant que vous ne la réactivez pas.'}
                </p>
              </div>

              <div className="rounded-2xl border border-[#F1EFEA] bg-white p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Synthèse</p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-[#0A0A0A]">{partners.filter((partner) => partner.is_active).length} partenaires actifs</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9A9A8A]">
                  {partners.filter((partner) => partner.featured).length} partenaire(s) clé(s) mis en avant dans la sélection.
                </p>
              </div>
            </div>
          </div>
        </AdminSectionShell>
      )}
    </div>
  );
}
