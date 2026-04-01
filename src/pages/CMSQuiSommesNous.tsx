import { useEffect, useState, useCallback } from 'react';
import {
  Save, Upload, RefreshCw, Check, AlertCircle, Plus, Trash2,
  Image as ImageIcon, Eye, X, User, Heart, Target, Quote, Video
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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

type ActiveTab = 'presentation' | 'fondatrice' | 'valeurs' | 'galerie' | 'videos';

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

// ── Field Row Component ──
const FieldRow = ({ label, description, children, noBorder }: {
  label: string; description?: string; children: React.ReactNode; noBorder?: boolean;
}) => (
  <div className={`py-5 ${noBorder ? '' : 'border-b border-gray-100'}`}>
    <div className="flex items-start justify-between gap-8">
      <div className="w-52 shrink-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  </div>
);

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════

export default function CMSQuiSommesNous() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('presentation');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // ── Présentation AFRIKHER ──
  const [aboutTitre, setAboutTitre] = useState('Qui sommes-nous ?');
  const [aboutSousTitre, setAboutSousTitre] = useState("Plus qu'un magazine");
  const [aboutTexte, setAboutTexte] = useState("AFRIKHER est une plateforme d'inspiration, de visibilité et d'influence dédiée aux femmes entrepreneures africaines et de la diaspora. Nous racontons leurs histoires, valorisons leurs parcours et créons un espace où le business rime avec élégance.");
  const [aboutTexte2, setAboutTexte2] = useState("Notre mission : mettre en lumière les femmes qui bâtissent l'Afrique de demain, à travers des portraits, des interviews, des analyses sectorielles et un magazine premium qui conjugue intelligence économique et art de vivre.");
  const [aboutImage, setAboutImage] = useState('');
  const [aboutCitation, setAboutCitation] = useState("L'élégance hors du commun. Le Business au féminin.");

  // ── Fondatrice ──
  const [fondNom, setFondNom] = useState('Hadassa Hélène EKILA-LUMANDE');
  const [fondTitre, setFondTitre] = useState('Fondatrice & CEO');
  const [fondBio, setFondBio] = useState("Entrepreneure engagée, animée par la volonté de valoriser la puissance et l'expertise des femmes africaines. Hadassa a fondé AFRIKHER avec la conviction que les récits africains méritent d'être racontés avec excellence, élégance et ambition.");
  const [fondBio2, setFondBio2] = useState("Basée à Waterloo en Belgique, elle porte la vision d'un magazine qui transcende les frontières — un pont entre l'Afrique et sa diaspora, entre tradition et modernité, entre business et style.");
  const [fondPhoto, setFondPhoto] = useState('');
  const [fondCitation, setFondCitation] = useState("Je crois en une Afrique où chaque femme entrepreneure peut écrire sa propre histoire de réussite.");

  // ── Valeurs ──
  const [valeurs, setValeurs] = useState<Valeur[]>([
    { id: 'v1', icone: '✦', titre: 'Excellence', description: "Nous visons l'excellence dans chaque contenu, chaque visuel, chaque interaction." },
    { id: 'v2', icone: '♛', titre: 'Élégance', description: "Le raffinement est au cœur de notre identité — dans le fond comme dans la forme." },
    { id: 'v3', icone: '◆', titre: 'Empowerment', description: "Nous croyons au pouvoir des femmes africaines de transformer le continent." },
    { id: 'v4', icone: '∞', titre: 'Communauté', description: "AFRIKHER est plus qu'un magazine — c'est un réseau, une famille, un mouvement." },
  ]);

  // ── Galerie ──
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  // ── Vidéos ──
  const [videos, setVideos] = useState<VideoItem[]>([]);

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

      // Fondatrice
      if (config['about_fond_nom']) setFondNom(config['about_fond_nom']);
      if (config['about_fond_titre']) setFondTitre(config['about_fond_titre']);
      if (config['about_fond_bio']) setFondBio(config['about_fond_bio']);
      if (config['about_fond_bio2']) setFondBio2(config['about_fond_bio2']);
      if (config['about_fond_photo']) setFondPhoto(config['about_fond_photo']);
      if (config['about_fond_citation']) setFondCitation(config['about_fond_citation']);

      // Valeurs
      try {
        const parsed = config['about_valeurs'] ? JSON.parse(config['about_valeurs']) : null;
        if (parsed && Array.isArray(parsed) && parsed.length > 0) setValeurs(parsed);
      } catch { /* keep defaults */ }

      // Galerie
      try {
        const parsed = config['about_galerie'] ? JSON.parse(config['about_galerie']) : [];
        if (Array.isArray(parsed)) setPhotos(parsed);
      } catch { /* keep empty */ }

      // Vidéos
      try {
        const parsed = config['about_videos'] ? JSON.parse(config['about_videos']) : [];
        if (Array.isArray(parsed)) setVideos(parsed);
      } catch { /* keep empty */ }

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
        { key: 'about_fond_nom', value: fondNom },
        { key: 'about_fond_titre', value: fondTitre },
        { key: 'about_fond_bio', value: fondBio },
        { key: 'about_fond_bio2', value: fondBio2 },
        { key: 'about_fond_photo', value: fondPhoto },
        { key: 'about_fond_citation', value: fondCitation },
        { key: 'about_valeurs', value: JSON.stringify(valeurs) },
        { key: 'about_galerie', value: JSON.stringify(photos) },
        { key: 'about_videos', value: JSON.stringify(videos) },
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
        <RefreshCw size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  const tabs: { key: ActiveTab; label: string; icon: typeof User; count?: number }[] = [
    { key: 'presentation', label: 'Présentation', icon: Heart },
    { key: 'fondatrice', label: 'Fondatrice', icon: User },
    { key: 'valeurs', label: 'Nos Valeurs', icon: Target, count: valeurs.length },
    { key: 'galerie', label: 'Galerie', icon: ImageIcon, count: photos.length },
    { key: 'videos', label: 'Vidéos', icon: Video, count: videos.length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-bold text-slate-900">Qui sommes-nous</h1>
          <p className="text-gray-400 mt-1">Présentez AFRIKHER et sa fondatrice</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://afrikher-client.vercel.app/qui-sommes-nous"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:border-gold hover:text-green-600 transition-all"
          >
            <Eye size={16} /> Voir la page
          </a>
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 rounded-2xl font-semibold text-sm hover:bg-slate-100 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Enregistrer tout'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 px-5 py-4 rounded-2xl border border-red-100">
          <AlertCircle size={18} /> <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-lg shadow-slate-200'
                : 'text-gray-500 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-white/20 text-slate-900' : 'bg-gray-100 text-gray-500'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: PRÉSENTATION */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'presentation' && (
        <div className="bg-white rounded-[28px] border border-gray-50 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-cream/30 to-transparent">
            <h2 className="text-xl font-sans font-bold text-slate-900 flex items-center gap-3">
              <Heart size={22} className="text-green-600" />
              Présentation AFRIKHER
            </h2>
            <p className="text-sm text-gray-500 mt-1">Le texte principal de la page "Qui sommes-nous"</p>
          </div>
          <div className="px-8 pb-8">
            <FieldRow label="Titre" description="Titre principal de la page">
              <input type="text" value={aboutTitre} onChange={e => setAboutTitre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all"
                placeholder="Qui sommes-nous ?" />
            </FieldRow>

            <FieldRow label="Sous-titre" description="Phrase d'accroche sous le titre">
              <input type="text" value={aboutSousTitre} onChange={e => setAboutSousTitre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all"
                placeholder="Plus qu'un magazine" />
            </FieldRow>

            <FieldRow label="Image principale" description="Photo illustrant AFRIKHER (équipe, événement, etc.)">
              <div className="flex items-center gap-6">
                {aboutImage ? (
                  <div className="relative group">
                    <img src={aboutImage} alt="" className="w-40 h-28 rounded-xl object-cover border border-gray-100" />
                    <button onClick={() => setAboutImage('')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-slate-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-40 h-28 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                    <ImageIcon size={28} />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gold hover:text-green-600 cursor-pointer transition-all">
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
            </FieldRow>

            <FieldRow label="Texte principal" description="Premier paragraphe de présentation">
              <textarea value={aboutTexte} onChange={e => setAboutTexte(e.target.value)} rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all resize-none"
                placeholder="AFRIKHER est une plateforme..." />
            </FieldRow>

            <FieldRow label="Texte secondaire" description="Deuxième paragraphe (mission, vision)">
              <textarea value={aboutTexte2} onChange={e => setAboutTexte2(e.target.value)} rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all resize-none"
                placeholder="Notre mission..." />
            </FieldRow>

            <FieldRow label="Citation" description="Phrase en exergue, affichée en doré" noBorder>
              <input type="text" value={aboutCitation} onChange={e => setAboutCitation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all italic"
                placeholder="L'élégance hors du commun..." />
            </FieldRow>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: FONDATRICE */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'fondatrice' && (
        <div className="bg-white rounded-[28px] border border-gray-50 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-cream/30 to-transparent">
            <h2 className="text-xl font-sans font-bold text-slate-900 flex items-center gap-3">
              <User size={22} className="text-green-600" />
              La Fondatrice
            </h2>
            <p className="text-sm text-gray-500 mt-1">Informations sur Hadassa Hélène EKILA-LUMANDE</p>
          </div>
          <div className="px-8 pb-8">
            <FieldRow label="Photo" description="Portrait officiel de la fondatrice">
              <div className="flex items-center gap-6">
                {fondPhoto ? (
                  <div className="relative group">
                    <img src={fondPhoto} alt="" className="w-28 h-28 rounded-full object-cover border-2 border-gray-100" />
                    <button onClick={() => setFondPhoto('')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-slate-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <User size={28} />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gold hover:text-green-600 cursor-pointer transition-all">
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
            </FieldRow>

            <FieldRow label="Nom complet" description="Nom affiché sur la page">
              <input type="text" value={fondNom} onChange={e => setFondNom(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all font-semibold" />
            </FieldRow>

            <FieldRow label="Titre / Fonction" description="Titre officiel">
              <input type="text" value={fondTitre} onChange={e => setFondTitre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all" />
            </FieldRow>

            <FieldRow label="Biographie (partie 1)" description="Premier paragraphe de la bio">
              <textarea value={fondBio} onChange={e => setFondBio(e.target.value)} rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all resize-none" />
            </FieldRow>

            <FieldRow label="Biographie (partie 2)" description="Deuxième paragraphe (optionnel)">
              <textarea value={fondBio2} onChange={e => setFondBio2(e.target.value)} rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all resize-none" />
            </FieldRow>

            <FieldRow label="Citation personnelle" description="Phrase inspirante de la fondatrice" noBorder>
              <div className="flex items-start gap-3">
                <Quote size={18} className="text-green-600 shrink-0 mt-3" />
                <textarea value={fondCitation} onChange={e => setFondCitation(e.target.value)} rows={2}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all resize-none italic" />
              </div>
            </FieldRow>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: VALEURS */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'valeurs' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={addValeur}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-slate-900 rounded-2xl font-semibold text-sm hover:bg-green-600/90 transition-all shadow-lg shadow-gold/20">
              <Plus size={16} /> Ajouter une valeur
            </button>
          </div>

          {valeurs.map(valeur => (
            <div key={valeur.id} className="bg-white rounded-[28px] border border-gray-50 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-cream/30 to-transparent">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{valeur.icone}</span>
                  <h3 className="text-lg font-sans font-bold text-slate-900">{valeur.titre || 'Sans titre'}</h3>
                </div>
                <button onClick={() => { if (confirm('Supprimer cette valeur ?')) removeValeur(valeur.id); }}
                  className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="px-8 pb-6">
                <FieldRow label="Icône" description="Emoji ou symbole (1 caractère)">
                  <input type="text" value={valeur.icone} onChange={e => updateValeur(valeur.id, 'icone', e.target.value)}
                    className="w-20 px-4 py-3 border border-gray-200 rounded-xl text-center text-xl focus:outline-none focus:border-green-500 transition-all" maxLength={2} />
                </FieldRow>
                <FieldRow label="Titre">
                  <input type="text" value={valeur.titre} onChange={e => updateValeur(valeur.id, 'titre', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all" />
                </FieldRow>
                <FieldRow label="Description" noBorder>
                  <textarea value={valeur.description} onChange={e => updateValeur(valeur.id, 'description', e.target.value)} rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-gold/10 transition-all resize-none" />
                </FieldRow>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: GALERIE */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'galerie' && (
        <div className="bg-white rounded-[28px] border border-gray-50 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-cream/30 to-transparent">
            <div>
              <h2 className="text-xl font-sans font-bold text-slate-900 flex items-center gap-3">
                <ImageIcon size={22} className="text-green-600" /> Galerie Photos
              </h2>
              <p className="text-sm text-gray-500 mt-1">Photos de l'équipe, événements, coulisses</p>
            </div>
            <label className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-slate-900 rounded-2xl font-semibold text-sm hover:bg-green-600/90 cursor-pointer transition-all shadow-lg shadow-gold/20">
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
              <div className="text-center py-16">
                <ImageIcon size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm">Aucune photo</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {photos.map(photo => (
                  <div key={photo.id} className="group relative">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-50">
                      <img src={photo.url} alt={photo.legende} className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-slate-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <X size={12} />
                    </button>
                    <input type="text" value={photo.legende}
                      onChange={e => setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, legende: e.target.value } : p))}
                      placeholder="Légende..." className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: VIDÉOS */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'videos' && (
        <div className="bg-white rounded-[28px] border border-gray-50 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-cream/30 to-transparent">
            <div>
              <h2 className="text-xl font-sans font-bold text-slate-900 flex items-center gap-3">
                <Video size={22} className="text-green-600" /> Vidéos
              </h2>
              <p className="text-sm text-gray-500 mt-1">Vidéos YouTube ou Vimeo</p>
            </div>
            <button onClick={addVideo}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-slate-900 rounded-2xl font-semibold text-sm hover:bg-green-600/90 transition-all shadow-lg shadow-gold/20">
              <Plus size={16} /> Ajouter une vidéo
            </button>
          </div>
          <div className="p-8">
            {videos.length === 0 ? (
              <div className="text-center py-16">
                <Video size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm">Aucune vidéo</p>
              </div>
            ) : (
              <div className="space-y-6">
                {videos.map(video => (
                  <div key={video.id} className="border border-gray-100 rounded-2xl p-6 relative group">
                    <button onClick={() => setVideos(prev => prev.filter(v => v.id !== video.id))}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Titre</label>
                        <input type="text" value={video.titre}
                          onChange={e => setVideos(prev => prev.map(v => v.id === video.id ? { ...v, titre: e.target.value } : v))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 transition-all" placeholder="Titre" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">URL YouTube/Vimeo</label>
                        <input type="url" value={video.url}
                          onChange={e => setVideos(prev => prev.map(v => v.id === video.id ? { ...v, url: e.target.value } : v))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 transition-all" placeholder="https://youtube.com/watch?v=..." />
                      </div>
                    </div>
                    {video.url && video.url.includes('youtu') && (
                      <div className="mt-3 aspect-video rounded-xl overflow-hidden bg-gray-100 max-w-xs">
                        <iframe src={`https://www.youtube.com/embed/${extractYouTubeId(video.url)}`}
                          className="w-full h-full" allowFullScreen />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Save ── */}
      <div className="flex justify-end pt-4 pb-8">
        <button onClick={saveAll} disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-white text-slate-900 rounded-2xl font-semibold text-sm hover:bg-slate-100 transition-all shadow-lg shadow-slate-200 disabled:opacity-50">
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
