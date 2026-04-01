import { useEffect, useState, useCallback } from 'react';
import {
  Save, Upload, RefreshCw, Check, AlertCircle,
  ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SiteConfigMap {
  [key: string]: string;
}

type SectionId = 'identite' | 'hero' | 'boutons' | 'apropos' | 'fondatrice' | 'reseaux' | 'options';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'identite', label: 'Identité du site' },
  { id: 'hero', label: 'Section Hero' },
  { id: 'boutons', label: 'Boutons d\'action' },
  { id: 'apropos', label: 'À propos' },
  { id: 'fondatrice', label: 'Fondatrice' },
  { id: 'reseaux', label: 'Réseaux sociaux' },
  { id: 'options', label: 'Options avancées' },
];

export default function CMSAccueil() {
  const [config, setConfig] = useState<SiteConfigMap>({});
  const [originalConfig, setOriginalConfig] = useState<SiteConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('identite');
  const [uploading, setUploading] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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

  const convertImageToJpeg = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (supportedTypes.includes(file.type)) { resolve(file); return; }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Canvas context unavailable')); return; }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) { reject(new Error('Conversion failed')); return; }
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const converted = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
          resolve(converted);
        }, 'image/jpeg', 0.92);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Format non supporté: ${file.type}`)); };
      img.src = url;
    });
  };

  const handleImageUpload = async (configKey: string, file: File) => {
    try {
      setUploading(configKey);
      setError(null);
      const processedFile = await convertImageToJpeg(file);
      const fileExt = processedFile.name.split('.').pop() || 'jpg';
      const fileName = `${configKey}-${Date.now()}.${fileExt}`;
      const filePath = `site/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('afrikher-public')
        .upload(filePath, processedFile, { cacheControl: '3600', upsert: true, contentType: processedFile.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('afrikher-public').getPublicUrl(filePath);
      updateConfig(configKey, urlData.publicUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError("Erreur d'upload: " + message);
    } finally {
      setUploading(null);
    }
  };

  // Reusable field row
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

  // Reusable image upload widget
  const ImageUploader = ({ configKey, currentUrl, aspectHint }: {
    configKey: string; currentUrl: string; aspectHint?: string;
  }) => (
    <div className="flex items-center gap-4">
      <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
        {currentUrl && !currentUrl.startsWith('/images/') ? (
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={20} className="text-gray-400" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${uploading === configKey ? 'opacity-50 cursor-wait' : ''}`}>
          {uploading === configKey ? (
            <><RefreshCw size={14} className="mr-2 animate-spin" /> Upload...</>
          ) : (
            <><Upload size={14} className="mr-2" /> Changer</>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(configKey, f); }}
            disabled={uploading === configKey}
          />
        </label>
        {aspectHint && <span className="text-xs text-gray-400">{aspectHint}</span>}
      </div>
    </div>
  );

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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Page d'accueil</h1>
        <div className="flex items-center gap-3">
          <a
            href="https://afrikher-client.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ExternalLink size={16} className="mr-2" />
            Voir le site
          </a>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasChanges
                ? 'bg-gray-900 text-slate-900 hover:bg-gray-800'
                : saved
                  ? 'bg-green-600 text-slate-900'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
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

      {/* Main layout: sidebar + content */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex min-h-[600px]">
          {/* Sidebar */}
          <nav className="w-52 border-r border-gray-200 py-4 shrink-0">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-6 py-2.5 text-sm transition-colors ${
                  activeSection === section.id
                    ? 'text-blue-600 bg-blue-50 font-medium border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 px-10 py-6">
            {/* IDENTITE */}
            {activeSection === 'identite' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Identité du site</h2>
                <p className="text-sm text-gray-500 mb-6">Logo, nom et slogan qui apparaissent sur tout le site.</p>

                <FieldRow label="Logo" description="Format PNG transparent recommandé. Max 500KB.">
                  <ImageUploader configKey="logo_url" currentUrl={config.logo_url || ''} aspectHint="PNG transparent, 300x80px idéal" />
                </FieldRow>

                <FieldRow label="Nom du site" description="Le nom principal affiché dans la navigation et le hero.">
                  <input type="text" value={config.site_name || ''} onChange={(e) => updateConfig('site_name', e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="AFRIKHER" />
                </FieldRow>

                <FieldRow label="Slogan / Tagline" description="Texte court sous le nom du site.">
                  <input type="text" value={config.site_tagline || ''} onChange={(e) => updateConfig('site_tagline', e.target.value)}
                    className="w-full max-w-lg px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="L'élégance hors du commun. Le Business au féminin." />
                </FieldRow>

                <FieldRow label="Badge hero" description="Petit texte affiché au-dessus du titre (ex: MAGAZINE ÉDITORIAL PREMIUM)." noBorder>
                  <input type="text" value={config.hero_badge || ''} onChange={(e) => updateConfig('hero_badge', e.target.value)}
                    className="w-full max-w-lg px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="MAGAZINE ÉDITORIAL PREMIUM" />
                </FieldRow>
              </div>
            )}

            {/* HERO */}
            {activeSection === 'hero' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Section Hero</h2>
                <p className="text-sm text-gray-500 mb-6">Le grand bloc principal visible en haut de la page d'accueil.</p>

                <FieldRow label="Titre principal" description="Le titre doré affiché en grand dans le hero.">
                  <input type="text" value={config.hero_title || ''} onChange={(e) => updateConfig('hero_title', e.target.value)}
                    className="w-full max-w-lg px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Découvrez AFRIKHER" />
                </FieldRow>

                <FieldRow label="Description" description="Texte de présentation sous le titre hero.">
                  <textarea value={config.site_description || ''} onChange={(e) => updateConfig('site_description', e.target.value)} rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Le magazine premium dédié à la femme africaine entrepreneure." />
                </FieldRow>

                <FieldRow label="Image de fond" description="L'image affichée en arrière-plan du hero. Format JPEG ou WebP, 1920x800px minimum.">
                  <div className="space-y-3">
                    <ImageUploader configKey="hero_image" currentUrl={config.hero_image || ''} aspectHint="JPEG/WebP, 1920x800px, max 2MB" />
                    <input type="text" value={config.hero_image || ''} onChange={(e) => updateConfig('hero_image', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ou collez une URL directement" />
                  </div>
                </FieldRow>

                <FieldRow label="Opacité du fond sombre" description="Contrôle la visibilité de l'image derrière le texte." noBorder>
                  <div className="flex items-center gap-4 max-w-md">
                    <input type="range" min="0" max="100" value={config.hero_overlay_opacity || '60'}
                      onChange={(e) => updateConfig('hero_overlay_opacity', e.target.value)} className="flex-1" />
                    <span className="text-sm text-gray-600 w-12 text-right font-medium">{config.hero_overlay_opacity || '60'}%</span>
                  </div>
                </FieldRow>
              </div>
            )}

            {/* BOUTONS */}
            {activeSection === 'boutons' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Boutons d'action</h2>
                <p className="text-sm text-gray-500 mb-6">Les boutons CTA affichés dans la section hero. Laissez vide pour masquer.</p>

                <FieldRow label="Bouton principal" description="Le premier bouton, mis en avant avec un style rempli.">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Texte</label>
                        <input type="text" value={config.hero_cta1_text || ''} onChange={(e) => updateConfig('hero_cta1_text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Découvrir le magazine" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Lien</label>
                        <input type="text" value={config.hero_cta1_link || ''} onChange={(e) => updateConfig('hero_cta1_link', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="/magazine" />
                      </div>
                    </div>
                  </div>
                </FieldRow>

                <FieldRow label="Bouton secondaire" description="Le second bouton, plus discret avec un style contour." noBorder>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Texte</label>
                        <input type="text" value={config.hero_cta2_text || ''} onChange={(e) => updateConfig('hero_cta2_text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="S'abonner" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Lien</label>
                        <input type="text" value={config.hero_cta2_link || ''} onChange={(e) => updateConfig('hero_cta2_link', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="/abonnement" />
                      </div>
                    </div>
                  </div>
                </FieldRow>
              </div>
            )}

            {/* A PROPOS */}
            {activeSection === 'apropos' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Section À propos</h2>
                <p className="text-sm text-gray-500 mb-6">Le bloc de présentation affiché sur la page d'accueil.</p>

                <FieldRow label="Titre" description="Titre de la section à propos sur l'accueil.">
                  <input type="text" value={config.about_title || ''} onChange={(e) => updateConfig('about_title', e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Plus qu'un magazine" />
                </FieldRow>

                <FieldRow label="Texte" description="Paragraphe de présentation. Décrivez votre mission et votre vision.">
                  <div>
                    <textarea value={config.about_text || ''} onChange={(e) => updateConfig('about_text', e.target.value)} rows={5}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="AFRIKHER est une plateforme d'inspiration, de visibilité et d'influence..." />
                    <p className="text-xs text-gray-400 mt-1">{(config.about_text || '').length} caractères</p>
                  </div>
                </FieldRow>

                <FieldRow label="Image" description="Image illustrant la section à propos." noBorder>
                  <ImageUploader configKey="about_image" currentUrl={config.about_image || ''} aspectHint="JPEG, 800x600px recommandé" />
                </FieldRow>
              </div>
            )}

            {/* FONDATRICE */}
            {activeSection === 'fondatrice' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Fondatrice</h2>
                <p className="text-sm text-gray-500 mb-6">Informations sur la fondatrice, affichées dans la page "Qui sommes-nous".</p>

                <FieldRow label="Photo" description="Portrait de la fondatrice.">
                  <ImageUploader configKey="foundress_photo" currentUrl={config.foundress_photo || ''} aspectHint="Portrait carré, 400x400px" />
                </FieldRow>

                <FieldRow label="Nom complet" description="Le nom complet de la fondatrice.">
                  <input type="text" value={config.foundress_name || ''} onChange={(e) => updateConfig('foundress_name', e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Hadassa Hélène EKILA-LUMANDE" />
                </FieldRow>

                <FieldRow label="Titre / Rôle" description="Son rôle ou titre professionnel.">
                  <input type="text" value={config.foundress_title || ''} onChange={(e) => updateConfig('foundress_title', e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Fondatrice & CEO" />
                </FieldRow>

                <FieldRow label="Biographie" description="Texte de présentation de la fondatrice." noBorder>
                  <textarea value={config.foundress_bio || ''} onChange={(e) => updateConfig('foundress_bio', e.target.value)} rows={5}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Entrepreneure engagée..." />
                </FieldRow>
              </div>
            )}

            {/* RESEAUX */}
            {activeSection === 'reseaux' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Réseaux sociaux</h2>
                <p className="text-sm text-gray-500 mb-6">Liens vers vos réseaux et moyens de contact, affichés dans le footer et la page contact.</p>

                <FieldRow label="Email de contact" description="L'adresse email principale affichée sur le site.">
                  <input type="email" value={config.contact_email || ''} onChange={(e) => updateConfig('contact_email', e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="hadassa.ekilalumande@afrikher.com" />
                </FieldRow>

                <FieldRow label="Lien WhatsApp" description="Lien d'invitation au groupe WhatsApp communautaire.">
                  <input type="url" value={config.whatsapp_link || ''} onChange={(e) => updateConfig('whatsapp_link', e.target.value)}
                    className="w-full max-w-lg px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://chat.whatsapp.com/..." />
                </FieldRow>

                <FieldRow label="Instagram" description="URL de votre page Instagram.">
                  <input type="url" value={config.social_instagram || ''} onChange={(e) => updateConfig('social_instagram', e.target.value)}
                    className="w-full max-w-lg px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://instagram.com/afrikher" />
                </FieldRow>

                <FieldRow label="Facebook" description="URL de votre page Facebook.">
                  <input type="url" value={config.social_facebook || ''} onChange={(e) => updateConfig('social_facebook', e.target.value)}
                    className="w-full max-w-lg px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://facebook.com/afrikher" />
                </FieldRow>

                <FieldRow label="LinkedIn" description="URL de votre page LinkedIn." noBorder>
                  <input type="url" value={config.social_linkedin || ''} onChange={(e) => updateConfig('social_linkedin', e.target.value)}
                    className="w-full max-w-lg px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://linkedin.com/company/afrikher" />
                </FieldRow>
              </div>
            )}

            {/* OPTIONS AVANCEES */}
            {activeSection === 'options' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Options avancées</h2>
                <p className="text-sm text-gray-500 mb-6">Carousel, alignement et options d'affichage du hero.</p>

                <FieldRow label="Mode Carousel" description="Faire défiler plusieurs images dans le hero au lieu d'une image fixe.">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateConfig('hero_carousel_enabled', config.hero_carousel_enabled === 'true' ? 'false' : 'true')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.hero_carousel_enabled === 'true' ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.hero_carousel_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-sm text-gray-600">{config.hero_carousel_enabled === 'true' ? 'Activé' : 'Désactivé'}</span>
                  </div>
                </FieldRow>

                {config.hero_carousel_enabled === 'true' && (
                  <FieldRow label="Images du carousel" description="URLs des images, séparées par des virgules. Utilisez le bouton pour uploader.">
                    <div className="space-y-3">
                      <textarea value={config.hero_carousel_images || ''} onChange={(e) => updateConfig('hero_carousel_images', e.target.value)} rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="https://image1.jpg, https://image2.jpg" />
                      <label className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${uploading === 'hero_carousel' ? 'opacity-50' : ''}`}>
                        {uploading === 'hero_carousel' ? <><RefreshCw size={14} className="mr-2 animate-spin" /> Upload...</> : <><Upload size={14} className="mr-2" /> Ajouter une image</>}
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          setUploading('hero_carousel');
                          try {
                            const processedFile = await convertImageToJpeg(file);
                            const fileExt = processedFile.name.split('.').pop() || 'jpg';
                            const fileName = `carousel-${Date.now()}.${fileExt}`;
                            const filePath = `site/${fileName}`;
                            const { error: uploadErr } = await supabase.storage.from('afrikher-public').upload(filePath, processedFile, { cacheControl: '3600', upsert: true, contentType: processedFile.type });
                            if (uploadErr) throw uploadErr;
                            const { data: urlData } = supabase.storage.from('afrikher-public').getPublicUrl(filePath);
                            const current = config.hero_carousel_images || '';
                            updateConfig('hero_carousel_images', current ? `${current}, ${urlData.publicUrl}` : urlData.publicUrl);
                          } catch (err: unknown) { setError('Erreur upload carousel: ' + (err instanceof Error ? err.message : 'Inconnu')); }
                          finally { setUploading(null); }
                        }} disabled={uploading === 'hero_carousel'} />
                      </label>
                    </div>
                  </FieldRow>
                )}

                <FieldRow label="Alignement du contenu" description="Positionnement du texte dans la section hero.">
                  <div className="flex gap-2">
                    {[{ value: 'left', label: 'Gauche' }, { value: 'center', label: 'Centré' }, { value: 'right', label: 'Droite' }].map((opt) => (
                      <button key={opt.value} onClick={() => updateConfig('hero_alignment', opt.value)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          (config.hero_alignment || 'left') === opt.value
                            ? 'bg-gray-900 text-slate-900 border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}>{opt.label}</button>
                    ))}
                  </div>
                </FieldRow>

                <FieldRow label="Couleur principale" description="La couleur dorée utilisée comme accent sur tout le site." noBorder>
                  <div className="flex items-center gap-3">
                    <input type="color" value={config.primary_color || '#C9A84C'} onChange={(e) => updateConfig('primary_color', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer" />
                    <input type="text" value={config.primary_color || '#C9A84C'} onChange={(e) => updateConfig('primary_color', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="#C9A84C" />
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
