import { useEffect, useState, useCallback } from 'react';
import {
  Save, Upload, RefreshCw, Check, AlertCircle, Plus, Trash2,
  Image as ImageIcon, BookOpen, Eye, ChevronUp, ChevronDown,
  Video, Camera, Type, FileText, X, GripVertical
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

interface Chapitre {
  id: string;
  numero: string;
  titre: string;
  description: string;
  image: string;
  items?: string[]; // bullet points optionnels
}

interface GalleryPhoto {
  id: string;
  url: string;
  legende: string;
  ordre: number;
}

interface VideoItem {
  id: string;
  titre: string;
  url: string;
  thumbnail: string;
  description: string;
}

type ActiveTab = 'editorial' | 'chapitres' | 'galerie' | 'videos';

// ── Utility: image conversion ──
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

export default function CMSRubriques() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('editorial');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // ── Section Éditorial (ex-Journal) ──
  const [editorialImage, setEditorialImage] = useState('');
  const [editorialCitation, setEditorialCitation] = useState('');
  const [editorialTexte, setEditorialTexte] = useState('');
  const [editorialTitre, setEditorialTitre] = useState('');
  const [editorialSousTitre, setEditorialSousTitre] = useState('');

  // ── Chapitres (ex-Galerie / Rubriques) ──
  const [chapitres, setChapitres] = useState<Chapitre[]>([]);

  // ── Galerie Photos ──
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

      // Load all rubriques-related site_config keys
      const { data, error: fetchError } = await supabase
        .from('site_config')
        .select('key, value')
        .like('key', 'rubriques_%');

      if (fetchError) throw fetchError;

      const config: Record<string, string> = {};
      (data || []).forEach((row: { key: string; value: string }) => {
        config[row.key] = row.value || '';
      });

      // Editorial
      setEditorialImage(config['rubriques_editorial_image'] || '');
      setEditorialCitation(config['rubriques_editorial_citation'] || "Interviews, récits et dossiers pour la femme africaine entrepreneure. Une plongée au cœur de celles qui font bouger les lignes.");
      setEditorialTexte(config['rubriques_editorial_texte'] || "AFRIKHER porte la vision d'une Afrique où les femmes ne sont plus seulement les gardiennes de traditions, mais les architectes d'un avenir puissant, créatif et prospère.");
      setEditorialTitre(config['rubriques_editorial_titre'] || 'Éditorial');
      setEditorialSousTitre(config['rubriques_editorial_sous_titre'] || 'Le Sommaire d\'AFRIKHER');

      // Chapitres
      try {
        const parsed = config['rubriques_chapitres'] ? JSON.parse(config['rubriques_chapitres']) : null;
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setChapitres(parsed);
        } else {
          setChapitres(getDefaultChapitres());
        }
      } catch {
        setChapitres(getDefaultChapitres());
      }

      // Gallery photos
      try {
        const parsedPhotos = config['rubriques_galerie'] ? JSON.parse(config['rubriques_galerie']) : [];
        setPhotos(Array.isArray(parsedPhotos) ? parsedPhotos : []);
      } catch {
        setPhotos([]);
      }

      // Videos
      try {
        const parsedVideos = config['rubriques_videos'] ? JSON.parse(config['rubriques_videos']) : [];
        setVideos(Array.isArray(parsedVideos) ? parsedVideos : []);
      } catch {
        setVideos([]);
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur de chargement: ' + message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ══════════════════════════════════════════════
  // DEFAULT DATA
  // ══════════════════════════════════════════════

  function getDefaultChapitres(): Chapitre[] {
    return [
      {
        id: 'ch-1',
        numero: '01',
        titre: 'ICONIQUES',
        description: "Des portraits de femmes africaines qui bousculent les codes.\n\nCheffes d'entreprises, créatrices, investisseuses ou agripreneuses, elles incarnent la réussite au féminin.",
        image: '',
        items: [],
      },
      {
        id: 'ch-2',
        numero: '02',
        titre: "SECTEURS D'AVENIR",
        description: "Zoom sur des domaines clés de l'économie africaine :",
        image: '',
        items: [
          'AgriTech et développement durable',
          'Mode et artisanat de luxe africain',
          'FinTech et innovation numérique',
          'Beauté et bien-être made in Africa',
          'Économie bleue et verte',
        ],
      },
      {
        id: 'ch-3',
        numero: '03',
        titre: "PAROLES D'EXPERTES",
        description: "Des analyses, des chroniques et des conseils pratiques d'économistes, mentors, investisseurs ou coachs spécialisés dans l'accompagnement des femmes entrepreneures.",
        image: '',
        items: [],
      },
      {
        id: 'ch-4',
        numero: '04',
        titre: 'ENTREPRENDRE AVEC STYLE',
        description: "Une rubrique glamour où business rime avec élégance :",
        image: '',
        items: [
          'Mode professionnelle',
          "Art de vivre de la femme entrepreneure",
          'Beauté et confiance en soi',
          "Lieux et événements d'affaires à travers l'Afrique",
        ],
      },
      {
        id: 'ch-5',
        numero: '05',
        titre: 'START-UP STORIES',
        description: "Des success stories, mais aussi des histoires vraies d'échecs et de résilience — car derrière chaque réussite, il y a une leçon.",
        image: '',
        items: [],
      },
      {
        id: 'ch-6',
        numero: '06',
        titre: 'PAROLES DE SOCIÉTÉ',
        description: "Une rubrique engagée : égalité, leadership féminin, inclusion, rapport au pouvoir… les grands sujets sociétaux qui façonnent la femme entrepreneure africaine d'aujourd'hui.",
        image: '',
        items: [],
      },
    ];
  }

  // ══════════════════════════════════════════════
  // SAVE ALL
  // ══════════════════════════════════════════════

  const saveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaved(false);

      const updates: { key: string; value: string }[] = [
        { key: 'rubriques_editorial_image', value: editorialImage },
        { key: 'rubriques_editorial_citation', value: editorialCitation },
        { key: 'rubriques_editorial_texte', value: editorialTexte },
        { key: 'rubriques_editorial_titre', value: editorialTitre },
        { key: 'rubriques_editorial_sous_titre', value: editorialSousTitre },
        { key: 'rubriques_chapitres', value: JSON.stringify(chapitres) },
        { key: 'rubriques_galerie', value: JSON.stringify(photos) },
        { key: 'rubriques_videos', value: JSON.stringify(videos) },
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
  // CHAPITRE HANDLERS
  // ══════════════════════════════════════════════

  const updateChapitre = (id: string, field: keyof Chapitre, value: string | string[]) => {
    setChapitres(prev => prev.map(ch => ch.id === id ? { ...ch, [field]: value } : ch));
  };

  const addChapitre = () => {
    const num = String(chapitres.length + 1).padStart(2, '0');
    setChapitres(prev => [...prev, {
      id: `ch-${Date.now()}`,
      numero: num,
      titre: 'NOUVEAU CHAPITRE',
      description: '',
      image: '',
      items: [],
    }]);
  };

  const removeChapitre = (id: string) => {
    setChapitres(prev => prev.filter(ch => ch.id !== id).map((ch, i) => ({
      ...ch,
      numero: String(i + 1).padStart(2, '0'),
    })));
  };

  const moveChapitre = (id: string, direction: 'up' | 'down') => {
    setChapitres(prev => {
      const idx = prev.findIndex(ch => ch.id === id);
      if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === prev.length - 1)) return prev;
      const newArr = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
      return newArr.map((ch, i) => ({ ...ch, numero: String(i + 1).padStart(2, '0') }));
    });
  };

  const addItem = (chapitreId: string) => {
    setChapitres(prev => prev.map(ch =>
      ch.id === chapitreId ? { ...ch, items: [...(ch.items || []), ''] } : ch
    ));
  };

  const updateItem = (chapitreId: string, itemIdx: number, value: string) => {
    setChapitres(prev => prev.map(ch => {
      if (ch.id !== chapitreId) return ch;
      const newItems = [...(ch.items || [])];
      newItems[itemIdx] = value;
      return { ...ch, items: newItems };
    }));
  };

  const removeItem = (chapitreId: string, itemIdx: number) => {
    setChapitres(prev => prev.map(ch => {
      if (ch.id !== chapitreId) return ch;
      return { ...ch, items: (ch.items || []).filter((_, i) => i !== itemIdx) };
    }));
  };

  // ══════════════════════════════════════════════
  // GALLERY HANDLERS
  // ══════════════════════════════════════════════

  const addPhoto = async (file: File) => {
    try {
      const url = await uploadImage(file, 'gallery', `photo-${Date.now()}`);
      setPhotos(prev => [...prev, {
        id: `photo-${Date.now()}`,
        url,
        legende: '',
        ordre: prev.length,
      }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur upload photo: ' + message);
    }
  };

  const updatePhotoLegende = (id: string, legende: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, legende } : p));
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // ══════════════════════════════════════════════
  // VIDEO HANDLERS
  // ══════════════════════════════════════════════

  const addVideo = () => {
    setVideos(prev => [...prev, {
      id: `video-${Date.now()}`,
      titre: '',
      url: '',
      thumbnail: '',
      description: '',
    }]);
  };

  const updateVideo = (id: string, field: keyof VideoItem, value: string) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVideo = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <RefreshCw size={32} className="animate-spin text-gold" />
      </div>
    );
  }

  const tabs: { key: ActiveTab; label: string; icon: typeof BookOpen; count?: number }[] = [
    { key: 'editorial', label: 'Éditorial', icon: BookOpen },
    { key: 'chapitres', label: 'Chapitres', icon: FileText, count: chapitres.length },
    { key: 'galerie', label: 'Galerie Photos', icon: Camera, count: photos.length },
    { key: 'videos', label: 'Vidéos', icon: Video, count: videos.length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-dark">Les Rubriques</h1>
          <p className="text-gray-400 mt-1">Gérez le contenu éditorial et la galerie de la page Rubriques</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://afrikher-client.vercel.app/rubriques"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:border-gold hover:text-gold transition-all"
          >
            <Eye size={16} /> Voir la page
          </a>
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-dark text-white rounded-2xl font-semibold text-sm hover:bg-charcoal transition-all shadow-lg shadow-dark/10 disabled:opacity-50"
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
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-dark text-white shadow-lg shadow-dark/10'
                : 'text-gray-500 hover:text-dark hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: ÉDITORIAL */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'editorial' && (
        <div className="bg-white rounded-[28px] border border-gray-50 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-cream/30 to-transparent">
            <h2 className="text-xl font-serif font-bold text-dark flex items-center gap-3">
              <BookOpen size={22} className="text-gold" />
              Section Éditorial
            </h2>
            <p className="text-sm text-gray-500 mt-1">L'en-tête de la page — image ronde, citation et texte descriptif (ex "Le Journal")</p>
          </div>
          <div className="px-8 pb-8">
            <FieldRow label="Titre principal" description="Le titre affiché en grand sur la page">
              <input
                type="text"
                value={editorialTitre}
                onChange={e => setEditorialTitre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition-all"
                placeholder="Éditorial"
              />
            </FieldRow>

            <FieldRow label="Sous-titre" description="Texte sous le titre principal">
              <input
                type="text"
                value={editorialSousTitre}
                onChange={e => setEditorialSousTitre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition-all"
                placeholder="Le Sommaire d'AFRIKHER"
              />
            </FieldRow>

            <FieldRow label="Image principale" description="Photo ronde affichée au centre (portrait fondatrice, etc.)">
              <div className="flex items-center gap-6">
                {editorialImage ? (
                  <div className="relative group">
                    <img src={editorialImage} alt="" className="w-28 h-28 rounded-full object-cover border-2 border-gray-100" />
                    <button
                      onClick={() => setEditorialImage('')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <ImageIcon size={28} />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gold hover:text-gold cursor-pointer transition-all">
                  {uploading === 'editorial' ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading === 'editorial' ? 'Upload...' : 'Choisir une image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadImage(file, 'site', 'editorial');
                        setEditorialImage(url);
                      } catch (err: unknown) {
                        setError('Erreur upload: ' + (err instanceof Error ? err.message : 'Erreur'));
                      }
                    }}
                  />
                </label>
              </div>
            </FieldRow>

            <FieldRow label="Citation" description="Texte en italique affiché à gauche de l'image">
              <textarea
                value={editorialCitation}
                onChange={e => setEditorialCitation(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition-all resize-none"
                placeholder="Interviews, récits et dossiers..."
              />
            </FieldRow>

            <FieldRow label="Texte descriptif" description="Paragraphe affiché à droite de l'image" noBorder>
              <textarea
                value={editorialTexte}
                onChange={e => setEditorialTexte(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition-all resize-none"
                placeholder="AFRIKHER porte la vision..."
              />
            </FieldRow>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: CHAPITRES */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'chapitres' && (
        <div className="space-y-6">
          {/* Add chapter button */}
          <div className="flex justify-end">
            <button
              onClick={addChapitre}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-2xl font-semibold text-sm hover:bg-gold/90 transition-all shadow-lg shadow-gold/20"
            >
              <Plus size={16} /> Ajouter un chapitre
            </button>
          </div>

          {chapitres.map((chapitre) => (
            <div key={chapitre.id} className="bg-white rounded-[28px] border border-gray-50 shadow-sm overflow-hidden">
              {/* Chapter header */}
              <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-cream/30 to-transparent">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-serif font-bold text-gold/40">{chapitre.numero}</span>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-dark">{chapitre.titre || 'Sans titre'}</h3>
                    <p className="text-xs text-gray-400">Chapitre {chapitre.numero}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => moveChapitre(chapitre.id, 'up')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Monter">
                    <ChevronUp size={16} className="text-gray-400" />
                  </button>
                  <button onClick={() => moveChapitre(chapitre.id, 'down')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Descendre">
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Supprimer ce chapitre ?')) removeChapitre(chapitre.id); }}
                    className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-400 hover:text-red-500"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="px-8 pb-6">
                <FieldRow label="Titre" description="Nom du chapitre en majuscules">
                  <input
                    type="text"
                    value={chapitre.titre}
                    onChange={e => updateChapitre(chapitre.id, 'titre', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition-all font-semibold"
                    placeholder="ICONIQUES"
                  />
                </FieldRow>

                <FieldRow label="Description" description="Texte descriptif du chapitre">
                  <textarea
                    value={chapitre.description}
                    onChange={e => updateChapitre(chapitre.id, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition-all resize-none"
                    placeholder="Description du chapitre..."
                  />
                </FieldRow>

                <FieldRow label="Image" description="Image illustrant le chapitre">
                  <div className="flex items-center gap-4">
                    {chapitre.image ? (
                      <div className="relative group">
                        <img src={chapitre.image} alt="" className="w-32 h-20 rounded-xl object-cover border border-gray-100" />
                        <button
                          onClick={() => updateChapitre(chapitre.id, 'image', '')}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gold hover:text-gold cursor-pointer transition-all">
                      {uploading === chapitre.id ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploading === chapitre.id ? 'Upload...' : 'Image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await uploadImage(file, 'articles', chapitre.id);
                            updateChapitre(chapitre.id, 'image', url);
                          } catch (err: unknown) {
                            setError('Erreur upload: ' + (err instanceof Error ? err.message : 'Erreur'));
                          }
                        }}
                      />
                    </label>
                  </div>
                </FieldRow>

                {/* Bullet points / items */}
                <FieldRow label="Points clés" description="Liste à puces (optionnel)" noBorder>
                  <div className="space-y-2">
                    {(chapitre.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-2">
                        <GripVertical size={14} className="text-gray-300 shrink-0" />
                        <input
                          type="text"
                          value={item}
                          onChange={e => updateItem(chapitre.id, itemIdx, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold transition-all"
                          placeholder="Point clé..."
                        />
                        <button
                          onClick={() => removeItem(chapitre.id, itemIdx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addItem(chapitre.id)}
                      className="flex items-center gap-1.5 text-sm text-gold hover:text-gold/80 transition-colors mt-2"
                    >
                      <Plus size={14} /> Ajouter un point
                    </button>
                  </div>
                </FieldRow>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: GALERIE PHOTOS */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'galerie' && (
        <div className="bg-white rounded-[28px] border border-gray-50 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-cream/30 to-transparent">
            <div>
              <h2 className="text-xl font-serif font-bold text-dark flex items-center gap-3">
                <Camera size={22} className="text-gold" />
                Galerie Photos
              </h2>
              <p className="text-sm text-gray-500 mt-1">Photos affichées dans la section galerie de la page Rubriques</p>
            </div>
            <label className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-2xl font-semibold text-sm hover:bg-gold/90 cursor-pointer transition-all shadow-lg shadow-gold/20">
              {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
              Ajouter des photos
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;
                  for (let i = 0; i < files.length; i++) {
                    await addPhoto(files[i]);
                  }
                }}
              />
            </label>
          </div>

          <div className="p-8">
            {photos.length === 0 ? (
              <div className="text-center py-16">
                <Camera size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm">Aucune photo dans la galerie</p>
                <p className="text-gray-300 text-xs mt-1">Cliquez sur "Ajouter des photos" pour commencer</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {photos.map(photo => (
                  <div key={photo.id} className="group relative">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-50">
                      <img src={photo.url} alt={photo.legende} className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={12} />
                    </button>
                    <input
                      type="text"
                      value={photo.legende}
                      onChange={e => updatePhotoLegende(photo.id, e.target.value)}
                      placeholder="Légende..."
                      className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-gold transition-all"
                    />
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
              <h2 className="text-xl font-serif font-bold text-dark flex items-center gap-3">
                <Video size={22} className="text-gold" />
                Vidéos
              </h2>
              <p className="text-sm text-gray-500 mt-1">Ajoutez des vidéos YouTube ou Vimeo</p>
            </div>
            <button
              onClick={addVideo}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-2xl font-semibold text-sm hover:bg-gold/90 transition-all shadow-lg shadow-gold/20"
            >
              <Plus size={16} /> Ajouter une vidéo
            </button>
          </div>

          <div className="p-8">
            {videos.length === 0 ? (
              <div className="text-center py-16">
                <Video size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm">Aucune vidéo ajoutée</p>
                <p className="text-gray-300 text-xs mt-1">Ajoutez des liens YouTube ou Vimeo</p>
              </div>
            ) : (
              <div className="space-y-6">
                {videos.map(video => (
                  <div key={video.id} className="border border-gray-100 rounded-2xl p-6 relative group">
                    <button
                      onClick={() => removeVideo(video.id)}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Titre</label>
                        <input
                          type="text"
                          value={video.titre}
                          onChange={e => updateVideo(video.id, 'titre', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold transition-all"
                          placeholder="Titre de la vidéo"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">URL (YouTube / Vimeo)</label>
                        <input
                          type="url"
                          value={video.url}
                          onChange={e => updateVideo(video.id, 'url', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold transition-all"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Description (optionnel)</label>
                      <input
                        type="text"
                        value={video.description}
                        onChange={e => updateVideo(video.id, 'description', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold transition-all"
                        placeholder="Courte description..."
                      />
                    </div>
                    {/* Video preview */}
                    {video.url && (
                      <div className="mt-3">
                        {video.url.includes('youtube.com') || video.url.includes('youtu.be') ? (
                          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 max-w-xs">
                            <iframe
                              src={`https://www.youtube.com/embed/${extractYouTubeId(video.url)}`}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Aperçu disponible pour les vidéos YouTube</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Save Button ── */}
      <div className="flex justify-end pt-4 pb-8">
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-dark text-white rounded-2xl font-semibold text-sm hover:bg-charcoal transition-all shadow-lg shadow-dark/10 disabled:opacity-50"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? 'Sauvegarde en cours...' : saved ? 'Sauvegardé !' : 'Enregistrer toutes les modifications'}
        </button>
      </div>
    </div>
  );
}

// ── Utility: extract YouTube video ID ──
function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}
