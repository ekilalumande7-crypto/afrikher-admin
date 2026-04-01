import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import {
  Plus, Search, Edit2, Trash2, CheckCircle, XCircle,
  PenTool, Upload, Save, ChevronLeft, X,
  RefreshCw, Send, Globe, BookOpen,
  Bold, Italic, UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code,
  Image as ImageIcon, Link as LinkIcon, Unlink,
  AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Heading1, Heading2, Heading3,
  Minus, Type, Maximize2, Minimize2, Eye
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
// RICH TEXT TOOLBAR
// ══════════════════════════════════════════════

function EditorToolbar({ editor, onInsertImage }: { editor: any; onInsertImage: () => void }) {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('URL du lien:', 'https://');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const btnClass = (active: boolean) =>
    `p-2 rounded-lg transition-all ${active ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`;

  const divider = <div className="w-px h-7 bg-slate-200 mx-0.5" />;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-20">
      {/* Text formatting */}
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Gras">
        <Bold size={17} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italique">
        <Italic size={17} />
      </button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Souligné">
        <UnderlineIcon size={17} />
      </button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Barré">
        <Strikethrough size={17} />
      </button>

      {divider}

      {/* Headings */}
      <button onClick={() => editor.chain().focus().setParagraph().run()} className={btnClass(editor.isActive('paragraph') && !editor.isActive('heading'))} title="Paragraphe">
        <Type size={17} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Titre 1">
        <Heading1 size={17} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Titre 2">
        <Heading2 size={17} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Titre 3">
        <Heading3 size={17} />
      </button>

      {divider}

      {/* Alignment */}
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Aligner à gauche">
        <AlignLeft size={17} />
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Centrer">
        <AlignCenter size={17} />
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="Aligner à droite">
        <AlignRight size={17} />
      </button>

      {divider}

      {/* Lists */}
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Liste à puces">
        <List size={17} />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Liste numérotée">
        <ListOrdered size={17} />
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Citation">
        <Quote size={17} />
      </button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))} title="Code">
        <Code size={17} />
      </button>
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)} title="Ligne horizontale">
        <Minus size={17} />
      </button>

      {divider}

      {/* Media */}
      <button onClick={onInsertImage} className={btnClass(false)} title="Insérer une image">
        <ImageIcon size={17} />
      </button>
      <button onClick={addLink} className={btnClass(editor.isActive('link'))} title="Ajouter un lien">
        <LinkIcon size={17} />
      </button>
      {editor.isActive('link') && (
        <button onClick={() => editor.chain().focus().unsetLink().run()} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Supprimer le lien">
          <Unlink size={17} />
        </button>
      )}

      <div className="flex-1" />

      {/* Undo/Redo */}
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30" title="Annuler">
        <Undo size={17} />
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30" title="Rétablir">
        <Redo size={17} />
      </button>
    </div>
  );
}

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
  const [fullscreen, setFullscreen] = useState(false);

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formStatus, setFormStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const inlineImageRef = useRef<HTMLInputElement>(null);

  // Stats
  const [stats, setStats] = useState({ totalBlog: 0, publishedBlog: 0 });

  // ── TIPTAP EDITOR ──
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-emerald-600 underline hover:text-emerald-800' },
      }),
      ImageExt.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: 'rounded-xl max-w-full mx-auto my-6' },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: 'Commencez à écrire votre article ici... Vous pouvez ajouter du texte riche, des images, des liens et bien plus encore.',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg prose-slate max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
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

  // ── UPLOAD IMAGE (cover) ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAndCompress(file, 'blog');
      setFormCoverImage(url);
      setSuccess('Image uploadée');
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: any) {
      setError('Erreur upload: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  // ── UPLOAD IMAGE (inline in editor) ──
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      setSuccess('Upload en cours...');
      const url = await uploadAndCompress(file, 'articles');
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      setSuccess('Image insérée !');
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: any) {
      setError('Erreur upload image: ' + e.message);
    }
  };

  // ── SHARED UPLOAD + COMPRESS ──
  const uploadAndCompress = async (file: File, folder: string): Promise<string> => {
    const fileName = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.createElement('img');

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        const maxW = 1400;
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
    const { data: urlData } = supabase.storage.from('afrikher-public').getPublicUrl(jpegName);
    return urlData.publicUrl;
  };

  const triggerInlineImage = () => {
    inlineImageRef.current?.click();
  };

  // ── SAVE (CREATE/UPDATE) ──
  const handleSave = async (publishNow = false) => {
    if (!formTitle.trim()) { setError('Le titre est obligatoire'); return; }
    setSaving(true);
    setError('');
    try {
      const finalStatus = publishNow ? 'published' : formStatus;
      const htmlContent = editor?.getHTML() || '';

      const payload: any = {
        title: formTitle.trim(),
        slug: formSlug.trim() || formTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: formExcerpt.trim(),
        content: htmlContent,
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

  const openEditor = (item: any) => {
    setEditingId(item.id);
    setFormTitle(item.title || '');
    setFormSlug(item.slug || '');
    setFormExcerpt(item.excerpt || '');
    setFormCoverImage(item.cover_image || '');
    setFormStatus(item.status || 'draft');
    editor?.commands.setContent(item.content || '');
    setActiveTab('editor');
  };

  const openNewEditor = () => {
    resetForm();
    editor?.commands.setContent('');
    setActiveTab('editor');
  };

  const resetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormSlug('');
    setFormExcerpt('');
    setFormCoverImage('');
    setFormStatus('draft');
    setFullscreen(false);
    setShowPreview(false);
  };

  const filteredBlogPosts = blogPosts.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Word count
  const wordCount = editor?.storage?.characterCount?.words?.() ||
    (editor?.getText()?.split(/\s+/).filter(Boolean).length || 0);

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hidden file inputs */}
      <input ref={inlineImageRef} type="file" accept="image/*" onChange={handleInlineImageUpload} className="hidden" />

      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-sans font-bold text-slate-900">Articles</h1>
          <p className="text-gray-400 text-sm mt-1">Gérez les articles du blog AFRIKHER.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-3 bg-white text-gray-400 hover:text-green-600 rounded-2xl border border-gray-100 transition-all" title="Rafraîchir">
            <RefreshCw size={20} />
          </button>
          <button onClick={openNewEditor} className="flex items-center px-8 py-3.5 bg-white text-slate-900 rounded-2xl hover:bg-slate-100 transition-all font-bold tracking-wide shadow-lg shadow-slate-200">
            <Plus size={20} className="mr-2 text-green-600" />
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
      {activeTab !== 'editor' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 rounded-xl"><PenTool size={18} className="text-purple-500" /></div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.totalBlog}</p>
              <p className="text-xs text-gray-400 mt-1">articles</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 rounded-xl"><Globe size={18} className="text-green-500" /></div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Publiés</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.publishedBlog}</p>
              <p className="text-xs text-gray-400 mt-1">en ligne</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 rounded-xl"><BookOpen size={18} className="text-green-600" /></div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Brouillons</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.totalBlog - stats.publishedBlog}</p>
              <p className="text-xs text-gray-400 mt-1">à finaliser</p>
            </div>
          </div>

          {/* SEARCH + FILTER */}
          <div className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" placeholder="Rechercher par titre..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all placeholder:text-gray-300" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-500/20">
              <option value="all">Tous les statuts</option>
              <option value="published">Publiés</option>
              <option value="draft">Brouillons</option>
              <option value="archived">Archivés</option>
            </select>
          </div>
        </>
      )}

      {/* ═══ BLOG LIST ═══ */}
      {activeTab === 'blog' && (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-green-600 font-sans text-xl">Chargement des articles...</div>
          ) : filteredBlogPosts.length === 0 ? (
            <div className="p-20 text-center">
              <PenTool size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">Aucun article</p>
              <button onClick={openNewEditor} className="mt-4 px-6 py-2 bg-white text-green-600 rounded-xl font-bold text-sm">
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
                    <tr key={post.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => openEditor(post)}>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-purple-50 overflow-hidden shrink-0 shadow-sm">
                            {post.cover_image ? (
                              <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-purple-300"><PenTool size={20} /></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate max-w-[400px] group-hover:text-green-600 transition-colors">{post.title}</p>
                            <p className="text-[10px] text-gray-400 truncate mt-1">{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider ${
                          post.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {post.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-xs text-gray-400">{formatDate(post.published_at || post.created_at)}</span>
                      </td>
                      <td className="px-8 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleTogglePublish(post.id, post.status)}
                            className={`p-2 rounded-lg transition-all ${post.status === 'published' ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                            title={post.status === 'published' ? 'Dépublier' : 'Publier'}>
                            {post.status === 'published' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                          </button>
                          <button onClick={() => openEditor(post)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Modifier">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
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

      {/* ═══ RICH TEXT EDITOR ═══ */}
      {activeTab === 'editor' && (
        <div className={`space-y-6 animate-in slide-in-from-bottom-4 duration-300 ${fullscreen ? 'fixed inset-0 z-50 bg-gray-100 p-6 overflow-y-auto' : ''}`}>
          {/* Editor header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => { setActiveTab('blog'); resetForm(); }}
                className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-slate-900">
                <ChevronLeft size={24} />
              </button>
              <div>
                <h2 className="text-2xl font-sans font-bold text-slate-900">
                  {editingId ? 'Modifier l\'article' : 'Nouvel article'}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  {wordCount} mot{wordCount !== 1 ? 's' : ''} · Blog AFRIKHER
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${showPreview ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Eye size={16} className="mr-2" />
                Aperçu
              </button>
              <button onClick={() => setFullscreen(!fullscreen)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title={fullscreen ? 'Quitter plein écran' : 'Plein écran'}>
                {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Main editor area ── */}
            <div className={`${showPreview ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-6`}>
              {/* Title */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 pt-8 pb-4">
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Titre de votre article..."
                    className="w-full text-3xl font-bold text-slate-900 border-none focus:ring-0 placeholder:text-gray-200 outline-none bg-transparent"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} />
                  {formSlug && (
                    <p className="text-xs text-gray-400 mt-2 font-mono">/{formSlug}</p>
                  )}
                </div>

                {/* Toolbar + Editor */}
                <EditorToolbar editor={editor} onInsertImage={triggerInlineImage} />
                <div className="bg-white" style={{ minHeight: fullscreen ? '70vh' : '500px' }}>
                  <EditorContent editor={editor} />
                </div>
              </div>

              {/* Excerpt */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Extrait / Résumé</label>
                <textarea value={formExcerpt} onChange={(e) => setFormExcerpt(e.target.value)}
                  placeholder="Un court résumé qui apparaîtra dans les listes d'articles et les partages sociaux..."
                  rows={4}
                  className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-green-500/20 leading-relaxed" />
              </div>
            </div>

            {/* ── Preview panel ── */}
            {showPreview && (
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <Eye size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aperçu</span>
                  </div>
                  <div className="p-6">
                    {formCoverImage && (
                      <img src={formCoverImage} alt="" className="w-full rounded-xl mb-6 aspect-video object-cover" />
                    )}
                    <h1 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {formTitle || 'Titre de l\'article'}
                    </h1>
                    {formExcerpt && (
                      <p className="text-sm text-slate-500 italic mb-6 pb-4 border-b border-slate-100">{formExcerpt}</p>
                    )}
                    <div className="prose prose-sm prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '<p class="text-gray-300">Commencez à écrire...</p>' }} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Sidebar ── */}
            <div className="space-y-6">
              {/* Cover image */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-gray-50 pb-3">Image de couverture</h3>
                {formCoverImage ? (
                  <div className="relative group rounded-xl overflow-hidden">
                    <img src={formCoverImage} alt="" className="w-full aspect-video object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => setFormCoverImage('')} className="p-2 bg-white rounded-full text-red-500 shadow-lg">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:border-green-300 hover:bg-green-50/50 transition-all">
                      {uploading ? (
                        <RefreshCw size={24} className="text-green-600 animate-spin" />
                      ) : (
                        <>
                          <Upload size={24} className="text-gray-300 mb-2" />
                          <p className="text-xs text-gray-400 font-medium">Cliquez pour uploader</p>
                          <p className="text-[10px] text-gray-300 mt-1">JPG, PNG jusqu'à 5MB</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Slug */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-gray-50 pb-3">URL (Slug)</h3>
                <input type="text" value={formSlug} onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-green-500/20" />
              </div>

              {/* Settings */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-gray-50 pb-3">Paramètres</h3>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Statut</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none">
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button onClick={() => handleSave(false)} disabled={saving}
                  className="w-full flex items-center justify-center px-6 py-3.5 border-2 border-slate-800 text-slate-900 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm disabled:opacity-50">
                  <Save size={16} className="mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer brouillon'}
                </button>
                <button onClick={() => handleSave(true)} disabled={saving}
                  className="w-full flex items-center justify-center px-6 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-sm shadow-lg shadow-green-200 disabled:opacity-50">
                  <Send size={16} className="mr-2" />
                  {saving ? 'Publication...' : 'Publier maintenant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tiptap editor styles */}
      <style>{`
        .tiptap {
          padding: 2rem;
          min-height: 500px;
          font-size: 16px;
          line-height: 1.8;
          color: #1e293b;
        }
        .tiptap:focus {
          outline: none;
        }
        .tiptap p {
          margin-bottom: 1rem;
        }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #cbd5e1;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .tiptap h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #0f172a;
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .tiptap h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          color: #0f172a;
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .tiptap h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: #1e293b;
        }
        .tiptap ul, .tiptap ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .tiptap li {
          margin-bottom: 0.25rem;
        }
        .tiptap blockquote {
          border-left: 4px solid #C9A84C;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          background: #fefce8;
          border-radius: 0 12px 12px 0;
          font-style: italic;
          color: #64748b;
        }
        .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1.5rem auto;
          display: block;
        }
        .tiptap a {
          color: #059669;
          text-decoration: underline;
          cursor: pointer;
        }
        .tiptap code {
          background: #f1f5f9;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .tiptap pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1.25rem;
          border-radius: 12px;
          margin: 1.5rem 0;
          overflow-x: auto;
        }
        .tiptap pre code {
          background: none;
          color: inherit;
          padding: 0;
        }
        .tiptap hr {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
