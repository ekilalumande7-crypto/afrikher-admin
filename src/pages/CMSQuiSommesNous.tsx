import { useEffect, useState, useCallback } from 'react';
import {
  Save, Upload, RefreshCw, Check, AlertCircle, Plus, Trash2,
  Image as ImageIcon, Eye, X, User, Heart, Target, Quote, Video
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AdminAlert,
  AdminFieldRow,
  AdminIconBadge,
  AdminSectionShell,
  adminGhostButtonClass,
  adminInputClass,
  adminPrimaryButtonClass,
  adminTextareaClass,
} from '../components/AdminPrimitives';

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

interface Valeur {
  id: string;
  icone: string;
  titre: string;
  description: string;
}

interface GalleryPhoto {
  id: string;
  url: string;
  legende: string;
}

interface VideoItem {
  id: string;
  titre: string;
  url: string;
  description: string;
}

type ActiveTab = 'presentation' | 'fondatrice' | 'valeurs' | 'galerie' | 'videos' | 'sections';

// ── Image conversion utility ──
async function convertImageToJpeg(file: File): Promise<File> {
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') return file;
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas error')); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Conversion error')); return; }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.9);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: typeof User;
}) {
  return (
    <div className="border-b border-[#0A0A0A]/8 bg-[#F8F4EC] px-8 py-6">
        <div className="flex items-start gap-4">
        <AdminIconBadge icon={Icon} className="rounded-none border-[#C9A84C]/35" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#9A9A8A]">{eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-[#0A0A0A]">{title}</h2>
          {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#9A9A8A]">{description}</p>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════

export default function CMSQuiSommesNous() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('presentation');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // ── Présentation AFRIKHER ──
  const [aboutTitre, setAboutTitre] = useState('Qui sommes-nous ?');
  const [aboutSousTitre, setAboutSousTitre] = useState("Plus qu'un magazine");
  const [aboutTexte, setAboutTexte] = useState("AFRIKHER est une plateforme d'inspiration, de visibilité et d'influence dédiée aux femmes entrepreneures africaines et de la diaspora. Nous racontons leurs histoires, valorisons leurs parcours et créons un espace où le business rime avec élégance.");
  const [aboutTexte2, setAboutTexte2] = useState("Notre mission : mettre en lumière les femmes qui bâtissent l'Afrique de demain, à travers des portraits, des interviews, des analyses sectorielles et un magazine premium qui conjugue intelligence économique et art de vivre.");
  const [aboutImage, setAboutImage] = useState('');
  const [aboutCitation, setAboutCitation] = useState("L'élégance hors du commun. Le Business au féminin.");
  const [aboutHeroLabel, setAboutHeroLabel] = useState('Maison éditoriale');
  const [aboutHeroSubtitle, setAboutHeroSubtitle] = useState("L'histoire d'AFRIKHER, entre élégance, influence et vision.");

  // ── Fondatrice ──
  const [fondNom, setFondNom] = useState('Hadassa Hélène EKILA-LUMANDE');
  const [fondTitre, setFondTitre] = useState('Fondatrice & CEO');
  const [fondBio, setFondBio] = useState("Entrepreneure engagée, animée par la volonté de valoriser la puissance et l'expertise des femmes africaines. Hadassa a fondé AFRIKHER avec la conviction que les récits africains méritent d'être racontés avec excellence, élégance et ambition.");
  const [fondBio2, setFondBio2] = useState("Basée à Waterloo en Belgique, elle porte la vision d'un magazine qui transcende les frontières — un pont entre l'Afrique et sa diaspora, entre tradition et modernité, entre business et style.");
  const [fondPhoto, setFondPhoto] = useState('');
  const [fondCitation, setFondCitation] = useState("Je crois en une Afrique où chaque femme entrepreneure peut écrire sa propre histoire de réussite.");
  const [fondSectionLabel, setFondSectionLabel] = useState('Portrait');
  const [fondSectionTitle, setFondSectionTitle] = useState('La Fondatrice');

  // ── Valeurs ──
  const [valeurs, setValeurs] = useState<Valeur[]>([
    { id: 'v1', icone: '✦', titre: 'Excellence', description: "Nous visons l'excellence dans chaque contenu, chaque visuel, chaque interaction." },
    { id: 'v2', icone: '♛', titre: 'Élégance', description: "Le raffinement est au cœur de notre identité — dans le fond comme dans la forme." },
    { id: 'v3', icone: '◆', titre: 'Empowerment', description: "Nous croyons au pouvoir des femmes africaines de transformer le continent." },
    { id: 'v4', icone: '∞', titre: 'Communauté', description: "AFRIKHER est plus qu'un magazine — c'est un réseau, une famille, un mouvement." },
  ]);
  const [valuesSectionLabel, setValuesSectionLabel] = useState('Nos valeurs');
  const [valuesSectionTitle, setValuesSectionTitle] = useState('Ce qui nous guide');
  const [valuesSectionIntro, setValuesSectionIntro] = useState("Une vision éditoriale claire, pensée pour construire une plateforme à la fois exigeante, sensible et durable.");

  // ── Galerie ──
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  // ── Vidéos ──
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [mediaSectionLabel, setMediaSectionLabel] = useState('Regards & archives');
  const [mediaSectionTitle, setMediaSectionTitle] = useState("L'univers AFRIKHER");
  const [mediaSectionIntro, setMediaSectionIntro] = useState("Images, vidéos et fragments de vie qui prolongent la voix éditoriale d’AFRIKHER au-delà des mots.");
  const [closingText, setClosingText] = useState("Chaque écran de cette page prolonge une même intention : raconter une présence, une ligne éditoriale et une ambition féminine sans compromis.");
  const [closingCtaLabel, setClosingCtaLabel] = useState('Découvrir le magazine');
  const [closingCtaLink, setClosingCtaLink] = useState('/magazine');

  // ══════════════════════════════════════════════
  // DATA LOADING
  // ══════════════════════════════════════════════

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('site_config')
        .select('key, value')
        .like('key', 'about_%');

      if (fetchError) throw fetchError;

      const config: Record<string, string> = {};
      (data || []).forEach((row: { key: string; value: string }) => {
        config[row.key] = row.value || '';
      });

      // Présentation
      if (config['about_titre']) setAboutTitre(config['about_titre']);
      if (config['about_sous_titre']) setAboutSousTitre(config['about_sous_titre']);
      if (config['about_texte']) setAboutTexte(config['about_texte']);
      if (config['about_texte2']) setAboutTexte2(config['about_texte2']);
      if (config['about_image']) setAboutImage(config['about_image']);
      if (config['about_citation']) setAboutCitation(config['about_citation']);
      if (config['about_hero_label']) setAboutHeroLabel(config['about_hero_label']);
      if (config['about_hero_subtitle']) setAboutHeroSubtitle(config['about_hero_subtitle']);

      // Fondatrice
      if (config['about_fond_nom']) setFondNom(config['about_fond_nom']);
      if (config['about_fond_titre']) setFondTitre(config['about_fond_titre']);
      if (config['about_fond_bio']) setFondBio(config['about_fond_bio']);
      if (config['about_fond_bio2']) setFondBio2(config['about_fond_bio2']);
      if (config['about_fond_photo']) setFondPhoto(config['about_fond_photo']);
      if (config['about_fond_citation']) setFondCitation(config['about_fond_citation']);
      if (config['about_founder_label']) setFondSectionLabel(config['about_founder_label']);
      if (config['about_founder_title']) setFondSectionTitle(config['about_founder_title']);

      // Valeurs
      if (config['about_values_label']) setValuesSectionLabel(config['about_values_label']);
      if (config['about_values_title']) setValuesSectionTitle(config['about_values_title']);
      if (config['about_values_intro']) setValuesSectionIntro(config['about_values_intro']);
      const parseIssues: string[] = [];
      try {
        const parsed = config['about_valeurs'] ? JSON.parse(config['about_valeurs']) : null;
        if (parsed && Array.isArray(parsed) && parsed.length > 0) setValeurs(parsed);
        if (config['about_valeurs'] && parsed && !Array.isArray(parsed)) {
          parseIssues.push('`about_valeurs` doit contenir un tableau JSON valide.');
        }
      } catch {
        if (config['about_valeurs']) parseIssues.push('Le JSON de `about_valeurs` est invalide.');
      }

      // Galerie
      try {
        const parsed = config['about_galerie'] ? JSON.parse(config['about_galerie']) : [];
        if (Array.isArray(parsed)) setPhotos(parsed);
        if (config['about_galerie'] && !Array.isArray(parsed)) {
          parseIssues.push('`about_galerie` doit contenir un tableau JSON valide.');
        }
      } catch {
        if (config['about_galerie']) parseIssues.push('Le JSON de `about_galerie` est invalide.');
      }

      // Vidéos
      try {
        const parsed = config['about_videos'] ? JSON.parse(config['about_videos']) : [];
        if (Array.isArray(parsed)) setVideos(parsed);
        if (config['about_videos'] && !Array.isArray(parsed)) {
          parseIssues.push('`about_videos` doit contenir un tableau JSON valide.');
        }
      } catch {
        if (config['about_videos']) parseIssues.push('Le JSON de `about_videos` est invalide.');
      }
      setJsonError(parseIssues.length ? parseIssues.join(' ') : null);
      if (config['about_media_label']) setMediaSectionLabel(config['about_media_label']);
      if (config['about_media_title']) setMediaSectionTitle(config['about_media_title']);
      if (config['about_media_intro']) setMediaSectionIntro(config['about_media_intro']);
      if (config['about_closing_text']) setClosingText(config['about_closing_text']);
      if (config['about_closing_cta_label']) setClosingCtaLabel(config['about_closing_cta_label']);
      if (config['about_closing_cta_link']) setClosingCtaLink(config['about_closing_cta_link']);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur de chargement: ' + message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ══════════════════════════════════════════════
  // SAVE ALL
  // ══════════════════════════════════════════════

  const saveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaved(false);

      const updates: { key: string; value: string }[] = [
        { key: 'about_titre', value: aboutTitre },
        { key: 'about_sous_titre', value: aboutSousTitre },
        { key: 'about_texte', value: aboutTexte },
        { key: 'about_texte2', value: aboutTexte2 },
        { key: 'about_image', value: aboutImage },
        { key: 'about_citation', value: aboutCitation },
        { key: 'about_hero_label', value: aboutHeroLabel },
        { key: 'about_hero_subtitle', value: aboutHeroSubtitle },
        { key: 'about_fond_nom', value: fondNom },
        { key: 'about_fond_titre', value: fondTitre },
        { key: 'about_fond_bio', value: fondBio },
        { key: 'about_fond_bio2', value: fondBio2 },
        { key: 'about_fond_photo', value: fondPhoto },
        { key: 'about_fond_citation', value: fondCitation },
        { key: 'about_founder_label', value: fondSectionLabel },
        { key: 'about_founder_title', value: fondSectionTitle },
        { key: 'about_values_label', value: valuesSectionLabel },
        { key: 'about_values_title', value: valuesSectionTitle },
        { key: 'about_values_intro', value: valuesSectionIntro },
        { key: 'about_valeurs', value: JSON.stringify(valeurs) },
        { key: 'about_galerie', value: JSON.stringify(photos) },
        { key: 'about_videos', value: JSON.stringify(videos) },
        { key: 'about_media_label', value: mediaSectionLabel },
        { key: 'about_media_title', value: mediaSectionTitle },
        { key: 'about_media_intro', value: mediaSectionIntro },
        { key: 'about_closing_text', value: closingText },
        { key: 'about_closing_cta_label', value: closingCtaLabel },
        { key: 'about_closing_cta_link', value: closingCtaLink },
      ];

      for (const item of updates) {
        const { error: upsertError } = await supabase
          .from('site_config')
          .upsert(
            { key: item.key, value: item.value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );
        if (upsertError) throw upsertError;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur de sauvegarde: ' + message);
    } finally {
      setSaving(false);
    }
  };

  // ══════════════════════════════════════════════
  // IMAGE UPLOAD
  // ══════════════════════════════════════════════

  const uploadImage = async (file: File, folder: string, id: string): Promise<string> => {
    setUploading(id);
    try {
      const processedFile = await convertImageToJpeg(file);
      const fileName = `${folder}/${id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('afrikher-public')
        .upload(fileName, processedFile, { cacheControl: '3600', upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('afrikher-public').getPublicUrl(fileName);
      return urlData.publicUrl;
    } finally {
      setUploading(null);
    }
  };

  // ══════════════════════════════════════════════
  // VALEURS HANDLERS
  // ══════════════════════════════════════════════

  const updateValeur = (id: string, field: keyof Valeur, value: string) => {
    setValeurs(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const addValeur = () => {
    setValeurs(prev => [...prev, { id: `v-${Date.now()}`, icone: '●', titre: '', description: '' }]);
  };

  const removeValeur = (id: string) => {
    setValeurs(prev => prev.filter(v => v.id !== id));
  };

  // ══════════════════════════════════════════════
  // GALLERY HANDLERS
  // ══════════════════════════════════════════════

  const addPhoto = async (file: File) => {
    try {
      const url = await uploadImage(file, 'site', `about-photo-${Date.now()}`);
      setPhotos(prev => [...prev, { id: `p-${Date.now()}`, url, legende: '' }]);
    } catch (err: unknown) {
      setError('Erreur upload: ' + (err instanceof Error ? err.message : 'Erreur'));
    }
  };

  // ══════════════════════════════════════════════
  // VIDEO HANDLERS
  // ══════════════════════════════════════════════

  const addVideo = () => {
    setVideos(prev => [...prev, { id: `vid-${Date.now()}`, titre: '', url: '', description: '' }]);
  };

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="flex flex-col items-center gap-4 text-center">
          <RefreshCw size={28} className="animate-spin text-[#C9A84C]" />
          <p className="text-sm uppercase tracking-[0.24em] text-[#9A9A8A]">Chargement de la page institutionnelle</p>
        </div>
      </div>
    );
  }

  const tabs: { key: ActiveTab; label: string; icon: typeof User; count?: number }[] = [
    { key: 'presentation', label: 'Présentation', icon: Heart },
    { key: 'fondatrice', label: 'Fondatrice', icon: User },
    { key: 'valeurs', label: 'Nos Valeurs', icon: Target, count: valeurs.length },
    { key: 'galerie', label: 'Galerie', icon: ImageIcon, count: photos.length },
    { key: 'videos', label: 'Vidéos', icon: Video, count: videos.length },
    { key: 'sections', label: 'Paramètres de section', icon: Quote },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col gap-5 border-b border-[#0A0A0A]/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#9A9A8A]">CMS Institutionnel</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none text-[#0A0A0A]">Qui sommes-nous</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9A9A8A]">
            Travaillez la présence de la marque, le portrait de la fondatrice et toute la matière éditoriale
            qui construit l’identité AFRIKHER.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://afrikher-client.vercel.app/qui-sommes-nous"
            target="_blank"
            rel="noopener noreferrer"
            className={adminGhostButtonClass}
          >
            <Eye size={16} /> Voir la page
          </a>
          <button
            onClick={saveAll}
            disabled={saving}
            className={adminPrimaryButtonClass}
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Enregistrer tout'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <AdminAlert tone="error">
          <AlertCircle size={18} /> <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
        </AdminAlert>
      )}

      {jsonError && !error && (
        <AdminAlert tone="error">
          <AlertCircle size={18} /> <span className="text-sm">{jsonError}</span>
          <button onClick={() => setJsonError(null)} className="ml-auto"><X size={16} /></button>
        </AdminAlert>
      )}

      {saved && (
        <AdminAlert tone="warning">
          <Check size={18} />
          <span className="text-sm">Les contenus institutionnels ont bien été mis à jour.</span>
        </AdminAlert>
      )}

      {/* ── Tabs ── */}
      <div className="overflow-x-auto border border-[#0A0A0A]/10 bg-[#F8F4EC] p-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`mr-2 inline-flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'border border-[#0A0A0A] bg-[#0A0A0A] text-[#F5F0E8]'
                : 'border border-transparent bg-transparent text-[#6F6C62] hover:border-[#0A0A0A]/10 hover:bg-white hover:text-[#0A0A0A]'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${
                activeTab === tab.key ? 'bg-[#F5F0E8]/12 text-[#F5F0E8]' : 'bg-white text-[#9A9A8A]'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: PRÉSENTATION */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'presentation' && (
        <AdminSectionShell>
          <SectionHeader
            eyebrow="Identité"
            title="Présentation AFRIKHER"
            description='Le récit principal de la page "Qui sommes-nous", pensé comme un manifeste de marque.'
            icon={Heart}
          />
          <div className="px-8 pb-8">
            <AdminFieldRow label="Label de section" description="Petit label premium au-dessus du hero">
              <input type="text" value={aboutHeroLabel} onChange={e => setAboutHeroLabel(e.target.value)}
                className={adminInputClass}
                placeholder="Maison éditoriale" />
            </AdminFieldRow>

            <AdminFieldRow label="Titre" description="Titre principal de la page">
              <input type="text" value={aboutTitre} onChange={e => setAboutTitre(e.target.value)}
                className={`${adminInputClass} font-display text-xl`}
                placeholder="Qui sommes-nous ?" />
            </AdminFieldRow>

            <AdminFieldRow label="Sous-titre" description="Phrase d'accroche sous le titre">
              <input type="text" value={aboutSousTitre} onChange={e => setAboutSousTitre(e.target.value)}
                className={adminInputClass}
                placeholder="Plus qu'un magazine" />
            </AdminFieldRow>

            <AdminFieldRow label="Accroche hero" description="Sous-texte introductif juste sous le titre principal">
              <input type="text" value={aboutHeroSubtitle} onChange={e => setAboutHeroSubtitle(e.target.value)}
                className={adminInputClass}
                placeholder="L'histoire d'AFRIKHER, entre élégance, influence et vision." />
            </AdminFieldRow>

            <AdminFieldRow label="Image principale" description="Photo illustrant AFRIKHER (équipe, événement, etc.)">
              <div className="flex items-center gap-6">
                {aboutImage ? (
                  <div className="relative group">
                    <img src={aboutImage} alt="" className="h-32 w-48 border border-[#0A0A0A]/10 object-cover" />
                    <button onClick={() => setAboutImage('')}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center bg-[#7C2D2D] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-32 w-48 items-center justify-center border border-dashed border-[#0A0A0A]/14 bg-[#F8F4EC] text-[#9A9A8A]">
                    <ImageIcon size={28} />
                  </div>
                )}
                <label className={adminGhostButtonClass}>
                  {uploading === 'about-main' ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading === 'about-main' ? 'Upload...' : 'Choisir une image'}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try { const url = await uploadImage(file, 'site', 'about-main'); setAboutImage(url); }
                      catch (err: unknown) { setError('Erreur upload: ' + (err instanceof Error ? err.message : 'Erreur')); }
                    }} />
                </label>
              </div>
            </AdminFieldRow>

            <AdminFieldRow label="Texte principal" description="Premier paragraphe de présentation">
              <textarea value={aboutTexte} onChange={e => setAboutTexte(e.target.value)} rows={4}
                className={adminTextareaClass}
                placeholder="AFRIKHER est une plateforme..." />
            </AdminFieldRow>

            <AdminFieldRow label="Texte secondaire" description="Deuxième paragraphe (mission, vision)">
              <textarea value={aboutTexte2} onChange={e => setAboutTexte2(e.target.value)} rows={4}
                className={adminTextareaClass}
                placeholder="Notre mission..." />
            </AdminFieldRow>

            <AdminFieldRow label="Citation" description="Phrase en exergue, affichée en doré" noBorder>
              <input type="text" value={aboutCitation} onChange={e => setAboutCitation(e.target.value)}
                className={`${adminInputClass} italic`}
                placeholder="L'élégance hors du commun..." />
            </AdminFieldRow>
          </div>
        </AdminSectionShell>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: FONDATRICE */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'fondatrice' && (
        <AdminSectionShell>
          <SectionHeader
            eyebrow="Portrait"
            title="La Fondatrice"
            description="La section la plus sensible de la page. Elle doit porter la stature, la voix et la vision de la maison."
            icon={User}
          />
          <div className="px-8 pb-8">
            <AdminFieldRow label="Label de section" description="Petit label premium au-dessus du portrait">
              <input type="text" value={fondSectionLabel} onChange={e => setFondSectionLabel(e.target.value)}
                className={adminInputClass} />
            </AdminFieldRow>

            <AdminFieldRow label="Titre de section" description="Titre affiché pour le bloc fondatrice">
              <input type="text" value={fondSectionTitle} onChange={e => setFondSectionTitle(e.target.value)}
                className={`${adminInputClass} font-display text-xl`} />
            </AdminFieldRow>

            <AdminFieldRow label="Photo" description="Portrait officiel de la fondatrice">
              <div className="flex items-center gap-6">
                {fondPhoto ? (
                  <div className="relative group">
                    <img src={fondPhoto} alt="" className="h-40 w-32 border border-[#0A0A0A]/10 object-cover" />
                    <button onClick={() => setFondPhoto('')}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center bg-[#7C2D2D] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-40 w-32 items-center justify-center border border-dashed border-[#0A0A0A]/14 bg-[#F8F4EC] text-[#9A9A8A]">
                    <User size={28} />
                  </div>
                )}
                <div className="space-y-4">
                  <div className="max-w-sm border border-[#0A0A0A]/10 bg-[#F8F4EC] p-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[#9A9A8A]">Portrait éditorial</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#0A0A0A]">
                      Privilégiez une image sobre, cadrée et affirmée. Ici, on met en scène une présence, pas un simple avatar.
                    </p>
                  </div>
                  <label className={adminGhostButtonClass}>
                  {uploading === 'fondatrice' ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading === 'fondatrice' ? 'Upload...' : 'Choisir une photo'}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try { const url = await uploadImage(file, 'foundress', 'portrait'); setFondPhoto(url); }
                      catch (err: unknown) { setError('Erreur upload: ' + (err instanceof Error ? err.message : 'Erreur')); }
                    }} />
                  </label>
                </div>
              </div>
            </AdminFieldRow>

            <AdminFieldRow label="Nom complet" description="Nom affiché sur la page">
              <input type="text" value={fondNom} onChange={e => setFondNom(e.target.value)}
                className={`${adminInputClass} font-display text-xl`} />
            </AdminFieldRow>

            <AdminFieldRow label="Titre / Fonction" description="Titre officiel">
              <input type="text" value={fondTitre} onChange={e => setFondTitre(e.target.value)}
                className={adminInputClass} />
            </AdminFieldRow>

            <AdminFieldRow label="Biographie (partie 1)" description="Premier paragraphe de la bio">
              <textarea value={fondBio} onChange={e => setFondBio(e.target.value)} rows={4}
                className={adminTextareaClass} />
            </AdminFieldRow>

            <AdminFieldRow label="Biographie (partie 2)" description="Deuxième paragraphe (optionnel)">
              <textarea value={fondBio2} onChange={e => setFondBio2(e.target.value)} rows={4}
                className={adminTextareaClass} />
            </AdminFieldRow>

            <AdminFieldRow label="Citation personnelle" description="Phrase inspirante de la fondatrice" noBorder>
              <div className="flex items-start gap-4 border border-[#C9A84C]/25 bg-[#FBF7ED] p-5">
                <Quote size={18} className="mt-1 shrink-0 text-[#C9A84C]" />
                <textarea value={fondCitation} onChange={e => setFondCitation(e.target.value)} rows={2}
                  className="flex-1 border-none bg-transparent p-0 text-sm italic leading-relaxed text-[#0A0A0A] outline-none placeholder:text-[#9A9A8A]" />
              </div>
            </AdminFieldRow>
          </div>
        </AdminSectionShell>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: VALEURS */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'valeurs' && (
        <div className="space-y-6">
          <AdminSectionShell>
            <SectionHeader
              eyebrow="Piliers"
              title="Paramètres de la section valeurs"
              description="Cette zone ne doit plus ressembler à un CRUD. Chaque valeur doit se lire comme un pilier de marque."
              icon={Target}
            />
            <div className="px-8 pb-8">
              <AdminFieldRow label="Label de section">
                <input type="text" value={valuesSectionLabel} onChange={e => setValuesSectionLabel(e.target.value)}
                  className={adminInputClass} />
              </AdminFieldRow>
              <AdminFieldRow label="Titre de section">
                <input type="text" value={valuesSectionTitle} onChange={e => setValuesSectionTitle(e.target.value)}
                  className={`${adminInputClass} font-display text-xl`} />
              </AdminFieldRow>
              <AdminFieldRow label="Texte d'introduction" noBorder>
                <textarea value={valuesSectionIntro} onChange={e => setValuesSectionIntro(e.target.value)} rows={3}
                  className={adminTextareaClass} />
              </AdminFieldRow>
            </div>
          </AdminSectionShell>

          <div className="flex justify-end">
            <button onClick={addValeur}
              className={adminPrimaryButtonClass}>
              <Plus size={16} /> Ajouter une valeur
            </button>
          </div>

          {valeurs.map(valeur => (
            <AdminSectionShell key={valeur.id}>
              <div className="flex items-center justify-between border-b border-[#0A0A0A]/8 bg-[#F8F4EC] px-8 py-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center border border-[#C9A84C]/35 bg-white text-xl text-[#C9A84C]">{valeur.icone}</span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[#9A9A8A]">Pilier de marque</p>
                    <h3 className="mt-1 font-display text-2xl font-semibold text-[#0A0A0A]">{valeur.titre || 'Sans titre'}</h3>
                  </div>
                </div>
                <button onClick={() => { if (confirm('Supprimer cette valeur ?')) removeValeur(valeur.id); }}
                  className="p-2 text-[#9A9A8A] transition-colors hover:bg-[#FBF1F0] hover:text-[#7C2D2D]">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="px-8 pb-6">
                <AdminFieldRow label="Icône" description="Emoji ou symbole (1 caractère)">
                  <input type="text" value={valeur.icone} onChange={e => updateValeur(valeur.id, 'icone', e.target.value)}
                    className="w-24 border border-[#0A0A0A]/12 bg-[#F8F4EC] px-4 py-3 text-center text-xl text-[#0A0A0A] outline-none transition-all focus:border-[#C9A84C] focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/12" maxLength={2} />
                </AdminFieldRow>
                <AdminFieldRow label="Titre">
                  <input type="text" value={valeur.titre} onChange={e => updateValeur(valeur.id, 'titre', e.target.value)}
                    className={`${adminInputClass} font-display text-xl`} />
                </AdminFieldRow>
                <AdminFieldRow label="Description" noBorder>
                  <textarea value={valeur.description} onChange={e => updateValeur(valeur.id, 'description', e.target.value)} rows={2}
                    className={adminTextareaClass} />
                </AdminFieldRow>
              </div>
            </AdminSectionShell>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: GALERIE */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'galerie' && (
        <AdminSectionShell>
          <div className="flex items-center justify-between border-b border-[#0A0A0A]/8 bg-[#F8F4EC] px-8 py-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#9A9A8A]">Sélection visuelle</p>
              <h2 className="mt-2 flex items-center gap-3 font-display text-3xl font-semibold text-[#0A0A0A]">
                <ImageIcon size={22} className="text-[#C9A84C]" /> Galerie Photos
              </h2>
              <p className="mt-2 text-sm text-[#9A9A8A]">Photos de l'équipe, événements, coulisses et matière éditoriale.</p>
            </div>
            <label className={adminPrimaryButtonClass}>
              {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
              Ajouter des photos
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;
                  for (let i = 0; i < files.length; i++) await addPhoto(files[i]);
                }} />
            </label>
          </div>
          <div className="p-8">
            {photos.length === 0 ? (
              <div className="border border-dashed border-[#0A0A0A]/14 bg-[#F8F4EC] py-20 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#9A9A8A]">Galerie vide</p>
                <h3 className="mt-3 font-display text-3xl font-semibold text-[#0A0A0A]">Aucune image éditoriale</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#9A9A8A]">
                  Ajoutez ici une matière visuelle sobre et incarnée. Cette section doit ressembler à une sélection, pas à un dossier de fichiers.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {photos.map(photo => (
                  <div key={photo.id} className="group relative">
                    <div className="aspect-square overflow-hidden border border-[#0A0A0A]/10 bg-[#F8F4EC]">
                      <img src={photo.url} alt={photo.legende} className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-[#0A0A0A]/88 text-[#F5F0E8] opacity-0 transition-opacity group-hover:opacity-100">
                      <X size={12} />
                    </button>
                    <input type="text" value={photo.legende}
                      onChange={e => setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, legende: e.target.value } : p))}
                      placeholder="Légende..." className="mt-3 w-full border border-[#0A0A0A]/12 bg-[#F8F4EC] px-3 py-2 text-xs text-[#0A0A0A] outline-none transition-all placeholder:text-[#9A9A8A] focus:border-[#C9A84C] focus:bg-white" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminSectionShell>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: VIDÉOS */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'videos' && (
        <AdminSectionShell>
          <div className="flex items-center justify-between border-b border-[#0A0A0A]/8 bg-[#F8F4EC] px-8 py-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#9A9A8A]">Format vivant</p>
              <h2 className="mt-2 flex items-center gap-3 font-display text-3xl font-semibold text-[#0A0A0A]">
                <Video size={22} className="text-[#C9A84C]" /> Vidéos
              </h2>
              <p className="mt-2 text-sm text-[#9A9A8A]">Vidéos YouTube ou Vimeo à intégrer avec plus de calme et de respiration.</p>
            </div>
            <button onClick={addVideo}
              className={adminPrimaryButtonClass}>
              <Plus size={16} /> Ajouter une vidéo
            </button>
          </div>
          <div className="p-8">
            {videos.length === 0 ? (
              <div className="border border-dashed border-[#0A0A0A]/14 bg-[#F8F4EC] py-20 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#9A9A8A]">Vidéos</p>
                <h3 className="mt-3 font-display text-3xl font-semibold text-[#0A0A0A]">Aucun format intégré</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#9A9A8A]">
                  Ajoutez des prises de parole, interviews ou capsules pour prolonger la présence éditoriale d’AFRIKHER.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {videos.map(video => (
                  <div key={video.id} className="relative border border-[#0A0A0A]/10 bg-white p-6">
                    <button onClick={() => setVideos(prev => prev.filter(v => v.id !== video.id))}
                      className="absolute right-4 top-4 p-2 text-[#9A9A8A] transition-colors hover:bg-[#FBF1F0] hover:text-[#7C2D2D]">
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Titre</label>
                        <input type="text" value={video.titre}
                          onChange={e => setVideos(prev => prev.map(v => v.id === video.id ? { ...v, titre: e.target.value } : v))}
                          className={adminInputClass} placeholder="Titre" />
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">URL YouTube/Vimeo</label>
                        <input type="url" value={video.url}
                          onChange={e => setVideos(prev => prev.map(v => v.id === video.id ? { ...v, url: e.target.value } : v))}
                          className={adminInputClass} placeholder="https://youtube.com/watch?v=..." />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-[#9A9A8A]">Description</label>
                      <textarea
                        value={video.description}
                        onChange={e => setVideos(prev => prev.map(v => v.id === video.id ? { ...v, description: e.target.value } : v))}
                        rows={3}
                        className={adminTextareaClass}
                        placeholder="Contexte, angle éditorial ou note d’accompagnement"
                      />
                    </div>
                    {video.url && video.url.includes('youtu') && (
                      <div className="mt-5 aspect-video max-w-md overflow-hidden border border-[#0A0A0A]/10 bg-[#F8F4EC]">
                        <iframe src={`https://www.youtube.com/embed/${extractYouTubeId(video.url)}`}
                          className="w-full h-full" allowFullScreen />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminSectionShell>
      )}

      {activeTab === 'sections' && (
        <AdminSectionShell>
          <SectionHeader
            eyebrow="Cadre éditorial"
            title="Paramètres de section"
            description="Labels, intros et fermeture de page pour garder une cohérence narrative sur tout l’écran."
            icon={Quote}
          />
          <div className="px-8 pb-8">
            <AdminFieldRow label="Label médias">
              <input type="text" value={mediaSectionLabel} onChange={e => setMediaSectionLabel(e.target.value)}
                className={adminInputClass} />
            </AdminFieldRow>
            <AdminFieldRow label="Titre médias">
              <input type="text" value={mediaSectionTitle} onChange={e => setMediaSectionTitle(e.target.value)}
                className={`${adminInputClass} font-display text-xl`} />
            </AdminFieldRow>
            <AdminFieldRow label="Introduction médias">
              <textarea value={mediaSectionIntro} onChange={e => setMediaSectionIntro(e.target.value)} rows={3}
                className={adminTextareaClass} />
            </AdminFieldRow>
            <AdminFieldRow label="Texte de clôture">
              <textarea value={closingText} onChange={e => setClosingText(e.target.value)} rows={3}
                className={adminTextareaClass} />
            </AdminFieldRow>
            <AdminFieldRow label="CTA de clôture">
              <input type="text" value={closingCtaLabel} onChange={e => setClosingCtaLabel(e.target.value)}
                className={adminInputClass} />
            </AdminFieldRow>
            <AdminFieldRow label="Lien du CTA" noBorder>
              <input type="text" value={closingCtaLink} onChange={e => setClosingCtaLink(e.target.value)}
                className={adminInputClass}
                placeholder="/magazine" />
            </AdminFieldRow>
          </div>
        </AdminSectionShell>
      )}

      {/* ── Bottom Save ── */}
      <div className="flex justify-end pt-4 pb-8">
        <button onClick={saveAll} disabled={saving}
          className={adminPrimaryButtonClass}>
          {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Enregistrer toutes les modifications'}
        </button>
      </div>
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}
