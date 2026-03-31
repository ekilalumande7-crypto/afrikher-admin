import { useEffect, useState, useCallback } from 'react';
import {
  Save, Upload, RefreshCw, Check, AlertCircle,
  ExternalLink, Image as ImageIcon, Monitor, Smartphone
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
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

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
    <div className={`py-5 ${noBorder ? '' : 'border-b border-gray-100'}`}>
      <div className="flex items-start justify-between gap-6">
        <div className="w-56 shrink-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
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
      <div className="w-20 h-14 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
        {currentUrl && !currentUrl.startsWith('/images/') ? (
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={18} className="text-gray-400" />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={`inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${uploading === configKey ? 'opacity-50 cursor-wait' : ''}`}>
          {uploading === configKey ? (
            <><RefreshCw size={12} className="mr-1.5 animate-spin" /> Upload...</>
          ) : (
            <><Upload size={12} className="mr-1.5" /> Changer</>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(configKey, f); }}
            disabled={uploading === configKey}
          />
        </label>
        {aspectHint && <span className="text-[10px] text-gray-400">{aspectHint}</span>}
      </div>
    </div>
  );

  // ===== LIVE PREVIEW COMPONENT =====
  const LivePreview = () => {
    const goldColor = config.primary_color || '#C9A84C';
    const hasHeroImage = config.hero_image && !config.hero_image.startsWith('/images/');
    const alignment = config.hero_alignment || 'left';
    const alignClass = alignment === 'center' ? 'items-center text-center' :
                       alignment === 'right' ? 'items-end text-right' : 'items-start text-left';
    const isMobile = previewMode === 'mobile';

    return (
      <div className="h-full flex flex-col">
        {/* Preview header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 shrink-0">
          <span className="text-xs font-semibold text-gray-600">Aperçu en direct</span>
          <div className="flex items-center gap-1 bg-white border border-gray-200 p-0.5 rounded-md">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-1 rounded transition-colors ${previewMode === 'desktop' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Monitor size={12} />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-1 rounded transition-colors ${previewMode === 'mobile' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Smartphone size={12} />
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div
            className={`mx-auto rounded-lg overflow-hidden shadow-lg transition-all ${isMobile ? 'w-[280px]' : 'w-full'}`}
            style={{ minHeight: isMobile ? '500px' : '100%' }}
          >
            {/* ===== NAVBAR PREVIEW ===== */}
            <div className="bg-[#0A0A0A] px-4 py-3 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2">
                {config.logo_url && !config.logo_url.startsWith('/images/') ? (
                  <img src={config.logo_url} alt="" className="h-5 object-contain" />
                ) : (
                  <span className="text-xs font-bold tracking-wider" style={{ color: goldColor, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                    {config.site_name || 'AFRIKHER'}
                  </span>
                )}
              </div>
              {!isMobile && (
                <div className="flex items-center gap-3">
                  {['Magazine', 'Rubriques', 'Boutique', 'Contact'].map(item => (
                    <span key={item} className="text-[8px] text-gray-400 tracking-wider uppercase">{item}</span>
                  ))}
                  <span className="text-[8px] px-2 py-0.5 border text-gray-300 rounded" style={{ borderColor: goldColor, color: goldColor }}>SE CONNECTER</span>
                </div>
              )}
            </div>

            {/* ===== HERO PREVIEW ===== */}
            <div
              className="relative"
              style={{
                minHeight: isMobile ? '350px' : '280px',
                backgroundImage: hasHeroImage ? `url(${config.hero_image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#0A0A0A',
              }}
            >
              {/* Overlay */}
              <div className="absolute inset-0" style={{ backgroundColor: `rgba(10, 10, 10, ${parseInt(config.hero_overlay_opacity || '60') / 100})` }} />

              {/* Hero content */}
              <div className={`relative z-10 p-5 flex flex-col justify-center h-full ${alignClass}`} style={{ minHeight: isMobile ? '350px' : '280px' }}>
                {/* Badge */}
                <p className="text-gray-500 tracking-[0.15em] uppercase mb-2" style={{ fontSize: isMobile ? '6px' : '7px' }}>
                  — {config.hero_badge || 'MAGAZINE ÉDITORIAL PREMIUM'}
                </p>

                {/* Site name */}
                <h1
                  className="font-bold tracking-wider mb-1"
                  style={{
                    color: goldColor,
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: isMobile ? '24px' : '32px',
                  }}
                >
                  {config.site_name || 'AFRIKHER'}
                </h1>

                {/* Tagline */}
                <p className="italic text-gray-400 mb-2" style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: isMobile ? '10px' : '11px',
                }}>
                  {config.site_tagline || "L'élégance hors du commun."}
                </p>

                {/* Hero title */}
                <h2 className="font-serif mb-1" style={{
                  color: `${goldColor}cc`,
                  fontSize: isMobile ? '14px' : '16px',
                }}>
                  {config.hero_title || 'Découvrez AFRIKHER'}
                </h2>

                {/* Description */}
                <p className="text-gray-500 mb-4 max-w-xs" style={{ fontSize: isMobile ? '8px' : '9px', lineHeight: '1.5' }}>
                  {config.site_description || 'Le magazine premium dédié à la femme africaine entrepreneure.'}
                </p>

                {/* CTA Buttons */}
                <div className="flex items-center gap-2">
                  {config.hero_cta1_text && (
                    <span
                      className="font-bold tracking-wider uppercase"
                      style={{
                        border: `1px solid ${goldColor}`,
                        color: goldColor,
                        padding: isMobile ? '4px 10px' : '5px 12px',
                        fontSize: isMobile ? '6px' : '7px',
                      }}
                    >
                      {config.hero_cta1_text}
                    </span>
                  )}
                  {config.hero_cta2_text && (
                    <span
                      className="font-bold tracking-wider uppercase"
                      style={{
                        border: `1px solid ${goldColor}50`,
                        color: `${goldColor}99`,
                        padding: isMobile ? '4px 10px' : '5px 12px',
                        fontSize: isMobile ? '6px' : '7px',
                      }}
                    >
                      {config.hero_cta2_text}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ===== ABOUT SECTION PREVIEW ===== */}
            <div className="bg-[#F5F0E8] px-5 py-6">
              <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'items-center'}`}>
                <div className="flex-1">
                  <p className="text-[7px] tracking-[0.15em] uppercase text-gray-500 mb-1">— À PROPOS</p>
                  <h3 className="font-bold text-[#0A0A0A] mb-2" style={{
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: isMobile ? '14px' : '16px',
                  }}>
                    {config.about_title || "Plus qu'un magazine"}
                  </h3>
                  <p className="text-gray-600 leading-relaxed" style={{ fontSize: '8px' }}>
                    {(config.about_text || "AFRIKHER est une plateforme d'inspiration...").substring(0, 150)}
                    {(config.about_text || '').length > 150 ? '...' : ''}
                  </p>
                </div>
                {config.about_image && !config.about_image.startsWith('/images/') && (
                  <div className={`${isMobile ? 'w-full h-24' : 'w-28 h-20'} rounded-lg overflow-hidden shrink-0`}>
                    <img src={config.about_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* ===== FOUNDRESS PREVIEW ===== */}
            {(config.foundress_name || config.foundress_bio) && (
              <div className="bg-[#0A0A0A] px-5 py-5">
                <div className={`flex gap-4 items-center ${isMobile ? 'flex-col text-center' : ''}`}>
                  {config.foundress_photo && !config.foundress_photo.startsWith('/images/') && (
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2" style={{ borderColor: goldColor }}>
                      <img src={config.foundress_photo} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-white" style={{ fontSize: '10px', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                      {config.foundress_name || 'Nom de la fondatrice'}
                    </p>
                    <p className="text-[8px]" style={{ color: goldColor }}>
                      {config.foundress_title || 'Fondatrice & CEO'}
                    </p>
                    {config.foundress_bio && (
                      <p className="text-gray-500 mt-1" style={{ fontSize: '7px', lineHeight: '1.4' }}>
                        {config.foundress_bio.substring(0, 100)}{config.foundress_bio.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== FOOTER PREVIEW ===== */}
            <div className="bg-[#0A0A0A] border-t border-gray-800 px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[7px] text-gray-600">© 2026 {config.site_name || 'AFRIKHER'}</span>
                <div className="flex gap-2">
                  {config.social_instagram && <span className="text-[7px] text-gray-500">Instagram</span>}
                  {config.social_facebook && <span className="text-[7px] text-gray-500">Facebook</span>}
                  {config.social_linkedin && <span className="text-[7px] text-gray-500">LinkedIn</span>}
                </div>
              </div>
              {config.contact_email && (
                <p className="text-[7px] text-gray-600 mt-1">{config.contact_email}</p>
              )}
            </div>
          </div>
        </div>
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

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
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
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : saved
                  ? 'bg-green-600 text-white'
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
        <div className="flex items-center gap-3 p-3 mb-3 bg-red-50 border border-red-200 rounded-lg shrink-0">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-sm text-red-500 hover:text-red-700 font-medium">Fermer</button>
        </div>
      )}
      {hasChanges && (
        <div className="flex items-center gap-3 p-3 mb-3 bg-amber-50 border border-amber-200 rounded-lg shrink-0">
          <AlertCircle size={14} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">Modifications non enregistrées.</p>
        </div>
      )}

      {/* ===== MAIN LAYOUT: Settings left + Preview right ===== */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* LEFT PANEL: Settings */}
        <div className="w-[55%] bg-white border border-gray-200 rounded-xl overflow-hidden flex min-h-0">
          {/* Sidebar */}
          <nav className="w-44 border-r border-gray-200 py-3 shrink-0 overflow-auto">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  activeSection === section.id
                    ? 'text-blue-600 bg-blue-50 font-medium border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* Form content */}
          <div className="flex-1 px-6 py-4 overflow-auto">
            {/* IDENTITE */}
            {activeSection === 'identite' && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Identité du site</h2>
                <p className="text-xs text-gray-500 mb-4">Logo, nom et slogan affichés sur tout le site.</p>

                <FieldRow label="Logo" description="PNG transparent, max 500KB.">
                  <ImageUploader configKey="logo_url" currentUrl={config.logo_url || ''} aspectHint="300x80px idéal" />
                </FieldRow>

                <FieldRow label="Nom du site" description="Affiché dans la navigation et le hero.">
                  <input type="text" value={config.site_name || ''} onChange={(e) => updateConfig('site_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="AFRIKHER" />
                </FieldRow>

                <FieldRow label="Slogan" description="Texte court sous le nom.">
                  <input type="text" value={config.site_tagline || ''} onChange={(e) => updateConfig('site_tagline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="L'élégance hors du commun." />
                </FieldRow>

                <FieldRow label="Badge hero" description="Petit texte au-dessus du titre." noBorder>
                  <input type="text" value={config.hero_badge || ''} onChange={(e) => updateConfig('hero_badge', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="MAGAZINE ÉDITORIAL PREMIUM" />
                </FieldRow>
              </div>
            )}

            {/* HERO */}
            {activeSection === 'hero' && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Section Hero</h2>
                <p className="text-xs text-gray-500 mb-4">Le grand bloc en haut de la page d'accueil.</p>

                <FieldRow label="Titre principal" description="Titre doré en grand dans le hero.">
                  <input type="text" value={config.hero_title || ''} onChange={(e) => updateConfig('hero_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Découvrez AFRIKHER" />
                </FieldRow>

                <FieldRow label="Description" description="Texte sous le titre hero.">
                  <textarea value={config.site_description || ''} onChange={(e) => updateConfig('site_description', e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Le magazine premium..." />
                </FieldRow>

                <FieldRow label="Image de fond" description="JPEG/WebP, 1920x800px min.">
                  <div className="space-y-2">
                    <ImageUploader configKey="hero_image" currentUrl={config.hero_image || ''} aspectHint="1920x800px, max 2MB" />
                    <input type="text" value={config.hero_image || ''} onChange={(e) => updateConfig('hero_image', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-[11px] text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ou collez une URL" />
                  </div>
                </FieldRow>

                <FieldRow label="Opacité du fond" description="Assombrissement sur l'image." noBorder>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0" max="100" value={config.hero_overlay_opacity || '60'}
                      onChange={(e) => updateConfig('hero_overlay_opacity', e.target.value)} className="flex-1" />
                    <span className="text-sm text-gray-600 w-10 text-right font-medium">{config.hero_overlay_opacity || '60'}%</span>
                  </div>
                </FieldRow>
              </div>
            )}

            {/* BOUTONS */}
            {activeSection === 'boutons' && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Boutons d'action</h2>
                <p className="text-xs text-gray-500 mb-4">Boutons CTA dans le hero. Laissez vide pour masquer.</p>

                <FieldRow label="Bouton principal" description="Premier bouton, style rempli.">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">Texte</label>
                      <input type="text" value={config.hero_cta1_text || ''} onChange={(e) => updateConfig('hero_cta1_text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Découvrir" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">Lien</label>
                      <input type="text" value={config.hero_cta1_link || ''} onChange={(e) => updateConfig('hero_cta1_link', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="/magazine" />
                    </div>
                  </div>
                </FieldRow>

                <FieldRow label="Bouton secondaire" description="Second bouton, style contour." noBorder>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">Texte</label>
                      <input type="text" value={config.hero_cta2_text || ''} onChange={(e) => updateConfig('hero_cta2_text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="S'abonner" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">Lien</label>
                      <input type="text" value={config.hero_cta2_link || ''} onChange={(e) => updateConfig('hero_cta2_link', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="/abonnement" />
                    </div>
                  </div>
                </FieldRow>
              </div>
            )}

            {/* A PROPOS */}
            {activeSection === 'apropos' && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Section À propos</h2>
                <p className="text-xs text-gray-500 mb-4">Bloc de présentation sur la page d'accueil.</p>

                <FieldRow label="Titre" description="Titre de la section.">
                  <input type="text" value={config.about_title || ''} onChange={(e) => updateConfig('about_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Plus qu'un magazine" />
                </FieldRow>

                <FieldRow label="Texte" description="Paragraphe de présentation.">
                  <div>
                    <textarea value={config.about_text || ''} onChange={(e) => updateConfig('about_text', e.target.value)} rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                    <p className="text-[10px] text-gray-400 mt-1">{(config.about_text || '').length} caractères</p>
                  </div>
                </FieldRow>

                <FieldRow label="Image" description="Image d'illustration." noBorder>
                  <ImageUploader configKey="about_image" currentUrl={config.about_image || ''} aspectHint="800x600px" />
                </FieldRow>
              </div>
            )}

            {/* FONDATRICE */}
            {activeSection === 'fondatrice' && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Fondatrice</h2>
                <p className="text-xs text-gray-500 mb-4">Page "Qui sommes-nous".</p>

                <FieldRow label="Photo" description="Portrait.">
                  <ImageUploader configKey="foundress_photo" currentUrl={config.foundress_photo || ''} aspectHint="400x400px" />
                </FieldRow>

                <FieldRow label="Nom complet">
                  <input type="text" value={config.foundress_name || ''} onChange={(e) => updateConfig('foundress_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Hadassa Hélène EKILA-LUMANDE" />
                </FieldRow>

                <FieldRow label="Titre / Rôle">
                  <input type="text" value={config.foundress_title || ''} onChange={(e) => updateConfig('foundress_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Fondatrice & CEO" />
                </FieldRow>

                <FieldRow label="Biographie" noBorder>
                  <textarea value={config.foundress_bio || ''} onChange={(e) => updateConfig('foundress_bio', e.target.value)} rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                </FieldRow>
              </div>
            )}

            {/* RESEAUX */}
            {activeSection === 'reseaux' && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Réseaux sociaux</h2>
                <p className="text-xs text-gray-500 mb-4">Liens affichés dans le footer et la page contact.</p>

                <FieldRow label="Email de contact">
                  <input type="email" value={config.contact_email || ''} onChange={(e) => updateConfig('contact_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="hadassa@afrikher.com" />
                </FieldRow>

                <FieldRow label="WhatsApp">
                  <input type="url" value={config.whatsapp_link || ''} onChange={(e) => updateConfig('whatsapp_link', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://chat.whatsapp.com/..." />
                </FieldRow>

                <FieldRow label="Instagram">
                  <input type="url" value={config.social_instagram || ''} onChange={(e) => updateConfig('social_instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://instagram.com/afrikher" />
                </FieldRow>

                <FieldRow label="Facebook">
                  <input type="url" value={config.social_facebook || ''} onChange={(e) => updateConfig('social_facebook', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://facebook.com/afrikher" />
                </FieldRow>

                <FieldRow label="LinkedIn" noBorder>
                  <input type="url" value={config.social_linkedin || ''} onChange={(e) => updateConfig('social_linkedin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://linkedin.com/company/afrikher" />
                </FieldRow>
              </div>
            )}

            {/* OPTIONS */}
            {activeSection === 'options' && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Options avancées</h2>
                <p className="text-xs text-gray-500 mb-4">Carousel, alignement et couleur.</p>

                <FieldRow label="Carousel" description="Plusieurs images dans le hero.">
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
                  <FieldRow label="Images carousel" description="URLs séparées par virgules.">
                    <div className="space-y-2">
                      <textarea value={config.hero_carousel_images || ''} onChange={(e) => updateConfig('hero_carousel_images', e.target.value)} rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="https://image1.jpg, https://image2.jpg" />
                      <label className={`inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${uploading === 'hero_carousel' ? 'opacity-50' : ''}`}>
                        {uploading === 'hero_carousel' ? <><RefreshCw size={12} className="mr-1.5 animate-spin" /> Upload...</> : <><Upload size={12} className="mr-1.5" /> Ajouter</>}
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          setUploading('hero_carousel');
                          try {
                            const p = await convertImageToJpeg(file);
                            const fp = `site/carousel-${Date.now()}.${p.name.split('.').pop() || 'jpg'}`;
                            const { error: ue } = await supabase.storage.from('afrikher-public').upload(fp, p, { cacheControl: '3600', upsert: true, contentType: p.type });
                            if (ue) throw ue;
                            const { data: ud } = supabase.storage.from('afrikher-public').getPublicUrl(fp);
                            const cur = config.hero_carousel_images || '';
                            updateConfig('hero_carousel_images', cur ? `${cur}, ${ud.publicUrl}` : ud.publicUrl);
                          } catch (err: unknown) { setError('Erreur: ' + (err instanceof Error ? err.message : 'Inconnu')); }
                          finally { setUploading(null); }
                        }} disabled={uploading === 'hero_carousel'} />
                      </label>
                    </div>
                  </FieldRow>
                )}

                <FieldRow label="Alignement" description="Position du texte dans le hero.">
                  <div className="flex gap-2">
                    {[{ value: 'left', label: 'Gauche' }, { value: 'center', label: 'Centré' }, { value: 'right', label: 'Droite' }].map((opt) => (
                      <button key={opt.value} onClick={() => updateConfig('hero_alignment', opt.value)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          (config.hero_alignment || 'left') === opt.value
                            ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}>{opt.label}</button>
                    ))}
                  </div>
                </FieldRow>

                <FieldRow label="Couleur principale" description="Accent doré du site." noBorder>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.primary_color || '#C9A84C'} onChange={(e) => updateConfig('primary_color', e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={config.primary_color || '#C9A84C'} onChange={(e) => updateConfig('primary_color', e.target.value)}
                      className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </FieldRow>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Live Preview (always visible) */}
        <div className="w-[45%] bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col min-h-0">
          <LivePreview />
        </div>
      </div>
    </div>
  );
}
