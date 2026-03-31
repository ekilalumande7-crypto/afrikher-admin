import { useEffect, useState, useCallback } from 'react';
import {
  Save, Eye, Upload, Plus, Trash2, GripVertical,
  Image as ImageIcon, Type, MousePointer, Monitor,
  Smartphone, ToggleLeft, ToggleRight, Check, AlertCircle,
  RefreshCw, ExternalLink, Layers, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface SiteConfigMap {
  [key: string]: string;
}

interface CTAButton {
  text: string;
  link: string;
  style: 'primary' | 'outline';
}

type SectionId = 'header' | 'hero' | 'cta' | 'about' | 'advanced';

interface Section {
  id: SectionId;
  label: string;
  icon: typeof Type;
  description: string;
}

const SECTIONS: Section[] = [
  { id: 'header', label: 'En-tête & Logo', icon: Layers, description: 'Logo, nom du site et navigation' },
  { id: 'hero', label: 'Section Hero', icon: ImageIcon, description: 'Titre, sous-titre, image de fond' },
  { id: 'cta', label: 'Boutons d\'action', icon: MousePointer, description: 'Boutons CTA et liens' },
  { id: 'about', label: 'Section À propos', icon: Type, description: 'Texte de présentation sur l\'accueil' },
  { id: 'advanced', label: 'Options avancées', icon: ToggleLeft, description: 'Carousel, animations, layout' },
];

export default function CMSAccueil() {
  const [config, setConfig] = useState<SiteConfigMap>({});
  const [originalConfig, setOriginalConfig] = useState<SiteConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('header');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [uploading, setUploading] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load config from Supabase
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('site_config')
        .select('key, value');

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

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Track changes
  useEffect(() => {
    const changed = Object.keys(config).some(key => config[key] !== originalConfig[key]);
    setHasChanges(changed);
  }, [config, originalConfig]);

  // Update a config value
  const updateConfig = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  // Save all changes to Supabase
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const changedKeys = Object.keys(config).filter(
        key => config[key] !== originalConfig[key]
      );

      if (changedKeys.length === 0) {
        setSaved(true);
        setSaving(false);
        return;
      }

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

  // Upload image to Supabase Storage
  const handleImageUpload = async (configKey: string, file: File) => {
    try {
      setUploading(configKey);
      setError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${configKey}-${Date.now()}.${fileExt}`;
      const filePath = `site/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('afrikher-public')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('afrikher-public')
        .getPublicUrl(filePath);

      updateConfig(configKey, urlData.publicUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur d\'upload: ' + message);
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-dark">Page d'accueil</h1>
          <p className="text-gray-400 text-sm mt-1">Gérez le contenu affiché sur la page d'accueil du site public.</p>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="https://afrikher-client.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-5 py-3 border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all text-sm font-medium"
          >
            <ExternalLink size={16} className="mr-2" />
            Voir le site
          </a>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={cn(
              "flex items-center px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg",
              hasChanges
                ? "bg-dark text-white hover:bg-charcoal shadow-dark/10"
                : saved
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            )}
          >
            {saving ? (
              <><RefreshCw size={16} className="mr-2 animate-spin" /> Enregistrement...</>
            ) : saved ? (
              <><Check size={16} className="mr-2" /> Enregistré !</>
            ) : (
              <><Save size={16} className="mr-2" /> Enregistrer</>
            )}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-xs font-bold">Fermer</button>
        </div>
      )}

      {/* Unsaved changes banner */}
      {hasChanges && (
        <div className="flex items-center space-x-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">Vous avez des modifications non enregistrées.</p>
        </div>
      )}

      <div className="flex gap-6">
        {/* Left: Section Navigation */}
        <div className="w-64 shrink-0 space-y-2">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all text-left",
                activeSection === section.id
                  ? "bg-dark text-white shadow-lg shadow-dark/10"
                  : "text-gray-500 hover:text-dark hover:bg-white"
              )}
            >
              <section.icon size={18} className={activeSection === section.id ? "text-gold" : ""} />
              <div>
                <p className={cn("text-sm font-bold", activeSection === section.id ? "text-white" : "text-dark")}>{section.label}</p>
                <p className={cn("text-[10px]", activeSection === section.id ? "text-gray-400" : "text-gray-400")}>{section.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Editor Panel */}
        <div className="flex-1 space-y-6">
          {/* SECTION: Header & Logo */}
          {activeSection === 'header' && (
            <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-8">
              <div className="border-b border-gray-50 pb-6">
                <h3 className="text-xl font-serif font-bold text-dark">En-tête & Logo</h3>
                <p className="text-sm text-gray-400 mt-1">Le logo et le nom qui apparaissent dans la barre de navigation.</p>
              </div>

              {/* Logo Upload */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Logo du site</label>
                <div className="flex items-start space-x-6">
                  <div className="w-40 h-24 bg-dark rounded-2xl flex items-center justify-center overflow-hidden border border-charcoal">
                    {config.logo_url ? (
                      <img src={config.logo_url} alt="Logo" className="max-w-full max-h-full object-contain p-3" />
                    ) : (
                      <span className="text-gold font-serif text-2xl font-bold">AFRIKHER</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-xs text-gray-400">Format recommandé : PNG transparent, max 500KB</p>
                    <label className={cn(
                      "flex items-center px-5 py-3 border border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gold hover:bg-gold/5 transition-all",
                      uploading === 'logo_url' && "opacity-50 cursor-wait"
                    )}>
                      {uploading === 'logo_url' ? (
                        <><RefreshCw size={16} className="mr-2 animate-spin text-gold" /> Upload en cours...</>
                      ) : (
                        <><Upload size={16} className="mr-2 text-gray-400" /> <span className="text-sm font-medium text-gray-600">Changer le logo</span></>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('logo_url', file);
                        }}
                        disabled={uploading === 'logo_url'}
                      />
                    </label>
                    {config.logo_url && (
                      <input
                        type="text"
                        value={config.logo_url}
                        onChange={(e) => updateConfig('logo_url', e.target.value)}
                        className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs text-gray-400 outline-none focus:ring-2 focus:ring-gold/20"
                        placeholder="URL du logo"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Site Name */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Nom du site</label>
                  <input
                    type="text"
                    value={config.site_name || ''}
                    onChange={(e) => updateConfig('site_name', e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gold/20"
                    placeholder="AFRIKHER"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Tagline / Sous-titre</label>
                  <input
                    type="text"
                    value={config.site_tagline || ''}
                    onChange={(e) => updateConfig('site_tagline', e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/20"
                    placeholder="L'élégance hors du commun."
                  />
                </div>
              </div>

              {/* Badge text */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Badge au-dessus du titre</label>
                <input
                  type="text"
                  value={config.hero_badge || ''}
                  onChange={(e) => updateConfig('hero_badge', e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/20"
                  placeholder="MAGAZINE ÉDITORIAL PREMIUM"
                />
                <p className="text-[10px] text-gray-400">Petit texte affiché au-dessus du titre principal (ex: "MAGAZINE ÉDITORIAL PREMIUM")</p>
              </div>
            </div>
          )}

          {/* SECTION: Hero */}
          {activeSection === 'hero' && (
            <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-8">
              <div className="border-b border-gray-50 pb-6">
                <h3 className="text-xl font-serif font-bold text-dark">Section Hero</h3>
                <p className="text-sm text-gray-400 mt-1">Le grand bloc principal visible en haut de la page d'accueil.</p>
              </div>

              {/* Hero Title */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Titre principal (doré)</label>
                <input
                  type="text"
                  value={config.hero_title || ''}
                  onChange={(e) => updateConfig('hero_title', e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-lg font-serif font-bold outline-none focus:ring-2 focus:ring-gold/20"
                  placeholder="Découvrez AFRIKHER"
                />
              </div>

              {/* Site Description */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Description</label>
                <textarea
                  value={config.site_description || ''}
                  onChange={(e) => updateConfig('site_description', e.target.value)}
                  className="w-full h-28 p-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/20 resize-none"
                  placeholder="Le magazine premium dédié à la femme africaine entrepreneure."
                />
              </div>

              {/* Hero Image */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Image de fond</label>
                <div className="relative rounded-2xl overflow-hidden border border-gray-100" style={{ aspectRatio: '16/7' }}>
                  {config.hero_image ? (
                    <img
                      src={config.hero_image}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-dark flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon size={48} className="text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Aucune image de fond</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className={cn(
                      "flex items-center px-6 py-3 bg-white/90 text-dark rounded-xl cursor-pointer font-bold text-sm",
                      uploading === 'hero_image' && "opacity-50"
                    )}>
                      {uploading === 'hero_image' ? (
                        <><RefreshCw size={16} className="mr-2 animate-spin" /> Upload...</>
                      ) : (
                        <><Upload size={16} className="mr-2" /> Changer l'image</>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('hero_image', file);
                        }}
                        disabled={uploading === 'hero_image'}
                      />
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  value={config.hero_image || ''}
                  onChange={(e) => updateConfig('hero_image', e.target.value)}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs text-gray-400 outline-none focus:ring-2 focus:ring-gold/20"
                  placeholder="URL de l'image hero ou uploader ci-dessus"
                />
                <p className="text-[10px] text-gray-400">Format recommandé : JPEG/WebP, 1920x800px minimum, max 2MB</p>
              </div>
            </div>
          )}

          {/* SECTION: CTA Buttons */}
          {activeSection === 'cta' && (
            <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-8">
              <div className="border-b border-gray-50 pb-6">
                <h3 className="text-xl font-serif font-bold text-dark">Boutons d'action (CTA)</h3>
                <p className="text-sm text-gray-400 mt-1">Les boutons affichés dans la section hero de la page d'accueil.</p>
              </div>

              {/* CTA 1 */}
              <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-dark flex items-center">
                    <span className="w-6 h-6 bg-gold text-dark rounded-lg flex items-center justify-center text-[10px] font-bold mr-3">1</span>
                    Bouton principal
                  </h4>
                  <span className="text-[10px] px-3 py-1 bg-gold/10 text-gold rounded-full font-bold">Rempli</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Texte du bouton</label>
                    <input
                      type="text"
                      value={config.hero_cta1_text || ''}
                      onChange={(e) => updateConfig('hero_cta1_text', e.target.value)}
                      className="w-full p-3.5 bg-white border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-gold/20"
                      placeholder="Découvrir le magazine"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Lien (URL)</label>
                    <input
                      type="text"
                      value={config.hero_cta1_link || ''}
                      onChange={(e) => updateConfig('hero_cta1_link', e.target.value)}
                      className="w-full p-3.5 bg-white border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold/20"
                      placeholder="/magazine"
                    />
                  </div>
                </div>
                {/* Preview */}
                <div className="pt-2">
                  <span className="text-[10px] text-gray-400 block mb-2">Aperçu :</span>
                  <button className="px-6 py-2.5 border border-gold text-gold text-xs font-bold tracking-wider uppercase hover:bg-gold/10 transition-all">
                    {config.hero_cta1_text || 'BOUTON 1'}
                  </button>
                </div>
              </div>

              {/* CTA 2 */}
              <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-dark flex items-center">
                    <span className="w-6 h-6 bg-charcoal text-white rounded-lg flex items-center justify-center text-[10px] font-bold mr-3">2</span>
                    Bouton secondaire
                  </h4>
                  <span className="text-[10px] px-3 py-1 bg-gray-200 text-gray-600 rounded-full font-bold">Contour</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Texte du bouton</label>
                    <input
                      type="text"
                      value={config.hero_cta2_text || ''}
                      onChange={(e) => updateConfig('hero_cta2_text', e.target.value)}
                      className="w-full p-3.5 bg-white border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-gold/20"
                      placeholder="S'abonner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Lien (URL)</label>
                    <input
                      type="text"
                      value={config.hero_cta2_link || ''}
                      onChange={(e) => updateConfig('hero_cta2_link', e.target.value)}
                      className="w-full p-3.5 bg-white border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold/20"
                      placeholder="/abonnement"
                    />
                  </div>
                </div>
                {/* Preview */}
                <div className="pt-2">
                  <span className="text-[10px] text-gray-400 block mb-2">Aperçu :</span>
                  <button className="px-6 py-2.5 bg-gold/10 border border-gold/30 text-gold text-xs font-bold tracking-wider uppercase hover:bg-gold/20 transition-all">
                    {config.hero_cta2_text || 'BOUTON 2'}
                  </button>
                </div>
              </div>

              {/* Additional CTA note */}
              <div className="p-4 bg-gold/5 border border-gold/10 rounded-2xl">
                <p className="text-xs text-gray-500">
                  <strong className="text-dark">Astuce :</strong> Les boutons apparaissent côte à côte sous la description.
                  Le premier bouton est mis en avant, le second est plus discret. Laissez les champs vides pour masquer un bouton.
                </p>
              </div>
            </div>
          )}

          {/* SECTION: About */}
          {activeSection === 'about' && (
            <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-8">
              <div className="border-b border-gray-50 pb-6">
                <h3 className="text-xl font-serif font-bold text-dark">Section À propos</h3>
                <p className="text-sm text-gray-400 mt-1">Le bloc de présentation affiché sur la page d'accueil.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Titre de la section</label>
                <input
                  type="text"
                  value={config.about_title || ''}
                  onChange={(e) => updateConfig('about_title', e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gold/20"
                  placeholder="Plus qu'un magazine"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Texte de présentation</label>
                <textarea
                  value={config.about_text || ''}
                  onChange={(e) => updateConfig('about_text', e.target.value)}
                  className="w-full h-40 p-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/20 resize-none leading-relaxed"
                  placeholder="AFRIKHER est une plateforme d'inspiration, de visibilité et d'influence..."
                />
                <p className="text-[10px] text-gray-400">{(config.about_text || '').length} caractères</p>
              </div>

              {/* About Image */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Image d'illustration</label>
                <div className="flex items-start space-x-6">
                  <div className="w-48 h-32 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                    {config.about_image ? (
                      <img src={config.about_image} alt="About" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className={cn(
                      "flex items-center px-5 py-3 border border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gold hover:bg-gold/5 transition-all",
                      uploading === 'about_image' && "opacity-50 cursor-wait"
                    )}>
                      {uploading === 'about_image' ? (
                        <><RefreshCw size={16} className="mr-2 animate-spin text-gold" /> Upload en cours...</>
                      ) : (
                        <><Upload size={16} className="mr-2 text-gray-400" /> <span className="text-sm font-medium text-gray-600">Changer l'image</span></>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('about_image', file);
                        }}
                        disabled={uploading === 'about_image'}
                      />
                    </label>
                    <input
                      type="text"
                      value={config.about_image || ''}
                      onChange={(e) => updateConfig('about_image', e.target.value)}
                      className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs text-gray-400 outline-none focus:ring-2 focus:ring-gold/20"
                      placeholder="URL de l'image"
                    />
                  </div>
                </div>
              </div>

              {/* Foundress info */}
              <div className="border-t border-gray-50 pt-6 space-y-4">
                <h4 className="text-sm font-bold text-dark">Fondatrice (affichée dans "Qui sommes-nous")</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Nom complet</label>
                    <input
                      type="text"
                      value={config.foundress_name || ''}
                      onChange={(e) => updateConfig('foundress_name', e.target.value)}
                      className="w-full p-3.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Titre / Rôle</label>
                    <input
                      type="text"
                      value={config.foundress_title || ''}
                      onChange={(e) => updateConfig('foundress_title', e.target.value)}
                      className="w-full p-3.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Biographie</label>
                  <textarea
                    value={config.foundress_bio || ''}
                    onChange={(e) => updateConfig('foundress_bio', e.target.value)}
                    className="w-full h-28 p-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/20 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Advanced */}
          {activeSection === 'advanced' && (
            <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-8">
              <div className="border-b border-gray-50 pb-6">
                <h3 className="text-xl font-serif font-bold text-dark">Options avancées</h3>
                <p className="text-sm text-gray-400 mt-1">Carousel, disposition et options d'affichage.</p>
              </div>

              {/* Carousel Toggle */}
              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-dark">Mode Carousel</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Faire défiler plusieurs images dans le hero au lieu d'une seule image fixe.</p>
                </div>
                <button
                  onClick={() => {
                    const current = config.hero_carousel_enabled === 'true';
                    updateConfig('hero_carousel_enabled', current ? 'false' : 'true');
                  }}
                  className="shrink-0"
                >
                  {config.hero_carousel_enabled === 'true' ? (
                    <ToggleRight size={40} className="text-gold" />
                  ) : (
                    <ToggleLeft size={40} className="text-gray-300" />
                  )}
                </button>
              </div>

              {/* Carousel images */}
              {config.hero_carousel_enabled === 'true' && (
                <div className="space-y-4">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Images du carousel</label>
                  <p className="text-xs text-gray-400">Ajoutez les URLs des images du carousel, séparées par des virgules.</p>
                  <textarea
                    value={config.hero_carousel_images || ''}
                    onChange={(e) => updateConfig('hero_carousel_images', e.target.value)}
                    className="w-full h-28 p-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/20 resize-none font-mono"
                    placeholder="https://image1.jpg, https://image2.jpg, https://image3.jpg"
                  />
                  <label className={cn(
                    "flex items-center px-5 py-3 border border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gold hover:bg-gold/5 transition-all w-fit",
                    uploading === 'hero_carousel' && "opacity-50"
                  )}>
                    {uploading === 'hero_carousel' ? (
                      <><RefreshCw size={16} className="mr-2 animate-spin text-gold" /> Upload...</>
                    ) : (
                      <><Plus size={16} className="mr-2 text-gray-400" /> <span className="text-sm font-medium text-gray-600">Ajouter une image au carousel</span></>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploading('hero_carousel');
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `carousel-${Date.now()}.${fileExt}`;
                            const filePath = `site/${fileName}`;
                            const { error: uploadErr } = await supabase.storage
                              .from('afrikher-public')
                              .upload(filePath, file, { cacheControl: '3600', upsert: true });
                            if (uploadErr) throw uploadErr;
                            const { data: urlData } = supabase.storage
                              .from('afrikher-public')
                              .getPublicUrl(filePath);
                            const current = config.hero_carousel_images || '';
                            const newVal = current ? `${current}, ${urlData.publicUrl}` : urlData.publicUrl;
                            updateConfig('hero_carousel_images', newVal);
                          } catch (err: unknown) {
                            const message = err instanceof Error ? err.message : 'Erreur';
                            setError('Erreur upload carousel: ' + message);
                          } finally {
                            setUploading(null);
                          }
                        }
                      }}
                      disabled={uploading === 'hero_carousel'}
                    />
                  </label>
                </div>
              )}

              {/* Layout alignment */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">Alignement du contenu hero</label>
                <div className="flex space-x-3">
                  {[
                    { value: 'left', label: 'Gauche' },
                    { value: 'center', label: 'Centré' },
                    { value: 'right', label: 'Droite' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateConfig('hero_alignment', opt.value)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm font-bold transition-all border",
                        (config.hero_alignment || 'left') === opt.value
                          ? "bg-dark text-gold border-dark"
                          : "bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlay opacity */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  Opacité du fond sombre — {config.hero_overlay_opacity || '60'}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.hero_overlay_opacity || '60'}
                  onChange={(e) => updateConfig('hero_overlay_opacity', e.target.value)}
                  className="w-full accent-gold"
                />
                <p className="text-[10px] text-gray-400">Contrôle la visibilité de l'image de fond derrière le texte (0% = pas d'assombrissement, 100% = tout noir).</p>
              </div>

              {/* Social links */}
              <div className="border-t border-gray-50 pt-6 space-y-4">
                <h4 className="text-sm font-bold text-dark">Réseaux sociaux & Liens</h4>
                <div className="space-y-3">
                  {[
                    { key: 'contact_email', label: 'Email de contact', placeholder: 'hadassa.ekilalumande@afrikher.com' },
                    { key: 'whatsapp_link', label: 'Lien WhatsApp', placeholder: 'https://chat.whatsapp.com/...' },
                    { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/afrikher' },
                    { key: 'social_facebook', label: 'Facebook', placeholder: 'https://facebook.com/afrikher' },
                    { key: 'social_linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/afrikher' },
                  ].map((field) => (
                    <div key={field.key} className="flex items-center space-x-3">
                      <label className="w-32 text-[10px] uppercase tracking-widest font-bold text-gray-400 shrink-0">{field.label}</label>
                      <input
                        type="text"
                        value={config[field.key] || ''}
                        onChange={(e) => updateConfig(field.key, e.target.value)}
                        className="flex-1 p-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold/20"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Live Preview */}
          <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-dark flex items-center">
                <Eye size={16} className="mr-2 text-gold" />
                Aperçu en direct
              </h4>
              <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-xl">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    previewMode === 'desktop' ? "bg-white shadow-sm text-dark" : "text-gray-400"
                  )}
                >
                  <Monitor size={16} />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    previewMode === 'mobile' ? "bg-white shadow-sm text-dark" : "text-gray-400"
                  )}
                >
                  <Smartphone size={16} />
                </button>
              </div>
            </div>

            {/* Preview box */}
            <div
              className={cn(
                "bg-[#0A0A0A] rounded-2xl overflow-hidden transition-all mx-auto relative",
                previewMode === 'mobile' ? "w-[375px]" : "w-full"
              )}
              style={{
                minHeight: previewMode === 'mobile' ? '500px' : '320px',
                backgroundImage: config.hero_image ? `url(${config.hero_image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Overlay */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(10, 10, 10, ${(parseInt(config.hero_overlay_opacity || '60') / 100)})` }}
              />

              {/* Content */}
              <div className={cn(
                "relative z-10 p-8 flex flex-col justify-center h-full",
                previewMode === 'mobile' ? "p-5" : "p-8",
                (config.hero_alignment || 'left') === 'center' ? "items-center text-center" :
                (config.hero_alignment || 'left') === 'right' ? "items-end text-right" : "items-start text-left"
              )} style={{ minHeight: previewMode === 'mobile' ? '500px' : '320px' }}>
                {/* Badge */}
                <p className="text-gray-400 text-[9px] tracking-[0.2em] uppercase mb-3">
                  — {config.hero_badge || 'MAGAZINE ÉDITORIAL PREMIUM'}
                </p>

                {/* Site name */}
                <h1 className={cn(
                  "font-serif font-bold text-[#C9A84C] tracking-wider",
                  previewMode === 'mobile' ? "text-3xl mb-2" : "text-5xl mb-3"
                )} style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                  {config.site_name || 'AFRIKHER'}
                </h1>

                {/* Tagline */}
                <p className={cn(
                  "italic text-gray-300 mb-3",
                  previewMode === 'mobile' ? "text-sm" : "text-base"
                )} style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                  {config.site_tagline || "L'élégance hors du commun."}
                </p>

                {/* Hero title */}
                <h2 className={cn(
                  "font-serif text-[#C9A84C]/80 mb-2",
                  previewMode === 'mobile' ? "text-xl" : "text-2xl"
                )}>
                  {config.hero_title || 'Découvrez AFRIKHER'}
                </h2>

                {/* Description */}
                <p className={cn(
                  "text-gray-400 mb-5 max-w-lg",
                  previewMode === 'mobile' ? "text-xs" : "text-sm"
                )}>
                  {config.site_description || 'Le magazine premium dédié à la femme africaine entrepreneure.'}
                </p>

                {/* CTA Buttons */}
                <div className="flex items-center space-x-3">
                  {config.hero_cta1_text && (
                    <span className={cn(
                      "border border-[#C9A84C] text-[#C9A84C] font-bold tracking-wider uppercase",
                      previewMode === 'mobile' ? "px-4 py-2 text-[8px]" : "px-5 py-2.5 text-[10px]"
                    )}>
                      {config.hero_cta1_text}
                    </span>
                  )}
                  {config.hero_cta2_text && (
                    <span className={cn(
                      "border border-[#C9A84C]/30 text-[#C9A84C]/70 font-bold tracking-wider uppercase",
                      previewMode === 'mobile' ? "px-4 py-2 text-[8px]" : "px-5 py-2.5 text-[10px]"
                    )}>
                      {config.hero_cta2_text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
