import { useEffect, useState, useCallback } from 'react';
import {
  Save, Upload, RefreshCw, Check, AlertCircle, Plus, Trash2,
  GripVertical, Eye, EyeOff, ExternalLink, Image as ImageIcon,
  BookOpen, ArrowUp, ArrowDown, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AdminAlert,
  AdminFieldRow,
  AdminIconBadge,
  AdminSectionHeader,
  AdminSectionShell,
  adminGhostButtonClass,
  adminInputClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
  adminTextareaClass,
} from '../components/AdminPrimitives';

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
  heyzine_url: string | null;
  pdf_url: string | null;
}

type ViewMode = 'list' | 'editor';

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
      const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      const lowerName = (file.name || '').toLowerCase();
      const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
      if (isHeic) {
        reject(new Error("Les images HEIC/HEIF (iPhone) ne sont pas supportées par le navigateur. Exportez en JPG ou PNG avant d'uploader (sur iPhone : Réglages → Appareil photo → Formats → Le plus compatible)."));
        return;
      }
      if (supportedTypes.includes(file.type) || file.type === '') { resolve(file); return; }
      const img = new Image();
      const url = URL.createObjectURL(file);
      const timeoutId = window.setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error(`Format non supporté ou image illisible: ${file.type || 'inconnu'}. Utilisez un JPG ou PNG.`));
      }, 15000);
      img.onload = () => {
        window.clearTimeout(timeoutId);
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
      img.onerror = () => {
        window.clearTimeout(timeoutId);
        URL.revokeObjectURL(url);
        reject(new Error(`Format non supporté: ${file.type || 'inconnu'}. Utilisez un JPG ou PNG.`));
      };
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
        heyzine_url: editingMagazine.heyzine_url?.trim() || null,
        pdf_url: editingMagazine.pdf_url?.trim() || null,
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
      heyzine_url: '',
      pdf_url: '',
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
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-[#C9A84C]" />
          <p className="text-sm text-[#6F675B]">Chargement des magazines...</p>
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
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setViewMode('list'); setEditingMagazine(null); }}
              className={`${adminGhostButtonClass} !tracking-[0.08em] px-3 py-2 text-[11px]`}
            >
              ← Retour
            </button>
            <h1 className="font-display text-3xl font-semibold text-[#0A0A0A]">
              {editingMagazine.id ? 'Modifier le magazine' : 'Nouveau magazine'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`${adminPrimaryButtonClass} !tracking-[0.08em] ${saved ? 'bg-[#3A342A]' : ''}`}
            >
              {saving ? <><RefreshCw size={14} className="mr-2 animate-spin" /> Enregistrement...</>
                : saved ? <><Check size={14} className="mr-2" /> Enregistré</>
                : <><Save size={14} className="mr-2" /> Enregistrer</>}
            </button>
          </div>
        </div>

        {error && (
          <AdminAlert tone="error" className="mb-4">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="flex-1 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="text-sm font-medium hover:opacity-70">Fermer</button>
          </AdminAlert>
        )}

        <AdminSectionShell className="overflow-hidden">
          <AdminSectionHeader
            eyebrow="Edition du numero"
            title={editingMagazine.id ? 'Ajuster la ligne editoriale' : 'Composer un nouveau numero'}
            description="Renseignez les informations du numero, sa couverture, son prix et l'ordre de ses pages sans quitter l'atelier magazine."
          />
          <div className="px-10 py-6">
            <AdminFieldRow label="Titre" description="Le titre complet du magazine.">
              <input
                type="text"
                value={editingMagazine.title || ''}
                onChange={(e) => {
                  const title = e.target.value;
                  setEditingMagazine(prev => prev ? { ...prev, title, slug: generateSlug(title) } : null);
                }}
                className={`${adminInputClass} rounded-2xl`}
                placeholder="AFRIKHER N°5 — Titre du numéro"
              />
            </AdminFieldRow>

            <AdminFieldRow label="Slug URL" description="Identifiant unique pour l'URL.">
              <input
                type="text"
                value={editingMagazine.slug || ''}
                onChange={(e) => setEditingMagazine(prev => prev ? { ...prev, slug: e.target.value } : null)}
                className={`${adminInputClass} max-w-md rounded-2xl font-mono`}
                placeholder="afrikher-n5-titre"
              />
            </AdminFieldRow>

            <AdminFieldRow label="Description" description="Courte description du numéro.">
              <textarea
                value={editingMagazine.description || ''}
                onChange={(e) => setEditingMagazine(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={3}
                className={`${adminTextareaClass} rounded-2xl`}
                placeholder="Description du contenu de ce numéro..."
              />
            </AdminFieldRow>

            <AdminFieldRow label="Prix" description="Prix unitaire du magazine en euros.">
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
                  className={`${adminInputClass} w-32 rounded-2xl`}
                  placeholder="9.99"
                />
                <span className="text-sm font-medium text-[#6F675B]">EUR</span>
              </div>
            </AdminFieldRow>

            <AdminFieldRow label="Couverture" description="Image de couverture (page 1). Format A4 portrait recommandé (1240x1754px ou 2480x3508px).">
              <div className="flex items-start gap-6">
                <div className="h-44 w-32 shrink-0 overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#F8F6F2] flex items-center justify-center">
                  {editingMagazine.cover_image ? (
                    <img src={editingMagazine.cover_image} alt="Couverture" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={28} className="text-[#9A9A8A]" />
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <label className={`${adminGhostButtonClass} !tracking-[0.08em] cursor-pointer ${uploading === 'cover' ? 'opacity-50 cursor-wait' : ''}`}>
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
                  <span className="text-xs text-[#9A9A8A]">JPEG recommandé, format A4 portrait</span>
                  {editingMagazine.cover_image && (
                    <input
                      type="text"
                      value={editingMagazine.cover_image}
                      onChange={(e) => setEditingMagazine(prev => prev ? { ...prev, cover_image: e.target.value } : null)}
                      className={`${adminInputClass} rounded-2xl px-3 py-2 text-xs font-mono text-[#6F675B]`}
                      placeholder="Ou collez une URL"
                    />
                  )}
                </div>
              </div>
            </AdminFieldRow>

            <AdminFieldRow label="Pages du magazine" description="Uploadez les pages JPEG du magazine (format A4). Vous pouvez réordonner les pages après upload." noBorder>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className={`inline-flex cursor-pointer items-center rounded-2xl border border-dashed border-[#C9A84C]/35 bg-[#FBF8F2] px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#0A0A0A] transition-all hover:border-[#C9A84C] hover:bg-white ${uploading === 'pages' ? 'opacity-50 cursor-wait' : ''}`}>
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
                  <span className="text-sm text-[#6F675B]">
                    {(editingMagazine.pages || []).length} page(s) ajoutée(s)
                  </span>
                </div>

                {uploading === 'pages' && (
                  <div className="h-2 w-full rounded-full bg-[#ECE7DF]">
                    <div
                      className="h-2 rounded-full bg-[#C9A84C] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {(editingMagazine.pages || []).length > 0 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mt-4">
                    {(editingMagazine.pages || []).map((pageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-[3/4] overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#F8F6F2]">
                          <img src={pageUrl} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-[#F5F0E8]">
                          {index + 1}
                        </span>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                          {index > 0 && (
                            <button
                              onClick={() => movePage(index, 'up')}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0A0A0A] transition-colors hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
                              title="Monter"
                            >
                              <ArrowUp size={12} />
                            </button>
                          )}
                          {index < (editingMagazine.pages || []).length - 1 && (
                            <button
                              onClick={() => movePage(index, 'down')}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0A0A0A] transition-colors hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
                              title="Descendre"
                            >
                              <ArrowDown size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => removePage(index)}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0A0A0A] transition-colors hover:bg-[#7C2D2D] hover:text-[#F5F0E8]"
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
            </AdminFieldRow>

            <AdminFieldRow label="URL Flipbook Heyzine" description="Collez l'URL de partage Heyzine pour la lecture en ligne.">
              <input
                type="text"
                value={editingMagazine.heyzine_url || ''}
                onChange={(e) => setEditingMagazine(prev => prev ? { ...prev, heyzine_url: e.target.value } : null)}
                className={`${adminInputClass} rounded-2xl`}
                placeholder="https://heyzine.com/flip-book/..."
              />
            </AdminFieldRow>

            <AdminFieldRow label="URL du PDF" description="Lien direct vers le fichier PDF pour le téléchargement." noBorder>
              <input
                type="text"
                value={editingMagazine.pdf_url || ''}
                onChange={(e) => setEditingMagazine(prev => prev ? { ...prev, pdf_url: e.target.value } : null)}
                className={`${adminInputClass} rounded-2xl`}
                placeholder="https://..."
              />
            </AdminFieldRow>
          </div>
        </AdminSectionShell>
      </div>
    );
  }

  // ══════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#9A9A8A]">Editions & numéros</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-[#0A0A0A]">Magazines</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F675B]">Pilotez la collection des numéros digitaux, leur pricing et la mise en scene de la page magazine publique.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://afrikher-client.vercel.app/magazine"
            target="_blank"
            rel="noopener noreferrer"
            className={`${adminGhostButtonClass} !tracking-[0.08em]`}
          >
            <ExternalLink size={16} className="mr-2" />
            Voir le site
          </a>
          <button
            onClick={startNewMagazine}
            className={`${adminPrimaryButtonClass} !tracking-[0.08em]`}
          >
            <Plus size={14} className="mr-2" />
            Nouveau magazine
          </button>
        </div>
      </div>

      {error && (
        <AdminAlert tone="error" className="mb-4">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="flex-1 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-sm font-medium hover:opacity-70">Fermer</button>
        </AdminAlert>
      )}

      {saved && (
        <AdminAlert tone="success" className="mb-4">
          <Check size={18} className="shrink-0" />
          <p className="text-sm">Magazine enregistré avec succès.</p>
        </AdminAlert>
      )}

      <AdminSectionShell className="mb-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#0A0A0A]/8 bg-[#FBF8F2] px-6 py-4">
          <div className="flex items-start gap-4">
            <AdminIconBadge icon={ImageIcon} />
            <div>
              <h2 className="text-base font-semibold text-[#0A0A0A]">Banniere de la page Magazine</h2>
              <p className="mt-0.5 text-xs text-[#6F675B]">
                Image et texte affiches en haut de la page Magazine du site public
              </p>
            </div>
          </div>
          <button
            onClick={saveHeroConfig}
            disabled={heroSaving}
            className={`${adminPrimaryButtonClass} !tracking-[0.08em] px-4 py-2.5 ${heroSaved ? 'bg-[#3A342A]' : ''}`}
          >
            {heroSaving ? <><RefreshCw size={14} className="mr-2 animate-spin" /> Enregistrement...</>
              : heroSaved ? <><Check size={14} className="mr-2" /> Enregistre !</>
              : <><Save size={14} className="mr-2" /> Enregistrer</>}
          </button>
        </div>
        <div className="p-6">
          <div className="flex gap-6 mb-6">
            <div className="relative h-48 w-80 shrink-0 overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#F8F6F2]">
              {heroImage ? (
                <img src={heroImage} alt="Hero Magazine" className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-[#9A9A8A]">
                  <ImageIcon size={32} className="mb-2" />
                  <span className="text-xs">Aucune image</span>
                </div>
              )}
              {heroImage && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              )}
            </div>
            <div className="flex flex-col gap-3 flex-1">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9A9A8A]">Image de banniere</label>
              <p className="text-xs text-[#6F675B]">
                Cette image s'affiche en grand en haut de la page Magazine. Format recommande : 1920x800px minimum, paysage.
              </p>
              <label className={`${adminGhostButtonClass} !tracking-[0.08em] w-fit cursor-pointer ${heroUploading ? 'opacity-50 cursor-wait' : ''}`}>
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
                  className={`${adminInputClass} rounded-2xl px-3 py-2 text-xs font-mono text-[#6F675B]`}
                  placeholder="Ou collez une URL d'image"
                />
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#9A9A8A]">
              Titre principal
            </label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className={`${adminInputClass} rounded-2xl`}
              placeholder="Le magazine qui celebre la femme africaine entrepreneure"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#9A9A8A]">
              Sous-titre
            </label>
            <textarea
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              rows={2}
              className={`${adminTextareaClass} rounded-2xl`}
              placeholder="Portraits, interviews exclusives et analyses pour celles qui batissent l'Afrique de demain."
            />
          </div>
        </div>
      </AdminSectionShell>

      {/* Empty state */}
      {magazines.length === 0 && (
        <div className="rounded-[2rem] border border-[#E5E0D8] bg-white p-20 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-[#C9A84C]" />
          <h2 className="mb-2 font-display text-3xl font-semibold text-[#0A0A0A]">Aucun magazine</h2>
          <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-[#6F675B]">
            Créez votre premier numéro de magazine digital. Chaque magazine est constitué de pages JPEG au format A4.
          </p>
          <button
            onClick={startNewMagazine}
            className={`${adminPrimaryButtonClass} !tracking-[0.08em]`}
          >
            <Plus size={14} className="mr-2" />
            Créer un magazine
          </button>
        </div>
      )}

      {/* Magazines list */}
      {magazines.length > 0 && (
        <div className="overflow-hidden rounded-[2rem] border border-[#E5E0D8] bg-white">
          <div className="divide-y divide-[#EFE8DD]">
            {magazines.map((mag) => (
              <div key={mag.id} className="flex items-center gap-6 p-5 transition-colors hover:bg-[#FBF8F2]">
                <div className="h-22 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#F8F6F2]">
                  {mag.cover_image ? (
                    <img src={mag.cover_image} alt={mag.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-[#9A9A8A]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="truncate font-display text-xl font-semibold text-[#0A0A0A]">{mag.title}</h3>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                      mag.status === 'published'
                        ? 'border-[#C9A84C]/30 bg-[#FBF7ED] text-[#6D5622]'
                        : mag.status === 'archived'
                          ? 'border-[#D9D1C2] bg-[#F5F3EF] text-[#6F675B]'
                          : 'border-[#E5E0D8] bg-[#F8F6F2] text-[#6F675B]'
                    }`}>
                      {mag.status === 'published' ? 'Publié' : mag.status === 'archived' ? 'Archivé' : 'Brouillon'}
                    </span>
                  </div>
                  <p className="truncate text-sm text-[#6F675B]">{mag.description || 'Pas de description'}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-[#9A9A8A]">
                    <span>{mag.page_count} pages</span>
                    <span>{mag.price?.toFixed(2)} €</span>
                    <span>/{mag.slug}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePublish(mag)}
                    className={`inline-flex items-center rounded-2xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                      mag.status === 'published'
                        ? 'border-[#C9A84C]/35 text-[#6D5622] hover:bg-[#FBF7ED]'
                        : 'border-[#D9D1C2] text-[#0A0A0A] hover:bg-[#F5F3EF]'
                    }`}
                  >
                    {mag.status === 'published' ? <><EyeOff size={12} className="mr-1.5" /> Dépublier</> : <><Eye size={12} className="mr-1.5" /> Publier</>}
                  </button>
                  <button
                    onClick={() => startEditMagazine(mag)}
                    className={`${adminSecondaryButtonClass} !tracking-[0.06em]`}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(mag.id)}
                    disabled={deletingId === mag.id}
                    className="inline-flex items-center rounded-2xl px-2 py-2 text-[#7C2D2D] transition-colors hover:bg-[#FBF1F0] disabled:opacity-50"
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
