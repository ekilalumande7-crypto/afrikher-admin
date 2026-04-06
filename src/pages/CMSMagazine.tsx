import { useEffect, useState, useCallback } from 'react';
import {
  Save, Upload, RefreshCw, Check, AlertCircle, Plus, Trash2,
  GripVertical, Eye, EyeOff, ExternalLink, Image as ImageIcon,
  BookOpen, ArrowUp, ArrowDown, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Magazine {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  price: number;
  currency: string;
  page_count: number;
  pages: string[];
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

type ViewMode = 'list' | 'editor';

// ── Field Row Component (OUTSIDE to prevent re-mount on every render) ──
const FieldRow = ({ label, description, children, noBorder }: {
  label: string; description?: string; children: React.ReactNode; noBorder?: boolean;
}) => (
  <div className={`py-6 ${noBorder ? '' : 'border-b border-gray-100'}`}>
    <div className="flex items-start justify-between gap-8">
      <div className="w-56 shrink-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  </div>
);

export default function CMSMagazine() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingMagazine, setEditingMagazine] = useState<Partial<Magazine> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [priceText, setPriceText] = useState<string>('');

  // ── Hero CMS config ──
  const [heroImage, setHeroImage] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroSaved, setHeroSaved] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);

  const loadMagazines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('magazines')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setMagazines(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur de chargement: ' + message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load hero config from site_config
  const loadHeroConfig = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('site_config')
        .select('key, value')
        .in('key', ['magazine_hero_image', 'magazine_hero_title', 'magazine_hero_subtitle']);
      if (data) {
        data.forEach((row: { key: string; value: string }) => {
          if (row.key === 'magazine_hero_image') setHeroImage(row.value || '');
          if (row.key === 'magazine_hero_title') setHeroTitle(row.value || '');
          if (row.key === 'magazine_hero_subtitle') setHeroSubtitle(row.value || '');
        });
      }
    } catch (err) {
      console.error('Error loading hero config:', err);
    }
  }, []);

  const saveHeroConfig = async () => {
    try {
      setHeroSaving(true);
      setError(null);

      const updates = [
        { key: 'magazine_hero_image', value: heroImage },
        { key: 'magazine_hero_title', value: heroTitle },
        { key: 'magazine_hero_subtitle', value: heroSubtitle },
      ];

      for (const item of updates) {
        const { error: upsertError } = await supabase
          .from('site_config')
          .upsert({ key: item.key, value: item.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (upsertError) throw upsertError;
      }

      setHeroSaved(true);
      setTimeout(() => setHeroSaved(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur sauvegarde hero: ' + message);
    } finally {
      setHeroSaving(false);
    }
  };

  const handleHeroImageUpload = async (file: File) => {
    try {
      setHeroUploading(true);
      setError(null);
      const processedFile = await convertImageToJpeg(file);
      const fileExt = processedFile.name.split('.').pop() || 'jpg';
      const fileName = `magazine-hero-${Date.now()}.${fileExt}`;
      const filePath = `site/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('afrikher-public')
        .upload(filePath, processedFile, { cacheControl: '3600', upsert: true, contentType: processedFile.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('afrikher-public').getPublicUrl(filePath);
      setHeroImage(urlData.publicUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError("Erreur upload image hero: " + message);
    } finally {
      setHeroUploading(false);
    }
  };

  useEffect(() => { loadMagazines(); loadHeroConfig(); }, [loadMagazines, loadHeroConfig]);

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
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

  const handleCoverUpload = async (file: File) => {
    if (!editingMagazine) return;
    try {
      setUploading('cover');
      setError(null);
      const processedFile = await convertImageToJpeg(file);
      const fileExt = processedFile.name.split('.').pop() || 'jpg';
      const slug = editingMagazine.slug || generateSlug(editingMagazine.title || 'magazine');
      const fileName = `${slug}-cover-${Date.now()}.${fileExt}`;
      const filePath = `magazines/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('afrikher-public')
        .upload(filePath, processedFile, { cacheControl: '3600', upsert: true, contentType: processedFile.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('afrikher-public').getPublicUrl(filePath);
      setEditingMagazine(prev => prev ? { ...prev, cover_image: urlData.publicUrl } : null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError("Erreur d'upload couverture: " + message);
    } finally {
      setUploading(null);
    }
  };

  const handlePagesUpload = async (files: FileList) => {
    if (!editingMagazine) return;
    try {
      setUploading('pages');
      setError(null);
      const slug = editingMagazine.slug || generateSlug(editingMagazine.title || 'magazine');
      const currentPages = [...(editingMagazine.pages || [])];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
        const processedFile = await convertImageToJpeg(files[i]);
        const fileExt = processedFile.name.split('.').pop() || 'jpg';
        const pageNum = currentPages.length + 1;
        const fileName = `${slug}-page-${String(pageNum).padStart(3, '0')}-${Date.now()}.${fileExt}`;
        const filePath = `magazines/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('afrikher-public')
          .upload(filePath, processedFile, { cacheControl: '3600', upsert: true, contentType: processedFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('afrikher-public').getPublicUrl(filePath);
        currentPages.push(urlData.publicUrl);
      }

      setEditingMagazine(prev => prev ? {
        ...prev,
        pages: currentPages,
        page_count: currentPages.length
      } : null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError("Erreur d'upload pages: " + message);
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const removePage = (index: number) => {
    if (!editingMagazine) return;
    const newPages = [...(editingMagazine.pages || [])];
    newPages.splice(index, 1);
    setEditingMagazine(prev => prev ? { ...prev, pages: newPages, page_count: newPages.length } : null);
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    if (!editingMagazine) return;
    const newPages = [...(editingMagazine.pages || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPages.length) return;
    [newPages[index], newPages[targetIndex]] = [newPages[targetIndex], newPages[index]];
    setEditingMagazine(prev => prev ? { ...prev, pages: newPages } : null);
  };

  const handleSave = async () => {
    if (!editingMagazine) return;
    if (!editingMagazine.title?.trim()) { setError('Le titre est obligatoire'); return; }
    if (!editingMagazine.cover_image) { setError('La couverture est obligatoire'); return; }
    const finalPrice = parseFloat(priceText.replace(',', '.'));
    if (isNaN(finalPrice) || finalPrice <= 0) { setError('Le prix doit être un nombre positif (ex: 9.99, 1.50)'); return; }

    try {
      setSaving(true);
      setError(null);
      const slug = editingMagazine.slug || generateSlug(editingMagazine.title);
      const magazineData = {
        title: editingMagazine.title.trim(),
        slug,
        description: editingMagazine.description?.trim() || '',
        cover_image: editingMagazine.cover_image,
        price: finalPrice,
        currency: editingMagazine.currency || 'EUR',
        page_count: (editingMagazine.pages || []).length,
        pages: editingMagazine.pages || [],
        status: editingMagazine.status || 'draft',
        updated_at: new Date().toISOString(),
      };

      if (editingMagazine.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from('magazines')
          .update(magazineData)
          .eq('id', editingMagazine.id);
        if (updateError) throw updateError;
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('magazines')
          .insert(magazineData);
        if (insertError) throw insertError;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await loadMagazines();
      setViewMode('list');
      setEditingMagazine(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur de sauvegarde: ' + message);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (magazine: Magazine) => {
    try {
      setError(null);
      const newStatus = magazine.status === 'published' ? 'draft' : 'published';
      const { error: updateError } = await supabase
        .from('magazines')
        .update({
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', magazine.id);
      if (updateError) throw updateError;
      await loadMagazines();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur: ' + message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce magazine ? Cette action est irréversible.')) return;
    try {
      setDeletingId(id);
      setError(null);
      const { error: deleteError } = await supabase.from('magazines').delete().eq('id', id);
      if (deleteError) throw deleteError;
      await loadMagazines();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur suppression: ' + message);
    } finally {
      setDeletingId(null);
    }
  };

  const startNewMagazine = () => {
    setEditingMagazine({
      title: '',
      slug: '',
      description: '',
      cover_image: '',
      price: 9.99,
      currency: 'EUR',
      page_count: 0,
      pages: [],
      status: 'draft',
    });
    setPriceText('9.99');
    setViewMode('editor');
  };

  const startEditMagazine = (magazine: Magazine) => {
    setEditingMagazine({ ...magazine });
    setPriceText(magazine.price != null ? String(magazine.price) : '');
    setViewMode('editor');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Chargement des magazines...</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  // EDITOR VIEW
  // ══════════════════════════════════════
  if (viewMode === 'editor' && editingMagazine) {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setViewMode('list'); setEditingMagazine(null); }}
              className="flex items-center border border-black/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500 transition-colors hover:border-gold/30 hover:text-gold"
            >
              ← Retour
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Edition magazine</p>
              <h1 className="font-serif text-4xl font-semibold text-dark">
                {editingMagazine.id ? 'Modifier le magazine' : 'Nouveau magazine'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center px-6 py-3 rounded-2xl text-xs font-semibold uppercase tracking-[0.24em] transition-colors ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-dark text-cream hover:bg-charcoal'
              }`}
            >
              {saving ? <><RefreshCw size={14} className="mr-2 animate-spin" /> Enregistrement...</>
                : saved ? <><Check size={14} className="mr-2" /> Enregistré</>
                : <><Save size={14} className="mr-2" /> Enregistrer</>}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-sm text-red-500 hover:text-red-700 font-medium">Fermer</button>
          </div>
        )}

        <div className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-sm">
          <div className="px-10 py-6">
            {/* Title */}
            <FieldRow label="Titre" description="Le titre complet du magazine.">
              <input
                type="text"
                value={editingMagazine.title || ''}
                onChange={(e) => {
                  const title = e.target.value;
                  setEditingMagazine(prev => prev ? { ...prev, title, slug: generateSlug(title) } : null);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="AFRIKHER N°5 — Titre du numéro"
              />
            </FieldRow>

            {/* Slug */}
            <FieldRow label="Slug URL" description="Identifiant unique pour l'URL.">
              <input
                type="text"
                value={editingMagazine.slug || ''}
                onChange={(e) => setEditingMagazine(prev => prev ? { ...prev, slug: e.target.value } : null)}
                className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="afrikher-n5-titre"
              />
            </FieldRow>

            {/* Description */}
            <FieldRow label="Description" description="Courte description du numéro.">
              <textarea
                value={editingMagazine.description || ''}
                onChange={(e) => setEditingMagazine(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Description du contenu de ce numéro..."
              />
            </FieldRow>

            {/* Price */}
            <FieldRow label="Prix" description="Prix unitaire du magazine en euros.">
              <div className="flex items-center gap-3 max-w-xs">
                <input
                  type="text"
                  inputMode="decimal"
                  value={priceText}
                  onChange={(e) => {
                    const val = e.target.value.replace(',', '.');
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setPriceText(val);
                      const num = parseFloat(val);
                      if (!isNaN(num)) {
                        setEditingMagazine(prev => prev ? { ...prev, price: num } : null);
                      }
                    }
                  }}
                  className="w-32 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="9.99"
                />
                <span className="text-sm text-gray-500 font-medium">EUR</span>
              </div>
            </FieldRow>

            {/* Cover Image */}
            <FieldRow label="Couverture" description="Image de couverture (page 1). Format A4 portrait recommandé (1240x1754px ou 2480x3508px).">
              <div className="flex items-start gap-6">
                <div className="w-32 h-44 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 shrink-0">
                  {editingMagazine.cover_image ? (
                    <img src={editingMagazine.cover_image} alt="Couverture" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={28} className="text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <label className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${uploading === 'cover' ? 'opacity-50 cursor-wait' : ''}`}>
                    {uploading === 'cover' ? (
                      <><RefreshCw size={14} className="mr-2 animate-spin" /> Upload...</>
                    ) : (
                      <><Upload size={14} className="mr-2" /> {editingMagazine.cover_image ? 'Changer' : 'Uploader'}</>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
                      disabled={uploading === 'cover'}
                    />
                  </label>
                  <span className="text-xs text-gray-400">JPEG recommandé, format A4 portrait</span>
                  {editingMagazine.cover_image && (
                    <input
                      type="text"
                      value={editingMagazine.cover_image}
                      onChange={(e) => setEditingMagazine(prev => prev ? { ...prev, cover_image: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ou collez une URL"
                    />
                  )}
                </div>
              </div>
            </FieldRow>

            {/* Pages Upload */}
            <FieldRow label="Pages du magazine" description="Uploadez les pages JPEG du magazine (format A4). Vous pouvez réordonner les pages après upload." noBorder>
              <div className="space-y-4">
                {/* Upload button */}
                <div className="flex items-center gap-4">
                  <label className={`inline-flex items-center px-5 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-blue-400 cursor-pointer transition-all ${uploading === 'pages' ? 'opacity-50 cursor-wait' : ''}`}>
                    {uploading === 'pages' ? (
                      <><RefreshCw size={14} className="mr-2 animate-spin" /> Upload {uploadProgress}%...</>
                    ) : (
                      <><Plus size={14} className="mr-2" /> Ajouter des pages</>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => { const f = e.target.files; if (f && f.length > 0) handlePagesUpload(f); }}
                      disabled={uploading === 'pages'}
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    {(editingMagazine.pages || []).length} page(s) ajoutée(s)
                  </span>
                </div>

                {/* Upload progress bar */}
                {uploading === 'pages' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {/* Pages grid */}
                {(editingMagazine.pages || []).length > 0 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mt-4">
                    {(editingMagazine.pages || []).map((pageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-[3/4] bg-gray-100 rounded overflow-hidden border border-gray-200">
                          <img src={pageUrl} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <span className="absolute bottom-1 left-1 bg-black/70 text-slate-900 text-[10px] px-1.5 py-0.5 rounded font-mono">
                          {index + 1}
                        </span>
                        {/* Actions overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                          {index > 0 && (
                            <button
                              onClick={() => movePage(index, 'up')}
                              className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-blue-500 hover:text-slate-900 transition-colors"
                              title="Monter"
                            >
                              <ArrowUp size={12} />
                            </button>
                          )}
                          {index < (editingMagazine.pages || []).length - 1 && (
                            <button
                              onClick={() => movePage(index, 'down')}
                              className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-blue-500 hover:text-slate-900 transition-colors"
                              title="Descendre"
                            >
                              <ArrowDown size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => removePage(index)}
                            className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-red-500 hover:text-slate-900 transition-colors"
                            title="Supprimer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FieldRow>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 border border-gold/20 bg-gold/5 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-gold">
            <BookOpen size={14} />
            CMS Magazine
          </span>
          <h1 className="mt-4 font-serif text-5xl font-semibold text-dark">Direction magazine</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-500">
            Pilotez la couverture, le hero et la collection de numéros depuis une interface plus éditoriale et plus premium.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://afrikher-client.vercel.app/magazine"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-5 py-3 border border-black/10 rounded-2xl text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 bg-white hover:border-gold/30 hover:text-gold transition-colors"
          >
            <ExternalLink size={16} className="mr-2" />
            Voir le site
          </a>
          <button
            onClick={startNewMagazine}
            className="flex items-center px-6 py-3 rounded-2xl text-xs font-semibold uppercase tracking-[0.2em] bg-dark text-cream hover:bg-charcoal transition-colors"
          >
            <Plus size={14} className="mr-2" />
            Nouveau magazine
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-sm text-red-500 hover:text-red-700 font-medium">Fermer</button>
        </div>
      )}

      {/* Success */}
      {saved && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-green-50 border border-green-200 rounded-lg">
          <Check size={18} className="text-green-500 shrink-0" />
          <p className="text-sm text-green-700">Magazine enregistré avec succès.</p>
        </div>
      )}

      {/* ══════ HERO CONFIGURATION ══════ */}
      <div className="overflow-hidden rounded-[32px] border border-black/5 bg-[#0A0A0A] text-cream shadow-[0_24px_80px_rgba(10,10,10,0.08)]">
        <div className="flex items-center justify-between border-b border-white/10 px-8 py-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Preview hero</p>
            <h2 className="mt-2 flex items-center gap-2 font-serif text-3xl text-cream">
              <ImageIcon size={18} className="text-gold" />
              Bannière de la page Magazine
            </h2>
            <p className="mt-1 text-xs text-cream/55">
              Image et texte affichés en haut de la page Magazine du site public.
            </p>
          </div>
          <button
            onClick={saveHeroConfig}
            disabled={heroSaving}
            className={`flex items-center px-5 py-3 rounded-2xl text-xs font-semibold uppercase tracking-[0.24em] transition-colors ${
              heroSaved
                ? 'bg-green-600 text-white'
                : 'bg-gold text-dark hover:bg-[#E8C97A]'
            }`}
          >
            {heroSaving ? <><RefreshCw size={14} className="mr-2 animate-spin" /> Enregistrement...</>
              : heroSaved ? <><Check size={14} className="mr-2" /> Enregistre !</>
              : <><Save size={14} className="mr-2" /> Enregistrer</>}
          </button>
        </div>
        <div className="p-8">
          {/* Hero image preview + upload */}
          <div className="mb-8 flex gap-6">
            <div className="relative h-48 w-80 shrink-0 overflow-hidden border border-white/10 bg-white/5">
              {heroImage ? (
                <img src={heroImage} alt="Hero Magazine" className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-cream/35">
                  <ImageIcon size={32} className="mb-2" />
                  <span className="text-xs">Aucune image</span>
                </div>
              )}
              {heroImage && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              )}
            </div>
            <div className="flex flex-col gap-3 flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Image de bannière</label>
              <p className="text-xs leading-6 text-cream/55">
                Cette image s'affiche en grand en haut de la page Magazine. Format recommandé : 1920x800px minimum, paysage.
              </p>
              <label className={`inline-flex items-center w-fit px-5 py-3 border border-white/15 rounded-2xl text-xs font-semibold uppercase tracking-[0.2em] text-cream bg-white/[0.03] hover:border-gold/30 hover:text-gold cursor-pointer transition-colors ${heroUploading ? 'opacity-50 cursor-wait' : ''}`}>
                {heroUploading ? (
                  <><RefreshCw size={14} className="mr-2 animate-spin" /> Upload...</>
                ) : (
                  <><Upload size={14} className="mr-2" /> {heroImage ? 'Changer l\'image' : 'Uploader une image'}</>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroImageUpload(f); }}
                  disabled={heroUploading}
                />
              </label>
              {heroImage && (
                <input
                  type="text"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-cream/70 font-mono focus:outline-none focus:ring-2 focus:ring-gold/30"
                  placeholder="Ou collez une URL d'image"
                />
              )}
            </div>
          </div>

          {/* Hero title */}
          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              Titre principal
            </label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold/30"
              placeholder="Le magazine qui celebre la femme africaine entrepreneure"
            />
          </div>

          {/* Hero subtitle */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              Sous-titre
            </label>
            <textarea
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold/30"
              placeholder="Portraits, interviews exclusives et analyses pour celles qui batissent l'Afrique de demain."
            />
          </div>
        </div>
      </div>

      {/* Empty state */}
      {magazines.length === 0 && (
        <div className="rounded-[32px] border border-black/5 bg-white p-20 text-center shadow-sm">
          <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun magazine</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Créez votre premier numéro de magazine digital. Chaque magazine est constitué de pages JPEG au format A4.
          </p>
          <button
            onClick={startNewMagazine}
            className="inline-flex items-center rounded-2xl bg-dark px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-charcoal"
          >
            <Plus size={14} className="mr-2" />
            Créer un magazine
          </button>
        </div>
      )}

      {/* Magazines list */}
      {magazines.length > 0 && (
        <div className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-sm">
          <div className="divide-y divide-gray-100">
            {magazines.map((mag) => (
              <div key={mag.id} className="flex items-center gap-6 p-6 transition-colors hover:bg-[#F9F7F2]">
                {/* Cover thumbnail */}
                <div className="h-24 w-16 shrink-0 overflow-hidden border border-black/8 bg-gray-100">
                  {mag.cover_image ? (
                    <img src={mag.cover_image} alt={mag.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="truncate font-serif text-2xl text-dark">{mag.title}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      mag.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : mag.status === 'archived'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {mag.status === 'published' ? 'Publié' : mag.status === 'archived' ? 'Archivé' : 'Brouillon'}
                    </span>
                  </div>
                  <p className="truncate text-sm text-gray-500">{mag.description || 'Pas de description'}</p>
                  <div className="mt-3 flex items-center gap-4 text-[11px] uppercase tracking-[0.18em] text-gray-400">
                    <span>{mag.page_count} pages</span>
                    <span>{mag.price?.toFixed(2)} €</span>
                    <span>/{mag.slug}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePublish(mag)}
                    className={`flex items-center px-4 py-2 rounded-2xl text-[11px] font-semibold uppercase tracking-[0.16em] border transition-colors ${
                      mag.status === 'published'
                        ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {mag.status === 'published' ? <><EyeOff size={12} className="mr-1.5" /> Dépublier</> : <><Eye size={12} className="mr-1.5" /> Publier</>}
                  </button>
                  <button
                    onClick={() => startEditMagazine(mag)}
                    className="flex items-center px-4 py-2 rounded-2xl text-[11px] font-semibold uppercase tracking-[0.16em] border border-black/10 text-gray-700 hover:border-gold/30 hover:text-gold transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(mag.id)}
                    disabled={deletingId === mag.id}
                    className="flex items-center px-2 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === mag.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
