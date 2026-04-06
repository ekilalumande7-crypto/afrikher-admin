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
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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

const DEFAULT_PARTNERS: PartnerItem[] = [
  {
    id: 'technovolit-innovation',
    name: 'TECHNOVOLIT INNOVATION',
    slug: 'technovolit-innovation',
    logo_url: '',
    image_url: '',
    company_owner: 'Christian Antamba',
    role_label: 'Partenaire technologique',
    short_description: 'Infrastructures, solutions digitales et innovation pour les entreprises.',
    long_description:
      "TechnoVolit Innovation accompagne la conception d'infrastructures numeriques, de solutions digitales et de dispositifs d'innovation pour les entreprises, institutions et projets ambitieux.",
    website_url: '',
    linkedin_url: '',
    instagram_url: '',
    contact_email: '',
    featured: true,
    sort_order: 0,
    is_active: true,
  },
  {
    id: 'fidpay',
    name: 'FIDPAY',
    slug: 'fidpay',
    logo_url: '',
    image_url: '',
    company_owner: 'Christian Antamba',
    role_label: 'Partenaire paiement',
    short_description: 'Solution de paiement securisee pour particuliers, entreprises et diaspora.',
    long_description:
      'FidPay propose des solutions de paiement fiables, modernes et accessibles, pensees pour simplifier les transactions locales et internationales.',
    website_url: '',
    linkedin_url: '',
    instagram_url: '',
    contact_email: '',
    featured: true,
    sort_order: 1,
    is_active: true,
  },
];

function parsePartners(raw: string | undefined): PartnerItem[] {
  if (!raw) return DEFAULT_PARTNERS;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_PARTNERS;
    return parsed.map((item: any, index: number) => ({
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
    }));
  } catch {
    return DEFAULT_PARTNERS;
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

function FieldRow({
  label,
  description,
  children,
  noBorder,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <div className={`py-6 ${noBorder ? '' : 'border-b border-gray-100'}`}>
      <div className="flex items-start justify-between gap-8">
        <div className="w-72 shrink-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
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
  const [activeTab, setActiveTab] = useState<'general' | 'partners'>('general');

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
        setPartners(parsedPartners);
        setOriginalPartners(parsedPartners);
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
        <RefreshCw size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page Partenaires</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez la narration de page et la liste des partenaires affichés sur le site.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://afrikher-client.vercel.app/partenaires"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ExternalLink size={16} className="mr-2" />
            Voir la page
          </a>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              hasChanges
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : saved
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : saved ? (
              <>
                <Check size={14} className="mr-2" />
                Enregistré
              </>
            ) : (
              <>
                <Save size={14} className="mr-2" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <p className="flex-1 text-sm text-red-700">{error}</p>
        </div>
      )}

      {hasChanges && !error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Modifications non enregistrées.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex min-h-[680px]">
          <nav className="w-52 shrink-0 border-r border-gray-200 py-4">
            {[
              { id: 'general', label: 'Paramètres de page' },
              { id: 'partners', label: 'Liste des partenaires' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'general' | 'partners')}
                className={`w-full px-6 py-2.5 text-left text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50 font-medium border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 px-10 py-6">
            {activeTab === 'general' && (
              <div>
                <h2 className="mb-1 text-lg font-bold text-gray-900">Paramètres de page</h2>
                <p className="mb-6 text-sm text-gray-500">
                  Textes éditoriaux, activation de page et appel final à devenir partenaire.
                </p>

                <FieldRow label="Page active" description="Activer ou désactiver la page publique partenaires.">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        updateConfig('partners_enabled', config.partners_enabled === 'false' ? 'true' : 'false')
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.partners_enabled === 'false' ? 'bg-gray-300' : 'bg-green-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.partners_enabled === 'false' ? 'translate-x-1' : 'translate-x-6'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-600">
                      {config.partners_enabled === 'false' ? 'Désactivée' : 'Active'}
                    </span>
                  </div>
                </FieldRow>

                <FieldRow label="Label hero" description="Petit label au-dessus du titre principal.">
                  <input
                    type="text"
                    value={config.partners_hero_label || ''}
                    onChange={(e) => updateConfig('partners_hero_label', e.target.value)}
                    className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ÉCOSYSTÈME AFRIKHER"
                  />
                </FieldRow>

                <FieldRow label="Titre hero" description="Titre principal de la page partenaires.">
                  <input
                    type="text"
                    value={config.partners_hero_title || ''}
                    onChange={(e) => updateConfig('partners_hero_title', e.target.value)}
                    className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Partenaires"
                  />
                </FieldRow>

                <FieldRow label="Sous-titre hero" description="Texte éditorial sous le titre principal.">
                  <textarea
                    value={config.partners_hero_subtitle || ''}
                    onChange={(e) => updateConfig('partners_hero_subtitle', e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Ensemble, nous bâtissons un écosystème d'excellence..."
                  />
                </FieldRow>

                <FieldRow label="Label intro" description="Petit label au-dessus du bloc d'introduction.">
                  <input
                    type="text"
                    value={config.partners_intro_label || ''}
                    onChange={(e) => updateConfig('partners_intro_label', e.target.value)}
                    className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Sélection de partenaires"
                  />
                </FieldRow>

                <FieldRow label="Titre intro" description="Titre du bloc d'introduction au-dessus de la grille.">
                  <input
                    type="text"
                    value={config.partners_intro_title || ''}
                    onChange={(e) => updateConfig('partners_intro_title', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Des alliances construites avec intention"
                  />
                </FieldRow>

                <FieldRow label="Texte intro" description="Paragraphe éditorial du bloc d'introduction.">
                  <textarea
                    value={config.partners_intro_text || ''}
                    onChange={(e) => updateConfig('partners_intro_text', e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="AFRIKHER construit un écosystème avec des partenaires choisis..."
                  />
                </FieldRow>

                <FieldRow label="Titre CTA final" description="Titre du bloc final avant footer." >
                  <input
                    type="text"
                    value={config.partners_cta_title || ''}
                    onChange={(e) => updateConfig('partners_cta_title', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Devenir partenaire"
                  />
                </FieldRow>

                <FieldRow label="Texte CTA final" description="Texte du bloc final avant footer.">
                  <textarea
                    value={config.partners_cta_text || ''}
                    onChange={(e) => updateConfig('partners_cta_text', e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Vous souhaitez associer votre marque à AFRIKHER..."
                  />
                </FieldRow>

                <FieldRow label="Label du bouton final" description="Texte du bouton d'appel à l'action.">
                  <input
                    type="text"
                    value={config.partners_cta_label || ''}
                    onChange={(e) => updateConfig('partners_cta_label', e.target.value)}
                    className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Devenir partenaire"
                  />
                </FieldRow>

                <FieldRow label="Lien du bouton final" description="Lien du CTA final." noBorder>
                  <input
                    type="text"
                    value={config.partners_cta_link || ''}
                    onChange={(e) => updateConfig('partners_cta_link', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="/contact"
                  />
                </FieldRow>
              </div>
            )}

            {activeTab === 'partners' && (
              <div>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="mb-1 text-lg font-bold text-gray-900">Liste des partenaires</h2>
                    <p className="text-sm text-gray-500">
                      Ajoutez, réordonnez, activez ou désactivez les partenaires affichés sur le site.
                    </p>
                  </div>
                  <button
                    onClick={addPartner}
                    className="flex items-center rounded-lg border border-dashed border-blue-300 px-4 py-2.5 text-sm text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    <Plus size={14} className="mr-2" />
                    Ajouter un partenaire
                  </button>
                </div>

                <div className="space-y-5">
                  {partners.map((partner, index) => (
                    <div key={partner.id} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {partner.name || `Partenaire ${index + 1}`}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
                            ordre {index + 1}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => movePartner(index, -1)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            onClick={() => movePartner(index, 1)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
                          >
                            <ChevronDown size={16} />
                          </button>
                          <button
                            onClick={() => removePartner(partner.id)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <input
                          type="text"
                          value={partner.name}
                          onChange={(e) => updatePartner(partner.id, 'name', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nom de l'entreprise"
                        />
                        <input
                          type="text"
                          value={partner.slug}
                          onChange={(e) => updatePartner(partner.id, 'slug', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="slug"
                        />
                        <input
                          type="text"
                          value={partner.company_owner}
                          onChange={(e) => updatePartner(partner.id, 'company_owner', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Responsable / fondateur"
                        />
                        <input
                          type="text"
                          value={partner.role_label}
                          onChange={(e) => updatePartner(partner.id, 'role_label', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Rôle du partenaire"
                        />
                        <input
                          type="text"
                          value={partner.logo_url}
                          onChange={(e) => updatePartner(partner.id, 'logo_url', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Logo URL"
                        />
                        <input
                          type="text"
                          value={partner.image_url}
                          onChange={(e) => updatePartner(partner.id, 'image_url', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Image / cover URL"
                        />
                        <input
                          type="text"
                          value={partner.website_url}
                          onChange={(e) => updatePartner(partner.id, 'website_url', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Site web"
                        />
                        <input
                          type="email"
                          value={partner.contact_email}
                          onChange={(e) => updatePartner(partner.id, 'contact_email', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Email de contact"
                        />
                        <input
                          type="text"
                          value={partner.linkedin_url}
                          onChange={(e) => updatePartner(partner.id, 'linkedin_url', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="LinkedIn URL"
                        />
                        <input
                          type="text"
                          value={partner.instagram_url}
                          onChange={(e) => updatePartner(partner.id, 'instagram_url', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Instagram URL"
                        />
                        <textarea
                          value={partner.short_description}
                          onChange={(e) => updatePartner(partner.id, 'short_description', e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none md:col-span-2"
                          placeholder="Description courte"
                        />
                        <textarea
                          value={partner.long_description}
                          onChange={(e) => updatePartner(partner.id, 'long_description', e.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none md:col-span-2"
                          placeholder="Description longue"
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={partner.featured}
                            onChange={(e) => updatePartner(partner.id, 'featured', e.target.checked)}
                          />
                          Mis en avant
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={partner.is_active}
                            onChange={(e) => updatePartner(partner.id, 'is_active', e.target.checked)}
                          />
                          Actif
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
