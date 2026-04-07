import { useEffect, useState, useCallback } from 'react';
import { Save, RefreshCw, Check, AlertCircle, ExternalLink, Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AdminAlert,
  AdminFieldRow,
  AdminSectionHeader,
  AdminSectionShell,
  adminGhostButtonClass,
  adminInputClass,
  adminTextareaClass,
} from '../components/AdminPrimitives';

interface SiteConfigMap {
  [key: string]: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

function FeatureEditor({ features, onUpdate, onRemove, onAdd }: {
  features: string[];
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      {features.map((feature, i) => (
        <div key={i} className="flex items-center gap-2">
          <GripVertical size={14} className="shrink-0 text-[#C9A84C]" />
          <input
            type="text"
            value={feature}
            onChange={(e) => onUpdate(i, e.target.value)}
            className={`${adminInputClass} flex-1 px-3 py-2`}
            placeholder="Avantage..."
          />
          <button
            onClick={() => onRemove(i)}
            className="p-2 text-[#9A9A8A] transition-colors hover:bg-[#FBF1F0] hover:text-[#7C2D2D]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 border border-[#C9A84C]/30 bg-[#FBF7ED] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6D5622] transition-all hover:border-[#C9A84C] hover:text-[#0A0A0A]"
      >
        <Plus size={14} /> Ajouter un avantage
      </button>
    </div>
  );
}

function FaqEditor({ items, onUpdateItem, onRemoveItem, onAddItem }: {
  items: FaqItem[];
  onUpdateItem: (index: number, field: 'question' | 'answer', value: string) => void;
  onRemoveItem: (index: number) => void;
  onAddItem: () => void;
}) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="space-y-3 border border-[#0A0A0A]/10 bg-[#F8F4EC] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Question</label>
                <input
                  type="text"
                  value={item.question}
                  onChange={(e) => onUpdateItem(i, 'question', e.target.value)}
                  className={adminInputClass}
                  placeholder="Ex: Puis-je annuler à tout moment ?"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Réponse</label>
                <textarea
                  value={item.answer}
                  onChange={(e) => onUpdateItem(i, 'answer', e.target.value)}
                  rows={2}
                  className={adminTextareaClass}
                  placeholder="La réponse à cette question..."
                />
              </div>
            </div>
            <button
              onClick={() => onRemoveItem(i)}
              className="mt-5 p-2 text-[#9A9A8A] transition-colors hover:bg-[#FBF1F0] hover:text-[#7C2D2D]"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={onAddItem}
        className="inline-flex items-center gap-2 border border-dashed border-[#C9A84C]/50 bg-[#FBF7ED] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#6D5622] transition-all hover:border-[#C9A84C] hover:text-[#0A0A0A]"
      >
        <Plus size={14} /> Ajouter une question
      </button>
    </div>
  );
}

// ========================================
// Main component
// ========================================

export default function CMSAbonnement() {
  const [config, setConfig] = useState<SiteConfigMap>({});
  const [originalConfig, setOriginalConfig] = useState<SiteConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'mensuel' | 'annuel' | 'faq'>('general');

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('site_config')
        .select('key, value')
        .like('key', 'sub_%');
      if (fetchError) throw fetchError;

      const configMap: SiteConfigMap = {};
      data?.forEach((row: { key: string; value: string }) => {
        configMap[row.key] = row.value || '';
      });
      setConfig(configMap);
      setOriginalConfig(configMap);
      setHasChanges(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur de chargement: ' + message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  useEffect(() => {
    const changed = Object.keys(config).some(key => config[key] !== originalConfig[key]);
    setHasChanges(changed);
  }, [config, originalConfig]);

  const updateConfig = useCallback((key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const changedKeys = Object.keys(config).filter(key => config[key] !== originalConfig[key]);
      if (changedKeys.length === 0) { setSaved(true); setSaving(false); return; }

      for (const key of changedKeys) {
        const { error: upsertError } = await supabase
          .from('site_config')
          .upsert({ key, value: config[key], updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (upsertError) throw upsertError;
      }
      setOriginalConfig({ ...config });
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur de sauvegarde: ' + message);
    } finally {
      setSaving(false);
    }
  };

  // Features helpers
  const getFeatures = useCallback((key: string): string[] => {
    const val = config[key] || '';
    return val ? val.split('||').filter(Boolean) : [];
  }, [config]);

  const setFeatures = useCallback((key: string, features: string[]) => {
    updateConfig(key, features.join('||'));
  }, [updateConfig]);

  const addFeature = useCallback((key: string) => {
    const val = config[key] || '';
    const features = val ? val.split('||').filter(Boolean) : [];
    features.push('');
    updateConfig(key, features.join('||'));
  }, [config, updateConfig]);

  const removeFeature = useCallback((key: string, index: number) => {
    const val = config[key] || '';
    const features = val ? val.split('||').filter(Boolean) : [];
    features.splice(index, 1);
    updateConfig(key, features.join('||'));
  }, [config, updateConfig]);

  const updateFeature = useCallback((key: string, index: number, value: string) => {
    const val = config[key] || '';
    const features = val ? val.split('||') : [];
    if (index < features.length) {
      features[index] = value;
    }
    updateConfig(key, features.join('||'));
  }, [config, updateConfig]);

  // FAQ helpers
  const getFaqItems = useCallback((): FaqItem[] => {
    const val = config.sub_faq_items || '';
    if (!val) return [];
    return val.split('||||').filter(Boolean).map(pair => {
      const parts = pair.split('||');
      return { question: parts[0] || '', answer: parts[1] || '' };
    });
  }, [config]);

  const setFaqItems = useCallback((items: FaqItem[]) => {
    const val = items.map(i => `${i.question}||${i.answer}`).join('||||');
    updateConfig('sub_faq_items', val);
  }, [updateConfig]);

  const addFaqItem = useCallback(() => {
    const items = getFaqItems();
    items.push({ question: '', answer: '' });
    setFaqItems(items);
  }, [getFaqItems, setFaqItems]);

  const removeFaqItem = useCallback((index: number) => {
    const items = getFaqItems();
    items.splice(index, 1);
    setFaqItems(items);
  }, [getFaqItems, setFaqItems]);

  const updateFaqItem = useCallback((index: number, field: 'question' | 'answer', value: string) => {
    const items = getFaqItems();
    items[index][field] = value;
    setFaqItems(items);
  }, [getFaqItems, setFaqItems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-[#C9A84C]" />
          <p className="text-sm uppercase tracking-[0.24em] text-[#9A9A8A]">Chargement des offres</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general' as const, label: 'Général' },
    { id: 'mensuel' as const, label: 'Plan Mensuel' },
    { id: 'annuel' as const, label: 'Plan Annuel' },
    { id: 'faq' as const, label: 'FAQ' },
  ];

  const monthlyFeatures = getFeatures('sub_monthly_features');
  const annualFeatures = getFeatures('sub_annual_features');
  const faqItems = getFaqItems();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 border-b border-[#0A0A0A]/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#9A9A8A]">CMS Conversion</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none text-[#0A0A0A]">Page Abonnement</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9A9A8A]">
            Travaillez la proposition de valeur, la hiérarchie des offres et la réassurance avec une lecture premium, claire et rentable.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://afrikher-client.vercel.app/abonnement" target="_blank" rel="noopener noreferrer"
            className={adminGhostButtonClass}>
            <ExternalLink size={16} className="mr-2" /> Voir la page
          </a>
          <button onClick={handleSave} disabled={saving || !hasChanges}
            className={`inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.24em] transition-all ${
              hasChanges
                ? 'bg-[#0A0A0A] text-[#F5F0E8] hover:bg-[#C9A84C] hover:text-[#0A0A0A]'
                : saved
                  ? 'bg-[#C9A84C] text-[#0A0A0A]'
                  : 'cursor-not-allowed bg-[#EAE2D3] text-[#9A9A8A]'
            }`}>
            {saving ? <><RefreshCw size={14} className="mr-2 animate-spin" /> Enregistrement...</>
             : saved ? <><Check size={14} className="mr-2" /> Enregistré</>
             : <><Save size={14} className="mr-2" /> Enregistrer</>}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <AdminAlert tone="error" className="mb-4">
          <AlertCircle size={18} className="shrink-0 text-[#7C2D2D]" />
          <p className="flex-1 text-sm text-[#7C2D2D]">{error}</p>
          <button onClick={() => setError(null)} className="text-sm font-medium text-[#7C2D2D] hover:opacity-80">Fermer</button>
        </AdminAlert>
      )}
      {hasChanges && (
        <AdminAlert tone="warning" className="mb-4">
          <AlertCircle size={16} className="shrink-0 text-[#6D5622]" />
          <p className="text-sm text-[#6D5622]">Modifications non enregistrées.</p>
        </AdminAlert>
      )}

      {/* Main layout */}
      <div className="overflow-hidden border border-[#0A0A0A]/10 bg-white">
        <div className="flex min-h-[600px]">
          {/* Sidebar tabs */}
          <nav className="w-60 shrink-0 border-r border-[#0A0A0A]/10 bg-[#F8F4EC] py-4">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full px-6 py-3 text-left text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-r-2 border-[#C9A84C] bg-white font-medium text-[#0A0A0A]'
                    : 'text-[#6F6C62] hover:bg-white/70 hover:text-[#0A0A0A]'
                }`}>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 px-10 py-8">

            {/* GENERAL */}
            {activeTab === 'general' && (
              <AdminSectionShell>
                <AdminSectionHeader
                  eyebrow="Positionnement"
                  title="Paramètres généraux"
                  description="Activation, hero et cadrage éditorial de la page abonnement. Ici on pose la valeur perçue avant même de parler prix."
                />
                <div className="px-8 pb-8">

                <AdminFieldRow label="Abonnements actifs" description="Activer ou désactiver la page d'abonnement sur le site public.">
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateConfig('sub_enabled', config.sub_enabled === 'true' ? 'false' : 'true')}
                      className={`relative inline-flex h-6 w-11 items-center transition-colors ${config.sub_enabled === 'true' ? 'bg-[#0A0A0A]' : 'bg-[#D8D1C2]'}`}>
                      <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${config.sub_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-sm font-medium ${config.sub_enabled === 'true' ? 'text-[#6D5622]' : 'text-[#9A9A8A]'}`}>
                      {config.sub_enabled === 'true' ? "Actif — les visiteurs peuvent s'abonner" : "Désactivé — la page affiche un message d'attente"}
                    </span>
                  </div>
                </AdminFieldRow>

                <AdminFieldRow label="Titre de la page" description="Le titre affiché en grand dans le hero.">
                  <input type="text" value={config.sub_hero_title || ''}
                    onChange={(e) => updateConfig('sub_hero_title', e.target.value)}
                    className={`${adminInputClass} max-w-md font-display text-xl`}
                    placeholder="Abonnements" />
                </AdminFieldRow>

                <AdminFieldRow label="Label hero" description="Petit label premium au-dessus du titre principal.">
                  <input type="text" value={config.sub_hero_label || ''}
                    onChange={(e) => updateConfig('sub_hero_label', e.target.value)}
                    className={`${adminInputClass} max-w-md`}
                    placeholder="ACCÈS PRIVILÉGIÉ" />
                </AdminFieldRow>

                <AdminFieldRow label="Sous-titre" description="Texte doré italique sous le titre principal." noBorder>
                  <textarea value={config.sub_hero_subtitle || ''}
                    onChange={(e) => updateConfig('sub_hero_subtitle', e.target.value)}
                    rows={3}
                    className={`${adminTextareaClass} italic`}
                    placeholder="Rejoignez une communauté de femmes visionnaires..." />
                </AdminFieldRow>

                <AdminFieldRow label="Label section offres" description="Petit label au-dessus du bloc des formules.">
                  <input type="text" value={config.sub_section_label || ''}
                    onChange={(e) => updateConfig('sub_section_label', e.target.value)}
                    className={`${adminInputClass} max-w-md`}
                    placeholder="Les formules" />
                </AdminFieldRow>

                <AdminFieldRow label="Titre section offres" description="Titre principal du bloc des abonnements.">
                  <input type="text" value={config.sub_section_title || ''}
                    onChange={(e) => updateConfig('sub_section_title', e.target.value)}
                    className={`${adminInputClass} font-display text-xl`}
                    placeholder="Deux accès pensés comme une expérience éditoriale" />
                </AdminFieldRow>

                <AdminFieldRow label="Texte d'introduction offres" description="Court texte sous le titre de section." >
                  <textarea value={config.sub_section_intro || ''}
                    onChange={(e) => updateConfig('sub_section_intro', e.target.value)}
                    rows={3}
                    className={adminTextareaClass}
                    placeholder="Choisissez la formule qui accompagne votre lecture..." />
                </AdminFieldRow>

                <AdminFieldRow label="Label section aide" description="Petit label affiché au-dessus du bloc FAQ / aide." noBorder>
                  <input type="text" value={config.sub_help_label || ''}
                    onChange={(e) => updateConfig('sub_help_label', e.target.value)}
                    className={`${adminInputClass} max-w-md`}
                    placeholder="Réassurance" />
                </AdminFieldRow>
                </div>
              </AdminSectionShell>
            )}

            {/* PLAN MENSUEL */}
            {activeTab === 'mensuel' && (
              <div className="space-y-6">
                <AdminSectionShell>
                  <AdminSectionHeader
                    eyebrow="Offre"
                    title="Plan Mensuel"
                    description="Façonnez une formule simple, immédiate et lisible. Cette carte doit inspirer l’accès sans noyer la valeur."
                  />
                  <div className="grid gap-0 lg:grid-cols-[1.35fr,0.85fr]">
                    <div className="px-8 pb-8">

                <AdminFieldRow label="Nom du plan" description="Le titre affiché sur la carte.">
                  <input type="text" value={config.sub_monthly_name || ''}
                    onChange={(e) => updateConfig('sub_monthly_name', e.target.value)}
                    className={`${adminInputClass} max-w-sm font-display text-xl`}
                    placeholder="Mensuel" />
                </AdminFieldRow>

                <AdminFieldRow label="Prix" description="Le montant en euros.">
                  <div className="flex items-center gap-2 max-w-xs">
                    <input type="text" inputMode="decimal"
                      value={config.sub_monthly_price || ''}
                      onChange={(e) => updateConfig('sub_monthly_price', e.target.value)}
                      className="w-24 border border-[#0A0A0A]/12 bg-[#F8F4EC] px-4 py-2.5 text-sm text-[#0A0A0A] outline-none transition-all focus:border-[#C9A84C] focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/12"
                      placeholder="15" />
                    <span className="text-lg font-medium text-[#0A0A0A]">€</span>
                    <span className="text-sm text-[#9A9A8A]">/</span>
                    <input type="text" value={config.sub_monthly_period || ''}
                      onChange={(e) => updateConfig('sub_monthly_period', e.target.value)}
                      className="w-24 border border-[#0A0A0A]/12 bg-[#F8F4EC] px-3 py-2.5 text-sm text-[#0A0A0A] outline-none transition-all focus:border-[#C9A84C] focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/12"
                      placeholder="mois" />
                  </div>
                </AdminFieldRow>

                <AdminFieldRow label="Prix avant réduction" description="Laisser vide si pas de réduction. Le prix barré sera affiché à côté du prix actuel.">
                  <div className="flex items-center gap-2 max-w-xs">
                    <input type="text" inputMode="decimal"
                      value={config.sub_monthly_original_price || ''}
                      onChange={(e) => updateConfig('sub_monthly_original_price', e.target.value)}
                      className="w-24 border border-[#0A0A0A]/12 bg-[#F8F4EC] px-4 py-2.5 text-sm text-[#0A0A0A] outline-none transition-all focus:border-[#C9A84C] focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/12"
                      placeholder="Ex: 20" />
                    <span className="text-lg font-medium text-[#0A0A0A]">€</span>
                  </div>
                </AdminFieldRow>

                <AdminFieldRow label="Label réduction" description="Texte affiché sur le badge de réduction (ex: -25%, Promo, etc.)">
                  <input type="text" value={config.sub_monthly_discount_label || ''}
                    onChange={(e) => updateConfig('sub_monthly_discount_label', e.target.value)}
                    className={`${adminInputClass} max-w-xs`}
                    placeholder="Ex: -25%" />
                </AdminFieldRow>

                <AdminFieldRow label="Description" description="Texte court sous le prix.">
                  <input type="text" value={config.sub_monthly_description || ''}
                    onChange={(e) => updateConfig('sub_monthly_description', e.target.value)}
                    className={adminInputClass}
                    placeholder="L'accès complet à l'univers AFRIKHER..." />
                </AdminFieldRow>

                <AdminFieldRow label="Note complémentaire" description="Petite phrase courte près du prix ou sous le plan.">
                  <input type="text" value={config.sub_monthly_note || ''}
                    onChange={(e) => updateConfig('sub_monthly_note', e.target.value)}
                    className={adminInputClass}
                    placeholder="Lecture immédiate, sans engagement." />
                </AdminFieldRow>

                <AdminFieldRow label="Texte du bouton" description="Le texte affiché sur le bouton CTA.">
                  <input type="text" value={config.sub_monthly_cta || ''}
                    onChange={(e) => updateConfig('sub_monthly_cta', e.target.value)}
                    className={`${adminInputClass} max-w-sm`}
                    placeholder="S'abonner" />
                </AdminFieldRow>

                <AdminFieldRow label="Avantages" description="Liste des avantages inclus dans ce plan." noBorder>
                  <FeatureEditor
                    features={monthlyFeatures}
                    onUpdate={(i, v) => updateFeature('sub_monthly_features', i, v)}
                    onRemove={(i) => removeFeature('sub_monthly_features', i)}
                    onAdd={() => addFeature('sub_monthly_features')}
                  />
                </AdminFieldRow>
                    </div>
                    <div className="border-l border-[#0A0A0A]/8 bg-[#F8F4EC] p-8">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#9A9A8A]">Aperçu de l’offre</p>
                      <div className="mt-4 border border-[#0A0A0A]/10 bg-white p-6">
                        {config.sub_monthly_discount_label && (
                          <span className="inline-flex bg-[#FBF7ED] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[#6D5622]">
                            {config.sub_monthly_discount_label}
                          </span>
                        )}
                        <h3 className="mt-4 font-display text-3xl font-semibold text-[#0A0A0A]">
                          {config.sub_monthly_name || 'Mensuel'}
                        </h3>
                        <div className="mt-4 flex items-end gap-2">
                          <span className="font-display text-5xl font-semibold text-[#0A0A0A]">
                            {config.sub_monthly_price || '15'}€
                          </span>
                          <span className="pb-2 text-sm text-[#9A9A8A]">/ {config.sub_monthly_period || 'mois'}</span>
                        </div>
                        {config.sub_monthly_original_price && (
                          <p className="mt-2 text-sm text-[#9A9A8A] line-through">
                            {config.sub_monthly_original_price}€
                          </p>
                        )}
                        <p className="mt-4 text-sm leading-relaxed text-[#0A0A0A]">
                          {config.sub_monthly_description || "L'accès complet à l'univers AFRIKHER..."}
                        </p>
                        {config.sub_monthly_note && (
                          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#9A9A8A]">{config.sub_monthly_note}</p>
                        )}
                        <div className="mt-6 bg-[#0A0A0A] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.24em] text-[#F5F0E8]">
                          {config.sub_monthly_cta || "S'abonner"}
                        </div>
                      </div>
                    </div>
                  </div>
                </AdminSectionShell>
              </div>
            )}

            {/* PLAN ANNUEL */}
            {activeTab === 'annuel' && (
              <div className="space-y-6">
                <AdminSectionShell>
                  <AdminSectionHeader
                    eyebrow="Offre premium"
                    title="Plan Annuel"
                    description="Ici, le design doit soutenir la valeur perçue. On vend un engagement éditorial plus profond, pas seulement une remise."
                  />
                  <div className="grid gap-0 lg:grid-cols-[1.35fr,0.85fr]">
                    <div className="px-8 pb-8">

                <AdminFieldRow label="Mis en avant" description="Afficher le badge 'Le plus populaire' et le style doré.">
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateConfig('sub_annual_featured', config.sub_annual_featured === 'true' ? 'false' : 'true')}
                      className={`relative inline-flex h-6 w-11 items-center transition-colors ${config.sub_annual_featured === 'true' ? 'bg-[#0A0A0A]' : 'bg-[#D8D1C2]'}`}>
                      <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${config.sub_annual_featured === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-sm text-[#9A9A8A]">{config.sub_annual_featured === 'true' ? 'Mis en avant' : 'Style normal'}</span>
                  </div>
                </AdminFieldRow>

                <AdminFieldRow label="Nom du plan" description="Le titre affiché sur la carte.">
                  <input type="text" value={config.sub_annual_name || ''}
                    onChange={(e) => updateConfig('sub_annual_name', e.target.value)}
                    className={`${adminInputClass} max-w-sm font-display text-xl`}
                    placeholder="Annuel" />
                </AdminFieldRow>

                <AdminFieldRow label="Prix" description="Le montant en euros.">
                  <div className="flex items-center gap-2 max-w-xs">
                    <input type="text" inputMode="decimal"
                      value={config.sub_annual_price || ''}
                      onChange={(e) => updateConfig('sub_annual_price', e.target.value)}
                      className="w-24 border border-[#0A0A0A]/12 bg-[#F8F4EC] px-4 py-2.5 text-sm text-[#0A0A0A] outline-none transition-all focus:border-[#C9A84C] focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/12"
                      placeholder="150" />
                    <span className="text-lg font-medium text-[#0A0A0A]">€</span>
                    <span className="text-sm text-[#9A9A8A]">/</span>
                    <input type="text" value={config.sub_annual_period || ''}
                      onChange={(e) => updateConfig('sub_annual_period', e.target.value)}
                      className="w-24 border border-[#0A0A0A]/12 bg-[#F8F4EC] px-3 py-2.5 text-sm text-[#0A0A0A] outline-none transition-all focus:border-[#C9A84C] focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/12"
                      placeholder="an" />
                  </div>
                </AdminFieldRow>

                <AdminFieldRow label="Prix avant réduction" description="Laisser vide si pas de réduction. Le prix barré sera affiché à côté du prix actuel.">
                  <div className="flex items-center gap-2 max-w-xs">
                    <input type="text" inputMode="decimal"
                      value={config.sub_annual_original_price || ''}
                      onChange={(e) => updateConfig('sub_annual_original_price', e.target.value)}
                      className="w-24 border border-[#0A0A0A]/12 bg-[#F8F4EC] px-4 py-2.5 text-sm text-[#0A0A0A] outline-none transition-all focus:border-[#C9A84C] focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/12"
                      placeholder="Ex: 200" />
                    <span className="text-lg font-medium text-[#0A0A0A]">€</span>
                  </div>
                </AdminFieldRow>

                <AdminFieldRow label="Label réduction" description="Texte affiché sur le badge de réduction (ex: -17%, Promo, etc.)">
                  <input type="text" value={config.sub_annual_discount_label || ''}
                    onChange={(e) => updateConfig('sub_annual_discount_label', e.target.value)}
                    className={`${adminInputClass} max-w-xs`}
                    placeholder="Ex: -17%" />
                </AdminFieldRow>

                <AdminFieldRow label="Description" description="Texte court sous le prix.">
                  <input type="text" value={config.sub_annual_description || ''}
                    onChange={(e) => updateConfig('sub_annual_description', e.target.value)}
                    className={adminInputClass}
                    placeholder="Le choix de l'excellence..." />
                </AdminFieldRow>

                <AdminFieldRow label="Note complémentaire" description="Petite phrase courte près du prix ou sous le plan.">
                  <input type="text" value={config.sub_annual_note || ''}
                    onChange={(e) => updateConfig('sub_annual_note', e.target.value)}
                    className={adminInputClass}
                    placeholder="Accès annuel + privilèges AFRIKHER." />
                </AdminFieldRow>

                <AdminFieldRow label="Badge premium" description="Remplace le badge codé en dur sur la carte annuelle.">
                  <input type="text" value={config.sub_annual_badge || ''}
                    onChange={(e) => updateConfig('sub_annual_badge', e.target.value)}
                    className={`${adminInputClass} max-w-sm`}
                    placeholder="Le plus populaire" />
                </AdminFieldRow>

                <AdminFieldRow label="Texte du bouton" description="Le texte affiché sur le bouton CTA.">
                  <input type="text" value={config.sub_annual_cta || ''}
                    onChange={(e) => updateConfig('sub_annual_cta', e.target.value)}
                    className={`${adminInputClass} max-w-sm`}
                    placeholder="S'abonner & Économiser" />
                </AdminFieldRow>

                <AdminFieldRow label="Avantages" description="Liste des avantages inclus dans ce plan." noBorder>
                  <FeatureEditor
                    features={annualFeatures}
                    onUpdate={(i, v) => updateFeature('sub_annual_features', i, v)}
                    onRemove={(i) => removeFeature('sub_annual_features', i)}
                    onAdd={() => addFeature('sub_annual_features')}
                  />
                </AdminFieldRow>
                    </div>
                    <div className="border-l border-[#0A0A0A]/8 bg-[#F8F4EC] p-8">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#9A9A8A]">Aperçu de l’offre</p>
                      <div className={`mt-4 border p-6 ${config.sub_annual_featured === 'true' ? 'border-[#C9A84C]/45 bg-[#FBF7ED]' : 'border-[#0A0A0A]/10 bg-white'}`}>
                        {(config.sub_annual_badge || config.sub_annual_featured === 'true') && (
                          <span className="inline-flex bg-[#0A0A0A] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[#F5F0E8]">
                            {config.sub_annual_badge || 'Le plus populaire'}
                          </span>
                        )}
                        {config.sub_annual_discount_label && (
                          <span className="ml-2 inline-flex bg-white px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[#6D5622]">
                            {config.sub_annual_discount_label}
                          </span>
                        )}
                        <h3 className="mt-4 font-display text-3xl font-semibold text-[#0A0A0A]">
                          {config.sub_annual_name || 'Annuel'}
                        </h3>
                        <div className="mt-4 flex items-end gap-2">
                          <span className="font-display text-5xl font-semibold text-[#0A0A0A]">
                            {config.sub_annual_price || '150'}€
                          </span>
                          <span className="pb-2 text-sm text-[#9A9A8A]">/ {config.sub_annual_period || 'an'}</span>
                        </div>
                        {config.sub_annual_original_price && (
                          <p className="mt-2 text-sm text-[#9A9A8A] line-through">
                            {config.sub_annual_original_price}€
                          </p>
                        )}
                        <p className="mt-4 text-sm leading-relaxed text-[#0A0A0A]">
                          {config.sub_annual_description || "Le choix de l'excellence..."}
                        </p>
                        {config.sub_annual_note && (
                          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#9A9A8A]">{config.sub_annual_note}</p>
                        )}
                        <div className="mt-6 bg-[#0A0A0A] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.24em] text-[#F5F0E8]">
                          {config.sub_annual_cta || "S'abonner & Économiser"}
                        </div>
                      </div>
                    </div>
                  </div>
                </AdminSectionShell>
              </div>
            )}

            {/* FAQ */}
            {activeTab === 'faq' && (
              <AdminSectionShell>
                <AdminSectionHeader
                  eyebrow="Réassurance"
                  title="Section FAQ"
                  description="La fin de page doit rassurer, clarifier et lever les dernières hésitations avant conversion."
                />
                <div className="px-8 pb-8">

                <AdminFieldRow label="Titre" description="Le titre de la section FAQ.">
                  <input type="text" value={config.sub_faq_title || ''}
                    onChange={(e) => updateConfig('sub_faq_title', e.target.value)}
                    className={` max-w-md font-display text-xl`}
                    placeholder="Une question ?" />
                </AdminFieldRow>

                <AdminFieldRow label="Texte d'accompagnement" description="Le paragraphe sous le titre.">
                  <textarea value={config.sub_faq_text || ''}
                    onChange={(e) => updateConfig('sub_faq_text', e.target.value)}
                    rows={3}
                    className={adminTextareaClass}
                    placeholder="Notre équipe est à votre disposition..." />
                </AdminFieldRow>

                <AdminFieldRow label="Email de support" description="L'adresse email affichée pour les questions.">
                  <input type="email" value={config.sub_faq_email || ''}
                    onChange={(e) => updateConfig('sub_faq_email', e.target.value)}
                    className={`${adminInputClass} max-w-md`}
                    placeholder="support@afrikher.com" />
                </AdminFieldRow>

                <AdminFieldRow label="Questions / Réponses" description="Ajoutez, modifiez ou supprimez les FAQ." noBorder>
                  <FaqEditor
                    items={faqItems}
                    onUpdateItem={updateFaqItem}
                    onRemoveItem={removeFaqItem}
                    onAddItem={addFaqItem}
                  />
                </AdminFieldRow>
                </div>
              </AdminSectionShell>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
