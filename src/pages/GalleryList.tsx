import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Edit2,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GalleryItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  description: '',
  media_type: 'image' as 'image' | 'video',
  media_url: '',
  thumbnail_url: '',
  sort_order: '0',
  is_active: true,
};

function parseGalleryItems(raw: string | undefined): { items: GalleryItem[]; error: string | null } {
  if (!raw || !raw.trim()) return { items: [], error: null };

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { items: [], error: 'Le contenu JSON de `gallery_items` est invalide : un tableau est attendu.' };
    }

    return { items: parsed.map((item: any, index: number) => ({
      id: String(item.id || `gallery-${index}`),
      title: item.title || '',
      slug: item.slug || '',
      description: item.description || '',
      media_type: item.media_type === 'video' ? 'video' : 'image',
      media_url: item.media_url || item.url || '',
      thumbnail_url: item.thumbnail_url || item.thumbnail || '',
      sort_order: Number.isFinite(item.sort_order) ? item.sort_order : index,
      is_active: item.is_active !== false,
    })), error: null };
  } catch {
    return { items: [], error: 'Le contenu JSON de `gallery_items` n’a pas pu être lu. Corrigez la valeur enregistrée dans `site_config`.' };
  }
}

function serializeGalleryItems(items: GalleryItem[]) {
  return JSON.stringify(
    items.map((item, index) => ({
      ...item,
      sort_order: Number.isFinite(item.sort_order) ? item.sort_order : index,
    })),
    null,
    2
  );
}

export default function GalleryList() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [error, setError] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [success, setSuccess] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('site_config')
        .select('key, value')
        .eq('key', 'gallery_items')
        .maybeSingle();

      if (fetchError) throw fetchError;
      const parsed = parseGalleryItems(data?.value);
      setItems(parsed.items);
      setJsonError(parsed.error || '');
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement de la galerie.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  useEffect(() => {
    if (!editingId) {
      setForm((prev) => ({
        ...prev,
        slug: prev.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      }));
    }
  }, [form.title, editingId]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const query = search.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.is_active) ||
        (statusFilter === 'inactive' && !item.is_active);
      const matchesMedia = mediaFilter === 'all' || item.media_type === mediaFilter;
      return matchesSearch && matchesStatus && matchesMedia;
    });
  }, [items, search, statusFilter, mediaFilter]);

  const activeCount = items.filter((item) => item.is_active).length;
  const videoCount = items.filter((item) => item.media_type === 'video').length;
  const imageCount = items.filter((item) => item.media_type === 'image').length;

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description,
      media_type: item.media_type,
      media_url: item.media_url,
      thumbnail_url: item.thumbnail_url,
      sort_order: String(item.sort_order),
      is_active: item.is_active,
    });
  };

  const uploadAsset = async (
    file: File,
    folder: string,
    onSuccess: (url: string) => void,
    setBusy: (value: boolean) => void
  ) => {
    setBusy(true);
    setError('');

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from('afrikher-public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || `image/${ext}`,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('afrikher-public').getPublicUrl(filePath);
      onSuccess(data.publicUrl);
      setSuccess('Média importé.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur pendant l’import.');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    if (!form.media_url.trim()) {
      setError('Le média principal est obligatoire.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const nextItem: GalleryItem = {
        id: editingId || `gallery-${Date.now()}`,
        title: form.title.trim(),
        slug:
          form.slug.trim() ||
          form.title
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
        description: form.description.trim(),
        media_type: form.media_type,
        media_url: form.media_url.trim(),
        thumbnail_url: form.thumbnail_url.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };

      const nextItems = editingId
        ? items.map((item) => (item.id === editingId ? nextItem : item))
        : [...items, nextItem];

      const { error: upsertError } = await supabase.from('site_config').upsert(
        {
          key: 'gallery_items',
          value: serializeGalleryItems(nextItems),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (upsertError) throw upsertError;

      setItems(
        [...nextItems].sort((a, b) => {
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
          return a.title.localeCompare(b.title);
        })
      );
      setSuccess(editingId ? 'Média mis à jour.' : 'Média ajouté à la galerie.');
      resetForm();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err: any) {
      setError(err.message || 'Erreur de sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement ce média ?')) return;

    try {
      const nextItems = items.filter((item) => item.id !== id);
      const { error: upsertError } = await supabase.from('site_config').upsert(
        {
          key: 'gallery_items',
          value: serializeGalleryItems(nextItems),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (upsertError) throw upsertError;

      setItems(nextItems);
      setSuccess('Média supprimé.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err: any) {
      setError(err.message || 'Erreur de suppression.');
    }
  };

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#C9A84C]">
            Sélection visuelle
          </p>
          <h1 className="mt-2 font-serif text-[2.5rem] leading-[0.94] tracking-[-0.03em] text-[#0A0A0A] md:text-[3.4rem]">
            Galerie
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9A9A8A]">
            Composez une galerie qui sert l’image AFRIKHER comme un espace de choix éditorial,
            et non comme un simple gestionnaire de fichiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchGallery}
            className="inline-flex h-12 items-center justify-center border border-[#0A0A0A]/10 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]"
            title="Rafraîchir"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={resetForm}
            className="inline-flex h-12 items-center justify-center gap-3 border border-[#0A0A0A] bg-[#0A0A0A] px-6 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#F5F0E8] transition-colors hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
          >
            <Plus size={16} />
            Ajouter un média
          </button>
        </div>
      </div>

      {error ? <Notice tone="error" message={error} onClose={() => setError('')} /> : null}
      {jsonError ? <Notice tone="error" message={jsonError} onClose={() => setJsonError('')} /> : null}
      {success ? <Notice tone="success" message={success} onClose={() => setSuccess('')} /> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Total" value={items.length} detail="Médias enregistrés" />
        <MetricCard label="Images" value={imageCount} detail="Visuels fixes" />
        <MetricCard label="Vidéos" value={videoCount} detail="Formats animés ou externes" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="border border-[#0A0A0A]/10 bg-white p-6 md:p-7">
          <div className="border-b border-[#0A0A0A]/8 pb-5">
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
              {editingId ? 'Édition' : 'Création'}
            </p>
            <h2 className="mt-2 font-serif text-[1.9rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
              {editingId ? 'Modifier le média' : 'Ajouter un média'}
            </h2>
          </div>

          <div className="mt-6 space-y-5">
            <Field
              label="Titre"
              value={form.title}
              onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
              placeholder="Portrait fondatrice"
            />

            <Field
              label="Slug"
              value={form.slug}
              onChange={(value) => setForm((prev) => ({ ...prev, slug: value }))}
              placeholder="portrait-fondatrice"
            />

            <Field
              label="Description"
              value={form.description}
              onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
              placeholder="Courte note éditoriale sur l’usage de ce média."
              textarea
            />

            <div>
              <label className="mb-2 block text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
                Type de média
              </label>
              <select
                value={form.media_type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    media_type: e.target.value as 'image' | 'video',
                  }))
                }
                className="h-12 w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#C9A84C]"
              >
                <option value="image">Image</option>
                <option value="video">Vidéo</option>
              </select>
            </div>

            {form.media_type === 'image' ? (
              <UploadField
                title="Média principal"
                value={form.media_url}
                busy={uploading}
                onUpload={() => imageInputRef.current?.click()}
                onChange={(value) => setForm((prev) => ({ ...prev, media_url: value }))}
                placeholder="https://..."
              />
            ) : (
              <Field
                label="URL vidéo"
                value={form.media_url}
                onChange={(value) => setForm((prev) => ({ ...prev, media_url: value }))}
                placeholder="https://youtube.com/... ou https://vimeo.com/..."
                type="url"
              />
            )}

            <UploadField
              title="Miniature / aperçu"
              value={form.thumbnail_url}
              busy={thumbUploading}
              onUpload={() => thumbInputRef.current?.click()}
              onChange={(value) => setForm((prev) => ({ ...prev, thumbnail_url: value }))}
              placeholder="https://... (optionnel pour les images, recommandé pour les vidéos)"
              optional
            />

            <Field
              label="Ordre d’affichage"
              value={form.sort_order}
              onChange={(value) => setForm((prev) => ({ ...prev, sort_order: value }))}
              placeholder="0"
              type="number"
            />

            <div className="border border-[#0A0A0A]/10 bg-[#FBF8F2] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#0A0A0A]">
                    Média visible
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#9A9A8A]">
                    Activez ou mettez ce visuel en retrait dans la galerie.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
                  className={`relative h-7 w-14 transition-colors ${
                    form.is_active ? 'bg-[#C9A84C]' : 'bg-[#D7D0C5]'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 bg-white transition-all ${
                      form.is_active ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-12 items-center justify-center border border-[#0A0A0A] bg-[#0A0A0A] px-6 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#F5F0E8] transition-colors hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A0A0A] disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Ajouter'}
              </button>

              <button
                onClick={resetForm}
                className="inline-flex h-12 items-center justify-center border border-[#0A0A0A]/10 bg-white px-6 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                uploadAsset(
                  file,
                  'gallery',
                  (url) => setForm((prev) => ({ ...prev, media_url: url })),
                  setUploading
                );
              }
            }}
          />

          <input
            ref={thumbInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                uploadAsset(
                  file,
                  'gallery/thumbnails',
                  (url) => setForm((prev) => ({ ...prev, thumbnail_url: url })),
                  setThumbUploading
                );
              }
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="border border-[#0A0A0A]/10 bg-white p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9A8A]" />
                <input
                  type="text"
                  placeholder="Rechercher un média"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] pl-11 pr-4 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#9A9A8A] focus:border-[#C9A84C]"
                />
              </div>

              <select
                value={mediaFilter}
                onChange={(e) => setMediaFilter(e.target.value as 'all' | 'image' | 'video')}
                className="h-12 min-w-[11rem] border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#C9A84C]"
              >
                <option value="all">Tous les médias</option>
                <option value="image">Images</option>
                <option value="video">Vidéos</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="h-12 min-w-[11rem] border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#C9A84C]"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Masqués</option>
              </select>
            </div>
          </div>

          <div className="border border-[#0A0A0A]/10 bg-white p-6 md:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
                  Galerie éditoriale
                </p>
                <h2 className="mt-2 font-serif text-[1.9rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
                  Sélection visuelle
                </h2>
              </div>

              <StatusBadge activeCount={activeCount} total={items.length} />
            </div>

            {loading ? (
              <div className="px-4 py-16 text-center">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
                  Chargement de la galerie
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <p className="mx-auto max-w-lg font-serif text-[2rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
                  Aucun média ne correspond à cette vue.
                </p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#9A9A8A]">
                  Ajoutez un visuel ou élargissez les filtres pour retrouver la bonne sélection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {filteredItems
                  .sort((a, b) => {
                    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
                    return a.title.localeCompare(b.title);
                  })
                  .map((item) => {
                    const preview = item.thumbnail_url || item.media_url;
                    return (
                      <div
                        key={item.id}
                        className="border border-[#0A0A0A]/10 bg-[#FBF8F2] overflow-hidden transition-colors hover:border-[#C9A84C]/35"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-[#EFE6D0]">
                          {preview ? (
                            item.media_type === 'video' ? (
                              <div className="relative h-full w-full">
                                <img src={preview} alt={item.title} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0A0A0A]/75 text-[#F5F0E8]">
                                    <Video size={18} />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img src={preview} alt={item.title} className="h-full w-full object-cover" />
                            )
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#9A9A8A]">
                              {item.media_type === 'video' ? <Video size={28} /> : <ImageIcon size={28} />}
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-serif text-[1.35rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
                                {item.title}
                              </p>
                              <p className="mt-2 text-[0.68rem] uppercase tracking-[0.18em] text-[#9A9A8A]">
                                {item.slug}
                              </p>
                            </div>

                            <span
                              className={`inline-flex border px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] ${
                                item.media_type === 'video'
                                  ? 'border-[#C9A84C]/25 bg-[#EFE6D0] text-[#8A6E2F]'
                                  : 'border-[#0A0A0A]/8 bg-white text-[#9A9A8A]'
                              }`}
                            >
                              {item.media_type === 'video' ? 'Vidéo' : 'Image'}
                            </span>
                          </div>

                          <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#9A9A8A]">
                            {item.description || 'Sans description éditoriale.'}
                          </p>

                          <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#0A0A0A]/8 pt-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex border px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] ${
                                  item.is_active
                                    ? 'border-[#C9A84C]/25 bg-[#EFE6D0] text-[#8A6E2F]'
                                    : 'border-[#0A0A0A]/8 bg-white text-[#9A9A8A]'
                                }`}
                              >
                                {item.is_active ? 'Actif' : 'Masqué'}
                              </span>
                              <span className="text-[0.68rem] uppercase tracking-[0.18em] text-[#9A9A8A]">
                                Ordre {item.sort_order}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEdit(item)}
                                className="inline-flex h-10 items-center justify-center gap-2 border border-[#0A0A0A]/10 px-3 text-[0.64rem] uppercase tracking-[0.2em] text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]"
                              >
                                <Edit2 size={14} />
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="inline-flex h-10 items-center justify-center gap-2 border border-[#9C4C3A]/12 px-3 text-[0.64rem] uppercase tracking-[0.2em] text-[#9C4C3A] transition-colors hover:bg-[#F7E3DE]"
                              >
                                <Trash2 size={14} />
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea = false,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] p-4 text-sm leading-7 text-[#0A0A0A] outline-none transition-colors placeholder:text-[#9A9A8A] focus:border-[#C9A84C] resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#9A9A8A] focus:border-[#C9A84C]"
        />
      )}
    </div>
  );
}

function UploadField({
  title,
  value,
  busy,
  onUpload,
  onChange,
  placeholder,
  optional = false,
}: {
  title: string;
  value: string;
  busy: boolean;
  onUpload: () => void;
  onChange: (value: string) => void;
  placeholder: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
        {title} {optional ? '(optionnel)' : ''}
      </label>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex h-12 items-center justify-center gap-3 border border-[#0A0A0A]/10 bg-[#FBF8F2] px-5 text-[0.68rem] uppercase tracking-[0.22em] text-[#0A0A0A] transition-colors hover:border-[#C9A84C]/35 hover:bg-white"
        >
          {busy ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
          {busy ? 'Import...' : 'Importer'}
        </button>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#9A9A8A] focus:border-[#C9A84C]"
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="border border-[#0A0A0A]/10 bg-white p-6">
      <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">{label}</p>
      <p className="mt-3 font-serif text-[2.4rem] leading-none tracking-[-0.03em] text-[#0A0A0A]">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-[#9A9A8A]">{detail}</p>
    </div>
  );
}

function Notice({
  tone,
  message,
  onClose,
}: {
  tone: 'success' | 'error';
  message: string;
  onClose: () => void;
}) {
  const styles =
    tone === 'success'
      ? 'border-[#C9A84C]/25 bg-[#EFE6D0] text-[#8A6E2F]'
      : 'border-[#9C4C3A]/18 bg-[#F7E3DE] text-[#9C4C3A]';

  return (
    <div className={`flex items-center justify-between gap-4 border px-5 py-4 text-sm ${styles}`}>
      <span>{message}</span>
      <button onClick={onClose} className="transition-opacity hover:opacity-70">
        <X size={15} />
      </button>
    </div>
  );
}

function StatusBadge({ activeCount, total }: { activeCount: number; total: number }) {
  return (
    <span className="inline-flex border border-[#C9A84C]/25 bg-[#EFE6D0] px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.2em] text-[#8A6E2F]">
      {activeCount}/{total} actifs
    </span>
  );
}
