import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  sort_order: '0',
  is_active: true,
};

export default function CategoriesList() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const parsed = (data || []).map((item: any, index: number) => ({
        id: String(item.id),
        name: item.name || '',
        slug: item.slug || '',
        description: item.description || '',
        sort_order: Number.isFinite(item.sort_order) ? item.sort_order : index,
        is_active:
          item.is_active !== undefined
            ? Boolean(item.is_active)
            : item.active !== undefined
              ? Boolean(item.active)
              : item.visible !== undefined
                ? Boolean(item.visible)
                : true,
        created_at: item.created_at || null,
      }));

      setCategories(parsed);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement des catégories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!editingId) {
      setForm((prev) => ({
        ...prev,
        slug: prev.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      }));
    }
  }, [form.name, editingId]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const query = search.toLowerCase();
      const matchesSearch =
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && category.is_active) ||
        (statusFilter === 'inactive' && !category.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const activeCount = categories.filter((item) => item.is_active).length;
  const inactiveCount = categories.length - activeCount;

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (category: CategoryItem) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      sort_order: String(category.sort_order ?? 0),
      is_active: category.is_active,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Le nom de la catégorie est obligatoire.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        slug:
          form.slug.trim() ||
          form.name
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
        description: form.description.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('categories').insert(payload);
        if (insertError) throw insertError;
      }

      setSuccess(editingId ? 'Catégorie mise à jour.' : 'Catégorie créée.');
      resetForm();
      fetchCategories();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err: any) {
      setError(err.message || 'Erreur de sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement cette catégorie ?')) return;

    try {
      const { error: deleteError } = await supabase.from('categories').delete().eq('id', id);
      if (deleteError) throw deleteError;

      setSuccess('Catégorie supprimée.');
      fetchCategories();
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
            Structure éditoriale
          </p>
          <h1 className="mt-2 font-serif text-[2.5rem] leading-[0.94] tracking-[-0.03em] text-[#0A0A0A] md:text-[3.4rem]">
            Catégories
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9A9A8A]">
            Organisez les contenus autour d’une taxonomie claire, lisible et cohérente avec le
            rythme éditorial AFRIKHER.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
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
            Nouvelle catégorie
          </button>
        </div>
      </div>

      {error ? <Notice tone="error" message={error} onClose={() => setError('')} /> : null}
      {success ? <Notice tone="success" message={success} onClose={() => setSuccess('')} /> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Total" value={categories.length} detail="Catégories enregistrées" />
        <MetricCard label="Actives" value={activeCount} detail="Visibles dans l’écosystème" />
        <MetricCard label="Masquées" value={inactiveCount} detail="En retrait ou en pause" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-[#0A0A0A]/10 bg-white p-6 md:p-7">
          <div className="border-b border-[#0A0A0A]/8 pb-5">
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
              {editingId ? 'Édition' : 'Création'}
            </p>
            <h2 className="mt-2 font-serif text-[1.9rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
              {editingId ? 'Modifier la catégorie' : 'Créer une catégorie'}
            </h2>
          </div>

          <div className="mt-6 space-y-5">
            <Field
              label="Nom"
              value={form.name}
              onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
              placeholder="Culture"
            />

            <Field
              label="Slug"
              value={form.slug}
              onChange={(value) => setForm((prev) => ({ ...prev, slug: value }))}
              placeholder="culture"
            />

            <Field
              label="Description"
              value={form.description}
              onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
              placeholder="Courte description de la catégorie."
              textarea
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
                    Catégorie visible
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#9A9A8A]">
                    Activez ou masquez cette catégorie dans le système éditorial.
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
                {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}
              </button>

              <button
                onClick={resetForm}
                className="inline-flex h-12 items-center justify-center border border-[#0A0A0A]/10 bg-white px-6 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-[#0A0A0A]/10 bg-white p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9A8A]" />
                <input
                  type="text"
                  placeholder="Rechercher une catégorie"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] pl-11 pr-4 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#9A9A8A] focus:border-[#C9A84C]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="h-12 min-w-[14rem] border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#C9A84C]"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="inactive">Masquées</option>
              </select>
            </div>
          </div>

          <div className="border border-[#0A0A0A]/10 bg-white overflow-hidden">
            {loading ? (
              <div className="px-8 py-20 text-center">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
                  Chargement des catégories
                </p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-8 py-20 text-center">
                <p className="mx-auto max-w-lg font-serif text-[2rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
                  Aucune catégorie ne correspond à cette vue.
                </p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#9A9A8A]">
                  Créez une nouvelle catégorie ou ajustez vos filtres pour retrouver la bonne structure.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden border-b border-[#0A0A0A]/10 bg-[#FBF8F2] px-8 py-4 md:grid md:grid-cols-[minmax(0,1.15fr)_150px_110px_130px_170px] md:gap-5">
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">Nom</p>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">Slug</p>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">Ordre</p>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">Statut</p>
                  <p className="text-right text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">Actions</p>
                </div>

                <div className="divide-y divide-[#0A0A0A]/8">
                  {filteredCategories.map((category) => (
                    <div key={category.id} className="px-6 py-5 transition-colors hover:bg-[#FBF8F2] md:px-8">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_150px_110px_130px_170px] md:items-center md:gap-5">
                        <div className="min-w-0">
                          <p className="truncate font-serif text-[1.35rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
                            {category.name}
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#9A9A8A]">
                            {category.description || 'Sans description.'}
                          </p>
                        </div>

                        <p className="truncate text-[0.7rem] uppercase tracking-[0.18em] text-[#9A9A8A]">
                          {category.slug || '—'}
                        </p>

                        <p className="text-sm text-[#9A9A8A]">{category.sort_order}</p>

                        <StatusBadge active={category.is_active} />

                        <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                          <button
                            onClick={() => openEdit(category)}
                            className="inline-flex h-10 items-center justify-center gap-2 border border-[#0A0A0A]/10 px-3 text-[0.64rem] uppercase tracking-[0.2em] text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]"
                          >
                            <Edit2 size={14} />
                            Modifier
                          </button>

                          <button
                            onClick={() => handleDelete(category.id)}
                            className="inline-flex h-10 items-center justify-center gap-2 border border-[#9C4C3A]/12 px-3 text-[0.64rem] uppercase tracking-[0.2em] text-[#9C4C3A] transition-colors hover:bg-[#F7E3DE]"
                          >
                            <Trash2 size={14} />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#0A0A0A]/10 bg-[#FBF8F2] px-8 py-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
                    {filteredCategories.length} catégorie(s)
                  </p>
                </div>
              </>
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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.2em] ${
        active
          ? 'border-[#C9A84C]/25 bg-[#EFE6D0] text-[#8A6E2F]'
          : 'border-[#0A0A0A]/8 bg-[#F5F0E8] text-[#9A9A8A]'
      }`}
    >
      {active ? 'Active' : 'Masquée'}
    </span>
  );
}
