import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Eye, Edit2, Trash2, CheckCircle, XCircle,
  FileText, PenTool, BarChart3, Upload, Save, ChevronLeft, X,
  Image as ImageIcon, RefreshCw, Send, Filter, Globe, BookOpen
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  category_id: string | null;
  author_id: string | null;
  type: string;
  status: string;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // source distinguishes editorial vs blog
  source: 'editorial' | 'blog';
}

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

type ActiveTab = 'editorial' | 'blog' | 'editor';

// ══════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════

export default function ArticlesList() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('editorial');
  const [articles, setArticles] = useState<Article[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<'editorial' | 'blog'>('editorial');
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formType, setFormType] = useState('article');
  const [formStatus, setFormStatus] = useState('draft');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalEditorial: 0,
    publishedEditorial: 0,
    totalBlog: 0,
    publishedBlog: 0,
  });

  // ── FETCH DATA ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch articles (editorial)
      const { data: articlesData, error: artErr } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (artErr) throw artErr;

      // Fetch blog posts
      const { data: blogData, error: blogErr } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (blogErr) throw blogErr;

      // Fetch categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      const arts = (articlesData || []).map((a: any) => ({ ...a, source: 'editorial' as const }));
      const blogs = blogData || [];
      const cats = catData || [];

      setArticles(arts);
      setBlogPosts(blogs);
      setCategories(cats);

      setStats({
        totalEditorial: arts.length,
        publishedEditorial: arts.filter((a: any) => a.status === 'published').length,
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
      const folder = editingSource === 'blog' ? 'blog' : 'articles';
      const fileName = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

      // Convert to JPEG for optimization
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

      if (editingSource === 'editorial') {
        const payload: any = {
          title: formTitle.trim(),
          slug: formSlug.trim() || formTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          excerpt: formExcerpt.trim(),
          content: formContent.trim(),
          cover_image: formCoverImage || null,
          category_id: formCategoryId || null,
          type: formType,
          status: finalStatus,
          featured: formFeatured,
          updated_at: new Date().toISOString(),
        };

        if (finalStatus === 'published' && !editingId) {
          payload.published_at = new Date().toISOString();
        }

        if (editingId) {
          const { error: updErr } = await supabase.from('articles').update(payload).eq('id', editingId);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await supabase.from('articles').insert(payload);
          if (insErr) throw insErr;
        }
      } else {
        // Blog post
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
      }

      setSuccess(editingId ? 'Contenu mis à jour !' : 'Contenu créé !');
      resetForm();
      setActiveTab(editingSource);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ──
  const handleDelete = async (id: string, source: 'editorial' | 'blog') => {
    if (!confirm('Supprimer définitivement ce contenu ?')) return;
    try {
      const table = source === 'editorial' ? 'articles' : 'blog_posts';
      const { error: delErr } = await supabase.from(table).delete().eq('id', id);
      if (delErr) throw delErr;
      setSuccess('Contenu supprimé');
      await fetchData();
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: any) {
      setError('Erreur suppression: ' + e.message);
    }
  };

  // ── TOGGLE PUBLISH ──
  const handleTogglePublish = async (id: string, source: 'editorial' | 'blog', currentStatus: string) => {
    try {
      const table = source === 'editorial' ? 'articles' : 'blog_posts';
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const payload: any = { status: newStatus };
      if (newStatus === 'published') payload.published_at = new Date().toISOString();

      const { error: updErr } = await supabase.from(table).update(payload).eq('id', id);
      if (updErr) throw updErr;
      setSuccess(newStatus === 'published' ? 'Publié !' : 'Dépublié');
      await fetchData();
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: any) {
      setError('Erreur: ' + e.message);
    }
  };

  // ── EDIT ──
  const openEditor = (item: any, source: 'editorial' | 'blog') => {
    setEditingId(item.id);
    setEditingSource(source);
    setFormTitle(item.title || '');
    setFormSlug(item.slug || '');
    setFormExcerpt(item.excerpt || '');
    setFormContent(item.content || '');
    setFormCoverImage(item.cover_image || '');
    setFormCategoryId(item.category_id || '');
    setFormType(item.type || 'article');
    setFormStatus(item.status || 'draft');
    setFormFeatured(item.featured || false);
    setActiveTab('editor');
  };

  // ── NEW ──
  const openNewEditor = (source: 'editorial' | 'blog') => {
    resetForm();
    setEditingSource(source);
    setActiveTab('editor');
  };

  const resetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormSlug('');
    setFormExcerpt('');
    setFormContent('');
    setFormCoverImage('');
    setFormCategoryId('');
    setFormType('article');
    setFormStatus('draft');
    setFormFeatured(false);
  };

  // ── FILTER ──
  const filteredArticles = articles.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredBlogPosts = blogPosts.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getCategoryName = (catId: string | null) => {
    if (!catId) return '—';
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : '—';
  };

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
          <h1 className="text-4xl font-serif font-bold text-dark">Contenus</h1>
          <p className="text-gray-400 text-sm mt-1">Gérez vos articles éditoriaux et posts de blog.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-3 bg-white text-gray-400 hover:text-gold rounded-2xl border border-gray-100 transition-all" title="Rafraîchir">
            <RefreshCw size={20} />
          </button>
          <button
            onClick={() => openNewEditor(activeTab === 'blog' ? 'blog' : 'editorial')}
            className="flex items-center px-8 py-3.5 bg-dark text-white rounded-2xl hover:bg-charcoal transition-all font-bold tracking-wide shadow-lg shadow-dark/10"
          >
            <Plus size={20} className="mr-2 text-gold" />
            {activeTab === 'blog' ? 'Nouveau post' : 'Nouvel article'}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-xl"><FileText size={18} className="text-blue-500" /></div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Éditorial</span>
          </div>
          <p className="text-3xl font-bold text-dark">{stats.totalEditorial}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.publishedEditorial} publiés</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 rounded-xl"><PenTool size={18} className="text-purple-500" /></div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Blog</span>
          </div>
          <p className="text-3xl font-bold text-dark">{stats.totalBlog}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.publishedBlog} publiés</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 rounded-xl"><Globe size={18} className="text-green-500" /></div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Publiés</span>
          </div>
          <p className="text-3xl font-bold text-dark">{stats.publishedEditorial + stats.publishedBlog}</p>
          <p className="text-xs text-gray-400 mt-1">total en ligne</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gold/10 rounded-xl"><BookOpen size={18} className="text-gold" /></div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Brouillons</span>
          </div>
          <p className="text-3xl font-bold text-dark">
            {(stats.totalEditorial - stats.publishedEditorial) + (stats.totalBlog - stats.publishedBlog)}
          </p>
          <p className="text-xs text-gray-400 mt-1">à finaliser</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-50 shadow-sm w-fit">
        {(['editorial', 'blog'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); resetForm(); }}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab
                ? 'bg-dark text-gold shadow-lg shadow-dark/10'
                : 'text-gray-400 hover:text-dark hover:bg-gray-50'
            }`}
          >
            {tab === 'editorial' ? (
              <span className="flex items-center gap-2"><FileText size={16} /> Éditorial ({stats.totalEditorial})</span>
            ) : (
              <span className="flex items-center gap-2"><PenTool size={16} /> Blog ({stats.totalBlog})</span>
            )}
          </button>
        ))}
        {activeTab === 'editor' && (
          <div className="px-8 py-3 rounded-xl text-sm font-bold bg-gold text-white shadow-lg">
            <span className="flex items-center gap-2"><Edit2 size={16} /> Éditeur</span>
          </div>
        )}
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

      {/* ═══ EDITORIAL TAB ═══ */}
      {activeTab === 'editorial' && (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-gold font-serif text-xl">Chargement des articles...</div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-20 text-center">
              <FileText size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">Aucun article éditorial</p>
              <button onClick={() => openNewEditor('editorial')} className="mt-4 px-6 py-2 bg-dark text-gold rounded-xl font-bold text-sm">
                Créer le premier article
              </button>
            </div>
          ) : (
            <>
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  <tr>
                    <th className="px-8 py-5">Titre</th>
                    <th className="px-8 py-5">Catégorie</th>
                    <th className="px-8 py-5">Type</th>
                    <th className="px-8 py-5">Statut</th>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-cream overflow-hidden shrink-0 shadow-sm">
                            {article.cover_image ? (
                              <img src={article.cover_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <FileText size={20} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-dark truncate max-w-[300px] group-hover:text-gold transition-colors">
                              {article.title}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">{article.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                          {getCategoryName(article.category_id)}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-xs text-gray-500 capitalize">{article.type}</span>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider ${
                          article.status === 'published'
                            ? 'bg-green-50 text-green-600'
                            : article.status === 'archived'
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-gold/10 text-gold'
                        }`}>
                          {article.status === 'published' ? 'Publié' : article.status === 'archived' ? 'Archivé' : 'Brouillon'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-xs text-gray-400">{formatDate(article.published_at || article.created_at)}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleTogglePublish(article.id, 'editorial', article.status)}
                            className={`p-2 rounded-lg transition-all ${
                              article.status === 'published'
                                ? 'text-green-500 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gold/10 hover:text-gold'
                            }`}
                            title={article.status === 'published' ? 'Dépublier' : 'Publier'}
                          >
                            {article.status === 'published' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                          </button>
                          <button
                            onClick={() => openEditor(article, 'editorial')}
                            className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(article.id, 'editorial')}
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
                {filteredArticles.length} article(s) éditorial
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ BLOG TAB ═══ */}
      {activeTab === 'blog' && (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-gold font-serif text-xl">Chargement des posts...</div>
          ) : filteredBlogPosts.length === 0 ? (
            <div className="p-20 text-center">
              <PenTool size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">Aucun article de blog</p>
              <button onClick={() => openNewEditor('blog')} className="mt-4 px-6 py-2 bg-dark text-gold rounded-xl font-bold text-sm">
                Créer le premier post
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
                            onClick={() => handleTogglePublish(post.id, 'blog', post.status)}
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
                            onClick={() => openEditor(post, 'blog')}
                            className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id, 'blog')}
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
                {filteredBlogPosts.length} post(s) blog
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
              onClick={() => { setActiveTab(editingSource); resetForm(); }}
              className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-dark"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-serif font-bold text-dark">
                {editingId ? 'Modifier' : 'Nouveau'} {editingSource === 'blog' ? 'post blog' : 'article éditorial'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {editingSource === 'editorial' ? 'Table: articles' : 'Table: blog_posts'}
              </p>
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

                {editingSource === 'editorial' && (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Catégorie</label>
                      <select
                        value={formCategoryId}
                        onChange={(e) => setFormCategoryId(e.target.value)}
                        className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none"
                      >
                        <option value="">— Aucune —</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Type</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none"
                      >
                        <option value="article">Article</option>
                        <option value="interview">Interview</option>
                        <option value="dossier">Dossier</option>
                        <option value="portrait">Portrait</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-bold text-dark">Mettre en avant</span>
                      <button
                        onClick={() => setFormFeatured(!formFeatured)}
                        className={`w-10 h-5 rounded-full transition-all relative ${formFeatured ? 'bg-gold' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formFeatured ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </>
                )}
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
