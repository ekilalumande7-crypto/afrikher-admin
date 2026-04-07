import { useEffect, useState, useCallback } from 'react';
import {
  Save,
  Upload,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SiteConfigMap {
  [key: string]: string;
}

type SectionId =
  | 'identite'
  | 'hero'
  | 'boutons'
  | 'apropos'
  | 'fondatrice'
  | 'reseaux'
  | 'options';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'identite', label: 'Identité du site' },
  { id: 'hero', label: 'Section hero' },
  { id: 'boutons', label: "Boutons d'action" },
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

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    const changed = Object.keys(config).some((key) => config[key] !== originalConfig[key]);
    setHasChanges(changed);
  }, [config, originalConfig]);

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const changedKeys = Object.keys(config).filter(
        (key) => config[key] !== originalConfig[key]
      );

      if (changedKeys.length === 0) {
        setSaved(true);
        setSaving(false);
        return;
      }

      for (const key of changedKeys) {
        const { error: upsertError } = await supabase
          .from('site_config')
          .upsert(
            { key, value: config[key], updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );

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
      const supportedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/svg+xml',
      ];

      if (supportedTypes.includes(file.type)) {
        resolve(file);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error('Conversion failed'));
              return;
            }
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const converted = new File([blob], `${baseName}.jpg`, {
              type: 'image/jpeg',
            });
            resolve(converted);
          },
          'image/jpeg',
          0.92
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Format non supporté: ${file.type}`));
      };

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
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: processedFile.type,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('afrikher-public')
        .getPublicUrl(filePath);

      updateConfig(configKey, urlData.publicUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError("Erreur d'upload: " + message);
    } finally {
      setUploading(null);
    }
  };

  const FieldRow = ({
    label,
    description,
    children,
    noBorder,
  }: {
    label: string;
    description?: string;
    children: React.ReactNode;
    noBorder?: boolean;
  }) => (
    <div className={`py-6 ${noBorder ? '' : 'border-b border-[#0A0A0A]/8'}`}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-10">
        <div className="xl:w-72 xl:shrink-0">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#0A0A0A]">
            {label}
          </p>
          {description ? (
            <p className="mt-2 text-sm leading-7 text-[#9A9A8A]">{description}</p>
          ) : null}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );

  const inputClass =
    'h-12 w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#9A9A8A] focus:border-[#C9A84C]';

  const textareaClass =
    'w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 py-3 text-sm leading-7 text-[#0A0A0A] outline-none transition-colors placeholder:text-[#9A9A8A] focus:border-[#C9A84C] resize-none';

  const subtleLabelClass = 'mb-2 block text-[0.62rem] uppercase tracking-[0.2em] text-[#9A9A8A]';

  const ImageUploader = ({
    configKey,
    currentUrl,
    aspectHint,
  }: {
    configKey: string;
    currentUrl: string;
    aspectHint?: string;
  }) => (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex h-24 w-32 items-center justify-center overflow-hidden border border-[#0A0A0A]/10 bg-[#FBF8F2]">
        {currentUrl && !currentUrl.startsWith('/images/') ? (
          <img src={currentUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={18} className="text-[#9A9A8A]" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label
          className={`inline-flex h-11 items-center justify-center border border-[#0A0A0A]/10 bg-white px-5 text-[0.68rem] uppercase tracking-[0.22em] text-[#0A0A0A] transition-colors hover:border-[#C9A84C]/35 hover:bg-[#FBF8F2] cursor-pointer ${
            uploading === configKey ? 'opacity-50 cursor-wait' : ''
          }`}
        >
          {uploading === configKey ? (
            <>
              <RefreshCw size={14} className="mr-2 animate-spin" />
              Import...
            </>
          ) : (
            <>
              <Upload size={14} className="mr-2" />
              Changer
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageUpload(configKey, f);
            }}
            disabled={uploading === configKey}
          />
        </label>
        {aspectHint ? (
          <span className="text-xs leading-6 text-[#9A9A8A]">{aspectHint}</span>
        ) : null}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-[#9A9A8A]" />
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
            Chargement
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#C9A84C]">
            CMS principal
          </p>
          <h1 className="mt-2 font-serif text-[2.5rem] leading-[0.94] tracking-[-0.03em] text-[#0A0A0A] md:text-[3.4rem]">
            Accueil
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9A9A8A]">
            Structurez la page la plus visible du site avec une interface plus calme,
            plus lisible et entièrement alignée sur l’identité AFRIKHER.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://afrikher-client.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-3 border border-[#0A0A0A]/10 bg-white px-5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]"
          >
            <ExternalLink size={15} />
            Voir le site
          </a>

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`inline-flex h-12 items-center justify-center gap-3 border px-6 text-[0.68rem] font-semibold uppercase tracking-[0.22em] transition-colors ${
              hasChanges
                ? 'border-[#0A0A0A] bg-[#0A0A0A] text-[#F5F0E8] hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A0A0A]'
                : saved
                  ? 'border-[#C9A84C]/25 bg-[#EFE6D0] text-[#8A6E2F]'
                  : 'border-[#0A0A0A]/10 bg-white text-[#9A9A8A] cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Enregistrement...
              </>
            ) : saved ? (
              <>
                <Check size={14} />
                Enregistré
              </>
            ) : (
              <>
                <Save size={14} />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {error ? (
        <Notice tone="error" message={error} onClose={() => setError(null)} />
      ) : null}

      {hasChanges ? (
        <Notice
          tone="warning"
          message="Modifications non enregistrées."
          onClose={() => setHasChanges(hasChanges)}
          dismissible={false}
        />
      ) : null}

      <div className="border border-[#0A0A0A]/10 bg-white overflow-hidden">
        <div className="flex min-h-[680px] flex-col xl:flex-row">
          <nav className="border-b border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 py-4 xl:w-64 xl:shrink-0 xl:border-b-0 xl:border-r xl:px-0 xl:py-6">
            <div className="flex gap-2 overflow-x-auto xl:block xl:space-y-1">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`shrink-0 border px-4 py-3 text-[0.68rem] uppercase tracking-[0.2em] transition-colors xl:block xl:w-full xl:border-0 xl:px-6 xl:py-3 xl:text-left ${
                    activeSection === section.id
                      ? 'border-[#C9A84C] bg-[#EFE6D0] text-[#8A6E2F] xl:border-l-2 xl:border-y-0 xl:border-r-0 xl:border-l-[#C9A84C] xl:bg-transparent'
                      : 'border-[#0A0A0A]/10 bg-white text-[#9A9A8A] hover:border-[#C9A84C]/30 hover:text-[#0A0A0A] xl:bg-transparent'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex-1 px-6 py-6 md:px-8 xl:px-10">
            {activeSection === 'identite' && (
              <SectionBlock
                title="Identité du site"
                description="Logo, nom et slogan qui accompagnent toute la perception de marque."
              >
                <FieldRow
                  label="Logo"
                  description="Format PNG transparent recommandé. Max 500KB."
                >
                  <ImageUploader
                    configKey="logo_url"
                    currentUrl={config.logo_url || ''}
                    aspectHint="PNG transparent, 300x80px idéal"
                  />
                </FieldRow>

                <FieldRow
                  label="Nom du site"
                  description="Le nom principal affiché dans la navigation et le hero."
                >
                  <input
                    type="text"
                    value={config.site_name || ''}
                    onChange={(e) => updateConfig('site_name', e.target.value)}
                    className={`${inputClass} max-w-md`}
                    placeholder="AFRIKHER"
                  />
                </FieldRow>

                <FieldRow
                  label="Slogan / Tagline"
                  description="Texte court sous le nom du site."
                >
                  <input
                    type="text"
                    value={config.site_tagline || ''}
                    onChange={(e) => updateConfig('site_tagline', e.target.value)}
                    className={`${inputClass} max-w-2xl`}
                    placeholder="L'élégance hors du commun. Le Business au féminin."
                  />
                </FieldRow>

                <FieldRow
                  label="Badge hero"
                  description="Petit texte au-dessus du titre du hero."
                  noBorder
                >
                  <input
                    type="text"
                    value={config.hero_badge || ''}
                    onChange={(e) => updateConfig('hero_badge', e.target.value)}
                    className={`${inputClass} max-w-2xl`}
                    placeholder="MAGAZINE ÉDITORIAL PREMIUM"
                  />
                </FieldRow>
              </SectionBlock>
            )}

            {activeSection === 'hero' && (
              <SectionBlock
                title="Section hero"
                description="Le bloc principal de la page d’accueil, là où se joue la première impression."
              >
                <FieldRow
                  label="Titre principal"
                  description="Le titre majeur affiché dans le hero."
                >
                  <input
                    type="text"
                    value={config.hero_title || ''}
                    onChange={(e) => updateConfig('hero_title', e.target.value)}
                    className={`${inputClass} max-w-2xl`}
                    placeholder="Découvrez AFRIKHER"
                  />
                </FieldRow>

                <FieldRow
                  label="Description"
                  description="Texte d’accompagnement sous le titre principal."
                >
                  <textarea
                    value={config.site_description || ''}
                    onChange={(e) => updateConfig('site_description', e.target.value)}
                    rows={4}
                    className={textareaClass}
                    placeholder="Le magazine premium dédié à la femme africaine entrepreneure."
                  />
                </FieldRow>

                <FieldRow
                  label="Image de fond"
                  description="Image de fond du hero. Format large recommandé."
                >
                  <div className="space-y-3">
                    <ImageUploader
                      configKey="hero_image"
                      currentUrl={config.hero_image || ''}
                      aspectHint="JPEG/WebP, 1920x800px, max 2MB"
                    />
                    <input
                      type="text"
                      value={config.hero_image || ''}
                      onChange={(e) => updateConfig('hero_image', e.target.value)}
                      className={`${inputClass} h-11 text-xs`}
                      placeholder="Ou collez une URL directement"
                    />
                  </div>
                </FieldRow>

                <FieldRow
                  label="Opacité du fond sombre"
                  description="Contrôle la lisibilité du texte sur l’image."
                  noBorder
                >
                  <div className="max-w-md space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.hero_overlay_opacity || '60'}
                      onChange={(e) => updateConfig('hero_overlay_opacity', e.target.value)}
                      className="w-full accent-[#C9A84C]"
                    />
                    <p className="text-sm text-[#9A9A8A]">
                      {config.hero_overlay_opacity || '60'}%
                    </p>
                  </div>
                </FieldRow>
              </SectionBlock>
            )}

            {activeSection === 'boutons' && (
              <SectionBlock
                title="Boutons d’action"
                description="Les CTA visibles dans le hero. Laissez vide pour masquer un bouton."
              >
                <FieldRow
                  label="Bouton principal"
                  description="Le bouton le plus mis en avant, avec un style rempli."
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={subtleLabelClass}>Texte</label>
                      <input
                        type="text"
                        value={config.hero_cta1_text || ''}
                        onChange={(e) => updateConfig('hero_cta1_text', e.target.value)}
                        className={inputClass}
                        placeholder="Découvrir le magazine"
                      />
                    </div>
                    <div>
                      <label className={subtleLabelClass}>Lien</label>
                      <input
                        type="text"
                        value={config.hero_cta1_link || ''}
                        onChange={(e) => updateConfig('hero_cta1_link', e.target.value)}
                        className={inputClass}
                        placeholder="/magazine"
                      />
                    </div>
                  </div>
                </FieldRow>

                <FieldRow
                  label="Bouton secondaire"
                  description="Le bouton plus discret, généralement en contour."
                  noBorder
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={subtleLabelClass}>Texte</label>
                      <input
                        type="text"
                        value={config.hero_cta2_text || ''}
                        onChange={(e) => updateConfig('hero_cta2_text', e.target.value)}
                        className={inputClass}
                        placeholder="S'abonner"
                      />
                    </div>
                    <div>
                      <label className={subtleLabelClass}>Lien</label>
                      <input
                        type="text"
                        value={config.hero_cta2_link || ''}
                        onChange={(e) => updateConfig('hero_cta2_link', e.target.value)}
                        className={inputClass}
                        placeholder="/abonnement"
                      />
                    </div>
                  </div>
                </FieldRow>
              </SectionBlock>
            )}

            {activeSection === 'apropos' && (
              <SectionBlock
                title="À propos"
                description="Le bloc de présentation qui introduit la mission et le ton de la marque."
              >
                <FieldRow
                  label="Titre"
                  description="Titre de la section à propos sur l’accueil."
                >
                  <input
                    type="text"
                    value={config.about_title || ''}
                    onChange={(e) => updateConfig('about_title', e.target.value)}
                    className={`${inputClass} max-w-lg`}
                    placeholder="Plus qu'un magazine"
                  />
                </FieldRow>

                <FieldRow
                  label="Texte"
                  description="Paragraphe de présentation de la marque."
                >
                  <div>
                    <textarea
                      value={config.about_text || ''}
                      onChange={(e) => updateConfig('about_text', e.target.value)}
                      rows={5}
                      className={textareaClass}
                      placeholder="AFRIKHER est une plateforme d'inspiration, de visibilité et d'influence..."
                    />
                    <p className="mt-2 text-xs text-[#9A9A8A]">
                      {(config.about_text || '').length} caractères
                    </p>
                  </div>
                </FieldRow>

                <FieldRow
                  label="Image"
                  description="Visuel illustrant la section."
                  noBorder
                >
                  <ImageUploader
                    configKey="about_image"
                    currentUrl={config.about_image || ''}
                    aspectHint="JPEG, 800x600px recommandé"
                  />
                </FieldRow>
              </SectionBlock>
            )}

            {activeSection === 'fondatrice' && (
              <SectionBlock
                title="Fondatrice"
                description="Informations sur la fondatrice, réutilisées dans la narration institutionnelle."
              >
                <FieldRow
                  label="Photo"
                  description="Portrait de la fondatrice."
                >
                  <ImageUploader
                    configKey="foundress_photo"
                    currentUrl={config.foundress_photo || ''}
                    aspectHint="Portrait carré, 400x400px"
                  />
                </FieldRow>

                <FieldRow
                  label="Nom complet"
                  description="Nom complet de la fondatrice."
                >
                  <input
                    type="text"
                    value={config.foundress_name || ''}
                    onChange={(e) => updateConfig('foundress_name', e.target.value)}
                    className={`${inputClass} max-w-lg`}
                    placeholder="Hadassa Hélène EKILA-LUMANDE"
                  />
                </FieldRow>

                <FieldRow
                  label="Titre / Rôle"
                  description="Son titre professionnel ou sa fonction."
                >
                  <input
                    type="text"
                    value={config.foundress_title || ''}
                    onChange={(e) => updateConfig('foundress_title', e.target.value)}
                    className={`${inputClass} max-w-lg`}
                    placeholder="Fondatrice & CEO"
                  />
                </FieldRow>

                <FieldRow
                  label="Biographie"
                  description="Texte de présentation de la fondatrice."
                  noBorder
                >
                  <textarea
                    value={config.foundress_bio || ''}
                    onChange={(e) => updateConfig('foundress_bio', e.target.value)}
                    rows={5}
                    className={textareaClass}
                    placeholder="Entrepreneure engagée..."
                  />
                </FieldRow>
              </SectionBlock>
            )}

            {activeSection === 'reseaux' && (
              <SectionBlock
                title="Réseaux sociaux"
                description="Liens vers les plateformes et moyens de contact visibles sur le site."
              >
                <FieldRow
                  label="Email de contact"
                  description="Adresse email principale."
                >
                  <input
                    type="email"
                    value={config.contact_email || ''}
                    onChange={(e) => updateConfig('contact_email', e.target.value)}
                    className={`${inputClass} max-w-lg`}
                    placeholder="hadassa.ekilalumande@afrikher.com"
                  />
                </FieldRow>

                <FieldRow
                  label="Lien WhatsApp"
                  description="Lien d’invitation ou de contact WhatsApp."
                >
                  <input
                    type="url"
                    value={config.whatsapp_link || ''}
                    onChange={(e) => updateConfig('whatsapp_link', e.target.value)}
                    className={`${inputClass} max-w-2xl`}
                    placeholder="https://chat.whatsapp.com/..."
                  />
                </FieldRow>

                <FieldRow
                  label="Instagram"
                  description="URL de la page Instagram."
                >
                  <input
                    type="url"
                    value={config.social_instagram || ''}
                    onChange={(e) => updateConfig('social_instagram', e.target.value)}
                    className={`${inputClass} max-w-2xl`}
                    placeholder="https://instagram.com/afrikher"
                  />
                </FieldRow>

                <FieldRow
                  label="Facebook"
                  description="URL de la page Facebook."
                >
                  <input
                    type="url"
                    value={config.social_facebook || ''}
                    onChange={(e) => updateConfig('social_facebook', e.target.value)}
                    className={`${inputClass} max-w-2xl`}
                    placeholder="https://facebook.com/afrikher"
                  />
                </FieldRow>

                <FieldRow
                  label="LinkedIn"
                  description="URL de la page LinkedIn."
                  noBorder
                >
                  <input
                    type="url"
                    value={config.social_linkedin || ''}
                    onChange={(e) => updateConfig('social_linkedin', e.target.value)}
                    className={`${inputClass} max-w-2xl`}
                    placeholder="https://linkedin.com/company/afrikher"
                  />
                </FieldRow>
              </SectionBlock>
            )}

            {activeSection === 'options' && (
              <SectionBlock
                title="Options avancées"
                description="Paramètres d’affichage et raffinements avancés du hero."
              >
                <FieldRow
                  label="Mode carousel"
                  description="Faire défiler plusieurs images dans le hero."
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        updateConfig(
                          'hero_carousel_enabled',
                          config.hero_carousel_enabled === 'true' ? 'false' : 'true'
                        )
                      }
                      className={`relative h-7 w-14 transition-colors ${
                        config.hero_carousel_enabled === 'true'
                          ? 'bg-[#C9A84C]'
                          : 'bg-[#D7D0C5]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 bg-white transition-all ${
                          config.hero_carousel_enabled === 'true'
                            ? 'right-1'
                            : 'left-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-[#9A9A8A]">
                      {config.hero_carousel_enabled === 'true' ? 'Activé' : 'Désactivé'}
                    </span>
                  </div>
                </FieldRow>

                {config.hero_carousel_enabled === 'true' && (
                  <FieldRow
                    label="Images du carousel"
                    description="URLs des images, séparées par des virgules."
                  >
                    <div className="space-y-3">
                      <textarea
                        value={config.hero_carousel_images || ''}
                        onChange={(e) =>
                          updateConfig('hero_carousel_images', e.target.value)
                        }
                        rows={3}
                        className={`${textareaClass} font-mono text-xs`}
                        placeholder="https://image1.jpg, https://image2.jpg"
                      />

                      <label
                        className={`inline-flex h-11 items-center justify-center border border-[#0A0A0A]/10 bg-white px-5 text-[0.68rem] uppercase tracking-[0.22em] text-[#0A0A0A] transition-colors hover:border-[#C9A84C]/35 hover:bg-[#FBF8F2] cursor-pointer ${
                          uploading === 'hero_carousel' ? 'opacity-50' : ''
                        }`}
                      >
                        {uploading === 'hero_carousel' ? (
                          <>
                            <RefreshCw size={14} className="mr-2 animate-spin" />
                            Import...
                          </>
                        ) : (
                          <>
                            <Upload size={14} className="mr-2" />
                            Ajouter une image
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading('hero_carousel');
                            try {
                              const processedFile = await convertImageToJpeg(file);
                              const fileExt = processedFile.name.split('.').pop() || 'jpg';
                              const fileName = `carousel-${Date.now()}.${fileExt}`;
                              const filePath = `site/${fileName}`;
                              const { error: uploadErr } = await supabase.storage
                                .from('afrikher-public')
                                .upload(filePath, processedFile, {
                                  cacheControl: '3600',
                                  upsert: true,
                                  contentType: processedFile.type,
                                });
                              if (uploadErr) throw uploadErr;
                              const { data: urlData } = supabase.storage
                                .from('afrikher-public')
                                .getPublicUrl(filePath);
                              const current = config.hero_carousel_images || '';
                              updateConfig(
                                'hero_carousel_images',
                                current
                                  ? `${current}, ${urlData.publicUrl}`
                                  : urlData.publicUrl
                              );
                            } catch (err: unknown) {
                              setError(
                                'Erreur upload carousel: ' +
                                  (err instanceof Error ? err.message : 'Inconnu')
                              );
                            } finally {
                              setUploading(null);
                            }
                          }}
                          disabled={uploading === 'hero_carousel'}
                        />
                      </label>
                    </div>
                  </FieldRow>
                )}

                <FieldRow
                  label="Alignement du contenu"
                  description="Positionnement du texte dans la section hero."
                >
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'left', label: 'Gauche' },
                      { value: 'center', label: 'Centré' },
                      { value: 'right', label: 'Droite' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateConfig('hero_alignment', opt.value)}
                        className={`border px-5 py-3 text-[0.68rem] uppercase tracking-[0.2em] transition-colors ${
                          (config.hero_alignment || 'left') === opt.value
                            ? 'border-[#C9A84C] bg-[#EFE6D0] text-[#8A6E2F]'
                            : 'border-[#0A0A0A]/10 bg-white text-[#9A9A8A] hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </FieldRow>

                <FieldRow
                  label="Couleur principale"
                  description="Accent principal utilisé sur l’ensemble du site."
                  noBorder
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.primary_color || '#C9A84C'}
                      onChange={(e) => updateConfig('primary_color', e.target.value)}
                      className="h-11 w-11 border border-[#0A0A0A]/10 bg-white cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.primary_color || '#C9A84C'}
                      onChange={(e) => updateConfig('primary_color', e.target.value)}
                      className={`${inputClass} w-36 font-mono`}
                      placeholder="#C9A84C"
                    />
                  </div>
                </FieldRow>
              </SectionBlock>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-[#0A0A0A]/8 pb-5">
        <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#C9A84C]">
          Paramétrage
        </p>
        <h2 className="mt-2 font-serif text-[1.9rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#9A9A8A]">{description}</p>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Notice({
  tone,
  message,
  onClose,
  dismissible = true,
}: {
  tone: 'success' | 'error' | 'warning';
  message: string;
  onClose: () => void;
  dismissible?: boolean;
}) {
  const styles =
    tone === 'success'
      ? 'border-[#C9A84C]/25 bg-[#EFE6D0] text-[#8A6E2F]'
      : tone === 'warning'
        ? 'border-[#C9A84C]/22 bg-[#FBF2DA] text-[#8A6E2F]'
        : 'border-[#9C4C3A]/18 bg-[#F7E3DE] text-[#9C4C3A]';

  return (
    <div className={`flex items-center justify-between gap-4 border px-5 py-4 text-sm ${styles}`}>
      <div className="flex items-center gap-3">
        <AlertCircle size={16} className="shrink-0" />
        <span>{message}</span>
      </div>
      {dismissible ? (
        <button onClick={onClose} className="transition-opacity hover:opacity-70">
          Fermer
        </button>
      ) : null}
    </div>
  );
}
