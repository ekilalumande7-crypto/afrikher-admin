import { useEffect, useState, useCallback } from 'react';
import { Save, RefreshCw, Check, AlertCircle, ExternalLink, Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SiteConfigMap {
  [key: string]: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

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

  const updateConfig = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

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

  // Features (plan advantages) helpers
  const getFeatures = (key: string): string[] => {
    const val = config[key] || '';
    return val ? val.split('||').filter(Boolean) : [];
  };
  const setFeatures = (key: string, features: string[]) => {
    updateConfig(key, features.join('||'));
  };
  const addFeature = (key: string) => {
    const features = getFeatures(key);
    features.push('');
    setFeatures(key, features);
  };
  const removeFeature = (key: string, index: number) => {
    const features = getFeatures(key);
    features.splice(index, 1);
    setFeatures(key, features);
  };
  const updateFeature = (key: string, index: number, value: string) => {
    const features = getFeatures(key);
    features[index] = value;
    setFeatures(key, features);
  };

  // FAQ items helpers
  const getFaqItems = (): FaqItem[] => {
    const val = config.sub_faq_items || '';
    if (!val) return [];
    return val.split('||||').filter(Boolean).map(pair => {
      const parts = pair.split('||');
      return { question: parts[0] || '', answer: parts[1] || '' };
    });
  };
  const setFaqItems = (items: FaqItem[]) => {
    const val = items.map(i => `${i.question}||${i.answer}`).join('||||');
    updateConfig('sub_faq_items', val);
  };
  const addFaqItem = () => {
    const items = getFaqItems();
    items.push({ question: '', answer: '' });
    setFaqItems(items);
  };
  const removeFaqItem = (index: number) => {
    const items = getFaqItems();
    items.splice(index, 1);
    setFaqItems(items);
  };
  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const items = getFaqItems();
    items[index][field] = value;
    setFaqItems(items);
  };

  const FieldRow = ({ label, description, children, noBorder }: {
    label: string; description?: string; children: React.ReactNode; noBorder?: boolean;
  }) => (
    <div className={`py-6 ${noBorder ? '' : 'border-b border-gray-100'}`}>
      <div className="flex items-start justify-between gap-8">
        <div className="w-72 shrink-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );

  const FeatureEditor = ({ configKey }: { configKey: string }) => {
    const features = getFeatures(configKey);
    return (
      <div className="space-y-2">
        {features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2">
            <GripVertical size={14} className="text-gray-300 shrink-0" />
            <input
              type="text"
              value={feature}
              onChange={(e) => updateFeature(configKey, i, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Avantage..."
            />
            <button
              onClick={() => removeFeature(configKey, i)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={() => addFeature(configKey)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus size={14} /> Ajouter un avantage
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Chargement...</p>
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Page Abonnement</h1>
        <div className="flex items-center gap-3">
          <a href="https://afrikher-client.vercel.app/abonnement" target="_blank" rel="noopener noreferrer"
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <ExternalLink size={16} className="mr-2" /> Voir la page
          </a>
          <button onClick={handleSave} disabled={saving || !hasChanges}
            className={`flex items-center px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasChanges ? 'bg-gray-900 text-white hover:bg-gray-800'
              : saved ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}>
            {saving ? <><RefreshCw size={14} className="mr-2 animate-spin" /> Enregistrement...</>
            : saved ? <><Check size={14} className="mr-2" /> Enregistré</>
            : <><Save size={14} className="mr-2" /> Enregistrer</>}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-sm text-red-500 hover:text-red-700 font-medium">Fermer</button>
        </div>
      )}
      {hasChanges && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">Modifications non enregistrées.</p>
        </div>
      )}

      {/* Main layout */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex min-h-[600px]">
          {/* Sidebar */}
          <nav className="w-52 border-r border-gray-200 py-4 shrink-0">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-6 py-2.5 text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50 font-medium border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 px-10 py-6">

            {/* GENERAL */}
            {activeTab === 'general' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Paramètres généraux</h2>
                <p className="text-sm text-gray-500 mb-6">Activation et textes de la page abonnement.</p>

                <FieldRow label="Abonnements actifs" description="Activer ou désactiver la page d'abonnement sur le site public.">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateConfig('sub_enabled', config.sub_enabled === 'true' ? 'false' : 'true')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.sub_enabled === 'true' ? 'bg-green-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.sub_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-sm font-medium ${config.sub_enabled === 'true' ? 'text-green-700' : 'text-gray-500'}`}>
                      {config.sub_enabled === 'true' ? "Actif — les visiteurs peuvent s'abonner" : "Désactivé — la page affiche un message d'attente"}
                    </span>
                  </div>
                </FieldRow>

                <FieldRow label="Titre de la page" description="Le titre affiché en grand dans le hero.">
                  <input type="text" value={config.sub_hero_title || ''} onChange={(e) => updateConfig('sub_hero_title', e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Abonnements" />
                </FieldRow>

                <FieldRow label="Sous-titre" description="Texte doré italique sous le titre principal." noBorder>
                  <textarea value={config.sub_hero_subtitle || ''} onChange={(e) => updateConfig('sub_hero_subtitle', e.target.value)}
                    rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Rejoignez une communauté de femmes visionnaires..." />
                </FieldRow>
              </div>
            )}

            {/* PLAN MENSUEL */}
            {activeTab === 'mensuel' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Plan Mensuel</h2>
                <p className="text-sm text-gray-500 mb-6">Configuration du plan d'abonnement mensuel.</p>

                <FieldRow label="Nom du plan" description="Le titre affiché sur la carte.">
                  <input type="text" value={config.sub_monthly_name || ''} onChange={(e) => updateConfig('sub_monthly_name', e.target.value)}
                    className="w-full max-w-sm px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Mensuel" />
                </FieldRow>

                <FieldRow label="Prix" description="Le montant en euros.">
                  <div className="flex items-center gap-2 max-w-xs">
                    <input type="number" value={config.sub_monthly_price || ''} onChange={(e) => updateConfig('sub_monthly_price', e.target.value)}
                      className="w-24 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="15" />
                    <span className="text-lg font-medium text-gray-600">€</span>
                    <span className="text-sm text-gray-400">/ </span>
                    <input type="text" value={config.sub_monthly_period || ''} onChange={(e) => updateConfig('sub_monthly_period', e.target.value)}
                      className="w-20 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="mois" />
                  </div>
                </FieldRow>

                <FieldRow label="Description" description="Texte court sous le prix.">
                  <input type="text" value={config.sub_monthly_description || ''} onChange={(e) => updateConfig('sub_monthly_description', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="L'accès complet à l'univers AFRIKHER..." />
                </FieldRow>

                <FieldRow label="Texte du bouton" description="Le texte affiché sur le bouton CTA.">
                  <input type="text" value={config.sub_monthly_cta || ''} onChange={(e) => updateConfig('sub_monthly_cta', e.target.value)}
                    className="w-full max-w-sm px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="S'abonner" />
                </FieldRow>

                <FieldRow label="Avantages" description="Liste des avantages inclus dans ce plan." noBorder>
                  <FeatureEditor configKey="sub_monthly_features" />
                </FieldRow>
              </div>
            )}

            {/* PLAN ANNUEL */}
            {activeTab === 'annuel' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Plan Annuel</h2>
                <p className="text-sm text-gray-500 mb-6">Configuration du plan d'abonnement annuel.</p>

                <FieldRow label="Mis en avant" description="Afficher le badge 'Le plus populaire' et le style doré.">
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateConfig('sub_annual_featured', config.sub_annual_featured === 'true' ? 'false' : 'true')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.sub_annual_featured === 'true' ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.sub_annual_featured === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-sm text-gray-600">{config.sub_annual_featured === 'true' ? 'Mis en avant' : 'Style normal'}</span>
                  </div>
                </FieldRow>

                <FieldRow label="Nom du plan" description="Le titre affiché sur la carte.">
                  <input type="text" value={config.sub_annual_name || ''} onChange={(e) => updateConfig('sub_annual_name', e.target.value)}
                    className="w-full max-w-sm px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Annuel" />
                </FieldRow>

                <FieldRow label="Prix" description="Le montant en euros.">
                  <div className="flex items-center gap-2 max-w-xs">
                    <input type="number" value={config.sub_annual_price || ''} onChange={(e) => updateConfig('sub_annual_price', e.target.value)}
                      className="w-24 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="150" />
                    <span className="text-lg font-medium text-gray-600">€</span>
                    <span className="text-sm text-gray-400">/ </span>
                    <input type="text" value={config.sub_annual_period || ''} onChange={(e) => updateConfig('sub_annual_period', e.target.value)}
                      className="w-20 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="an" />
                  </div>
                </FieldRow>

                <FieldRow label="Description" description="Texte court sous le prix.">
                  <input type="text" value={config.sub_annual_description || ''} onChange={(e) => updateConfig('sub_annual_description', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Le choix de l'excellence..." />
                </FieldRow>

                <FieldRow label="Texte du bouton" description="Le texte affiché sur le bouton CTA.">
                  <input type="text" value={config.sub_annual_cta || ''} onChange={(e) => updateConfig('sub_annual_cta', e.target.value)}
                    className="w-full max-w-sm px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="S'abonner & Économiser" />
                </FieldRow>

                <FieldRow label="Avantages" description="Liste des avantages inclus dans ce plan." noBorder>
                  <FeatureEditor configKey="sub_annual_features" />
                </FieldRow>
              </div>
            )}

            {/* FAQ */}
            {activeTab === 'faq' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Section FAQ</h2>
                <p className="text-sm text-gray-500 mb-6">Les questions/réponses affichées en bas de la page abonnement.</p>

                <FieldRow label="Titre" description="Le titre de la section FAQ.">
                  <input type="text" value={config.sub_faq_title || ''} onChange={(e) => updateConfig('sub_faq_title', e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Une question ?" />
                </FieldRow>

                <FieldRow label="Texte d'accompagnement" description="Le paragraphe sous le titre.">
                  <textarea value={config.sub_faq_text || ''} onChange={(e) => updateConfig('sub_faq_text', e.target.value)}
                    rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Notre équipe est à votre disposition..." />
                </FieldRow>

                <FieldRow label="Email de support" description="L'adresse email affichée pour les questions.">
                  <input type="email" value={config.sub_faq_email || ''} onChange={(e) => updateConfig('sub_faq_email', e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="support@afrikher.com" />
                </FieldRow>

                <FieldRow label="Questions / Réponses" description="Ajoutez, modifiez ou supprimez les FAQ." noBorder>
                  <div className="space-y-4">
                    {getFaqItems().map((item, i) => (
                      <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Question</label>
                              <input type="text" value={item.question} onChange={(e) => updateFaqItem(i, 'question', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                placeholder="Ex: Puis-je annuler à tout moment ?" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Réponse</label>
                              <textarea value={item.answer} onChange={(e) => updateFaqItem(i, 'answer', e.target.value)}
                                rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                                placeholder="La réponse à cette question..." />
                            </div>
                          </div>
                          <button onClick={() => removeFaqItem(i)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button onClick={addFaqItem}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-dashed border-blue-300">
                      <Plus size={14} /> Ajouter une question
                    </button>
                  </div>
                </FieldRow>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
