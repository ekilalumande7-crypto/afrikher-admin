import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, CheckCircle, XCircle,
  PenTool, Upload, Save, ChevronLeft, X,
  RefreshCw, Send, Globe, BookOpen
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  author_id: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

type ActiveTab = 'blog' | 'editor';

// ══════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════

export default function ArticlesList() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('blog');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formStatus, setFormStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalBlog: 0,
    publishedBlog: 0,
  });

  // ── FETCH DATA ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: blogData, error: blogErr } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (blogErr) throw blogErr;

      const blogs = blogData || [];
      setBlogPosts(blogs);

      setStats({
        totalBlog: blogs.length,
        publishedBlog: blogs.filter((b: any) => b.status === 'published').length,
      });
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── AUTO SLUG ──
  useEffect(() => {
    if (!editingId) {
      setFormSlug(formTitle.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''));
    }
  }, [formTitle, editingId]);

  // ── UPLOAD IMAGE ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `blog/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const maxW = 1200;
          const ratio = Math.min(maxW / img.width, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
      );

      const jpegName = fileName.replace(/\.[^.]+$/, '.jpg');

      const { error: uploadErr } = await supabase.storage
        .from('afrikher-public')
        .upload(jpegName, blob, { contentType: 'image/jpeg', upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('afrikher-public')
        .getPublicUrl(jpegName);

      setFormCoverImage(urlData.publicUrl);
      setSuccess('Image uploadée');
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: any) {
      setError('Erreur upload: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  // ── SAVE (CREATE/UPDATE) ──
  const handleSave = async (publishNow = false) => {
    if (!formTitle.trim()) {
      setError('Le titre est obligatoire');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const finalStatus = publishNow ? 'published' : formStatus;

      const payload: any = {
        title: formTitle.trim(),
        slug: formSlug.trim() || formTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: formExcerpt.trim(),
        content: formContent.trim(),
        cover_image: formCoverImage || null,
        status: finalStatus,
      };

      if (finalStatus === 'published' && !editingId) {
        payload.published_at = new Date().toISOString();
      }

      if (editingId) {
        const { error: updErr } = await supabase.from('blog_posts').update(payload).eq('id', editingId);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('blog_posts').insert(payload);
        if (insErr) throw insErr;
      }

      setSuccess(editingId ? 'Article mis à jour !' : 'Article créé !');
      resetForm();
      setActiveTab('blog');
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ──
  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement cet article ?')) return;
    try {
      const { error: delErr } = await supabase.from('blog_posts').delete().eq('id', id);
      if (delErr) throw delErr;
      setSuccess('Article supprimé');
      await fetchData();
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: any) {
      setError('Erreur suppression: ' + e.message);
    }
  };

  // ── TOGGLE PUBLISH ──
  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const payload: any = { status: newStatus };
      if (newStatus === 'published') payload.published_at = new Date().toISOString();

      const { error: updErr } = await supabase.from('blog_posts').update(payload).eq('id', id);
      if (updErr) throw updErr;
      setSuccess(newStatus === 'published' ? 'Publié !' : 'Dépublié');
      await fetchData();
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: any) {
      setError('Erreur: ' + e.message);
    }
  };

  // ── EDIT ──
  const openEditor = (item: any) => {
    setEditingId(item.id);
    setFormTitle(item.title || '');
    setFormSlug(item.slug || '');
    setFormExcerpt(item.excerpt || '');
    setFormContent(item.content || '');
    setFormCoverImage(item.cover_image || '');
    setFormStatus(item.status || 'draft');
    setActiveTab('editor');
  };

  // ── NEW ──
  const openNewEditor = () => {
    resetForm();
    setActiveTab('editor');
  };

  const resetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormSlug('');
    setFormExcerpt('');
    setFormContent('');
    setFormCoverImage('');
    setFormStatus('draft');
  };

  // ── FILTER ──
  const filteredBlogPosts = blogPosts.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-dark">Articles</h1>
          <p className="text-gray-400 text-sm mt-1">Gérez les articles du blog AFRIKHER.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-3 bg-white text-gray-400 hover:text-gold rounded-2xl border border-gray-100 transition-all" title="Rafraîchir">
            <RefreshCw size={20} />
          </button>
          <button
            onClick={() => openNewEditor()}
            className="flex items-center px-8 py-3.5 bg-dark text-white rounded-2xl hover:bg-charcoal transition-all font-bold tracking-wide shadow-lg shadow-dark/10"
          >
            <Plus size={20} className="mr-2 text-gold" />
            Nouvel article
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-2xl text-sm font-medium flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><X size={16} /></button>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 rounded-xl"><PenTool size={18} className="text-purple-500" /></div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total</span>
          </div>
          <p className="text-3xl font-bold text-dark">{stats.totalBlog}</p>
          <p className="text-xs text-gray-400 mt-1">articles</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 rounded-xl"><Globe size={18} className="text-green-500" /></div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Publiés</span>
          </div>
          <p className="text-3xl font-bold text-dark">{stats.publishedBlog}</p>
          <p className="text-xs text-gray-400 mt-1">en ligne</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gold/10 rounded-xl"><BookOpen size={18} className="text-gold" /></div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Brouillons</span>
          </div>
          <p className="text-3xl font-bold text-dark">
            {stats.totalBlog - stats.publishedBlog}
          </p>
          <p className="text-xs text-gray-400 mt-1">à finaliser</p>
        </div>
      </div>

      {/* SEARCH + FILTER BAR */}
      {activeTab !== 'editor' && (
        <div className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Rechercher par titre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
            <option value="archived">Archivés</option>
          </select>
        </div>
      )}

      {/* ═══ BLOG LIST ═══ */}
      {activeTab === 'blog' && (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-gold font-serif text-xl">Chargement des articles...</div>
          ) : filteredBlogPosts.length === 0 ? (
            <div className="p-20 text-center">
              <PenTool size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">Aucun article</p>
              <button onClick={() => openNewEditor()} className="mt-4 px-6 py-2 bg-dark text-gold rounded-xl font-bold text-sm">
                Créer le premier article
              </button>
            </div>
          ) : (
            <>
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  <tr>
                    <th className="px-8 py-5">Titre</th>
                    <th className="px-8 py-5">Statut</th>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredBlogPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-50 overflow-hidden shrink-0 shadow-sm">
                            {post.cover_image ? (
                              <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-purple-300">
                                <PenTool size={20} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-dark truncate max-w-[400px] group-hover:text-gold transition-colors">
                              {post.title}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider ${
                          post.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-gold/10 text-gold'
                        }`}>
                          {post.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-xs text-gray-400">{formatDate(post.published_at || post.created_at)}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleTogglePublish(post.id, post.status)}
                            className={`p-2 rounded-lg transition-all ${
                              post.status === 'published'
                                ? 'text-green-500 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gold/10 hover:text-gold'
                            }`}
                            title={post.status === 'published' ? 'Dépublier' : 'Publier'}
                          >
                            {post.status === 'published' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                          </button>
                          <button
                            onClick={() => openEditor(post)}
                            className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 bg-gray-50/30 border-t border-gray-50 text-xs text-gray-400 font-medium">
                {filteredBlogPosts.length} article(s)
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ EDITOR TAB ═══ */}
      {activeTab === 'editor' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setActiveTab('blog'); resetForm(); }}
              className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-dark"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-serif font-bold text-dark">
                {editingId ? 'Modifier l\'article' : 'Nouvel article'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Blog AFRIKHER</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Titre *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Titre de l'article..."
                    className="w-full text-2xl font-serif font-bold text-dark border-none focus:ring-0 placeholder:text-gray-200 outline-none bg-transparent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Slug</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Extrait / Résumé</label>
                  <textarea
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    placeholder="Court résumé pour les listes..."
                    rows={3}
                    className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Contenu (HTML)</label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="<p>Écrivez votre contenu ici...</p>"
                    rows={15}
                    className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm font-mono outline-none resize-y focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cover image */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-dark border-b border-gray-50 pb-3">Image de couverture</h3>
                {formCoverImage ? (
                  <div className="relative group rounded-xl overflow-hidden">
                    <img src={formCoverImage} alt="" className="w-full aspect-video object-cover" />
                    <div className="absolute inset-0 bg-dark/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => setFormCoverImage('')} className="p-2 bg-white rounded-full text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:border-gold/30 hover:bg-gold/5 transition-all">
                      {uploading ? (
                        <RefreshCw size={24} className="text-gold animate-spin" />
                      ) : (
                        <>
                          <Upload size={24} className="text-gray-300 mb-2" />
                          <p className="text-xs text-gray-400">Cliquez pour uploader</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Settings */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-dark border-b border-gray-50 pb-3">Paramètres</h3>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Statut</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="w-full flex items-center justify-center px-6 py-3 border-2 border-dark text-dark rounded-xl hover:bg-dark hover:text-white transition-all font-bold text-sm disabled:opacity-50"
                >
                  <Save size={16} className="mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer brouillon'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center px-6 py-3 bg-gold text-white rounded-xl hover:bg-gold/90 transition-all font-bold text-sm shadow-lg shadow-gold/20 disabled:opacity-50"
                >
                  <Send size={16} className="mr-2" />
                  {saving ? 'Publication...' : 'Publier maintenant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
