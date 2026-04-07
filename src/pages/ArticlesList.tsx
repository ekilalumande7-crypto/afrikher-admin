import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Upload,
  Save,
  ChevronLeft,
  X,
  RefreshCw,
  Send,
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Type,
  Maximize2,
  Minimize2,
  Eye,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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

function EditorToolbar({ editor, onInsertImage }: { editor: any; onInsertImage: () => void }) {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('URL du lien:', 'https://');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const btnClass = (active: boolean) =>
    `inline-flex h-10 w-10 items-center justify-center border transition-colors ${
      active
        ? 'border-[#C9A84C] bg-[#EFE6D0] text-[#8A6E2F]'
        : 'border-transparent text-[#9A9A8A] hover:border-[#0A0A0A]/10 hover:bg-[#F5F0E8] hover:text-[#0A0A0A]'
    }`;

  const divider = <div className="mx-1 h-6 w-px bg-[#0A0A0A]/10" />;

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 border-b border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 py-3">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Gras">
        <Bold size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italique">
        <Italic size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Souligné">
        <UnderlineIcon size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Barré">
        <Strikethrough size={16} />
      </button>

      {divider}

      <button onClick={() => editor.chain().focus().setParagraph().run()} className={btnClass(editor.isActive('paragraph') && !editor.isActive('heading'))} title="Paragraphe">
        <Type size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Titre 1">
        <Heading1 size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Titre 2">
        <Heading2 size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Titre 3">
        <Heading3 size={16} />
      </button>

      {divider}

      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Aligner à gauche">
        <AlignLeft size={16} />
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Centrer">
        <AlignCenter size={16} />
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="Aligner à droite">
        <AlignRight size={16} />
      </button>

      {divider}

      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Liste à puces">
        <List size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Liste numérotée">
        <ListOrdered size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Citation">
        <Quote size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))} title="Code">
        <Code size={16} />
      </button>
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)} title="Ligne horizontale">
        <Minus size={16} />
      </button>

      {divider}

      <button onClick={onInsertImage} className={btnClass(false)} title="Insérer une image">
        <ImageIcon size={16} />
      </button>
      <button onClick={addLink} className={btnClass(editor.isActive('link'))} title="Ajouter un lien">
        <LinkIcon size={16} />
      </button>
      {editor.isActive('link') ? (
        <button onClick={() => editor.chain().focus().unsetLink().run()} className="inline-flex h-10 w-10 items-center justify-center border border-transparent text-[#9C4C3A] transition-colors hover:border-[#9C4C3A]/15 hover:bg-[#F7E3DE]" title="Supprimer le lien">
          <Unlink size={16} />
        </button>
      ) : null}

      <div className="flex-1" />

      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="inline-flex h-10 w-10 items-center justify-center text-[#9A9A8A] transition-colors hover:text-[#0A0A0A] disabled:opacity-30" title="Annuler">
        <Undo size={16} />
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="inline-flex h-10 w-10 items-center justify-center text-[#9A9A8A] transition-colors hover:text-[#0A0A0A] disabled:opacity-30" title="Rétablir">
        <Redo size={16} />
      </button>
    </div>
  );
}

export default function ArticlesList() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('blog');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formStatus, setFormStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [stats, setStats] = useState({ totalBlog: 0, publishedBlog: 0 });

  const inlineImageRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'afrikher-link' },
      }),
      ImageExt.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: 'afrikher-editor-image' },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder:
          'Commencez à écrire votre article ici. Vous pouvez structurer le texte, insérer des images et affiner le rythme éditorial.',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'afrikher-editor min-h-[520px] px-8 py-7 focus:outline-none',
      },
    },
  });

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!editingId) {
      setFormSlug(
        formTitle
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  }, [formTitle, editingId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadAndCompress(file, 'blog');
      setFormCoverImage(url);
      setSuccess('Image de couverture mise à jour.');
      setTimeout(() => setSuccess(''), 2200);
    } catch (e: any) {
      setError('Erreur upload: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      setSuccess('Insertion de l’image en cours...');
      const url = await uploadAndCompress(file, 'articles');
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      setSuccess('Image insérée dans l’article.');
      setTimeout(() => setSuccess(''), 2200);
    } catch (e: any) {
      setError('Erreur upload image: ' + e.message);
    }
  };

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

    const { data: urlData } = supabase.storage
      .from('afrikher-public')
      .getPublicUrl(jpegName);

    return urlData.publicUrl;
  };

  const handleSave = async (publishNow = false) => {
    if (!formTitle.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const finalStatus = publishNow ? 'published' : formStatus;
      const htmlContent = editor?.getHTML() || '';
      const payload: any = {
        title: formTitle.trim(),
        slug:
          formSlug.trim() ||
          formTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: formExcerpt.trim(),
        content: htmlContent,
        cover_image: formCoverImage || null,
        status: finalStatus,
      };

      if (finalStatus === 'published' && !editingId) {
        payload.published_at = new Date().toISOString();
      }

      if (editingId) {
        const { error: updErr } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', editingId);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('blog_posts').insert(payload);
        if (insErr) throw insErr;
      }

      setSuccess(editingId ? 'Article mis à jour.' : 'Article créé.');
      resetForm();
      setActiveTab('blog');
      await fetchData();
      setTimeout(() => setSuccess(''), 2800);
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
      setSuccess('Article supprimé.');
      await fetchData();
      setTimeout(() => setSuccess(''), 2200);
    } catch (e: any) {
      setError('Erreur suppression: ' + e.message);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const payload: any = { status: newStatus };
      if (newStatus === 'published') payload.published_at = new Date().toISOString();

      const { error: updErr } = await supabase
        .from('blog_posts')
        .update(payload)
        .eq('id', id);
      if (updErr) throw updErr;

      setSuccess(newStatus === 'published' ? 'Article publié.' : 'Article repassé en brouillon.');
      await fetchData();
      setTimeout(() => setSuccess(''), 2200);
    } catch (e: any) {
      setError('Erreur: ' + e.message);
    }
  };

  const openEditor = (item: BlogPost) => {
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
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const wordCount =
    editor?.getText()?.split(/\s+/).filter(Boolean).length || 0;

  const draftCount = stats.totalBlog - stats.publishedBlog;

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <input
        ref={inlineImageRef}
        type="file"
        accept="image/*"
        onChange={handleInlineImageUpload}
        className="hidden"
      />

      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#C9A84C]">
            Éditorial
          </p>
          <h1 className="mt-2 font-serif text-[2.5rem] leading-[0.94] tracking-[-0.03em] text-[#0A0A0A] md:text-[3.4rem]">
            Contenus
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9A9A8A]">
            Pilotez la publication des articles avec une interface plus claire,
            plus calme et plus cohérente avec l’univers AFRIKHER.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="inline-flex h-12 items-center justify-center border border-[#0A0A0A]/10 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]"
            title="Rafraîchir"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={openNewEditor}
            className="inline-flex h-12 items-center justify-center gap-3 border border-[#0A0A0A] bg-[#0A0A0A] px-6 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#F5F0E8] transition-colors hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
          >
            <Plus size={16} />
            Nouvel article
          </button>
        </div>
      </div>

      {error ? (
        <Notice tone="error" message={error} onClose={() => setError('')} />
      ) : null}
      {success ? (
        <Notice tone="success" message={success} onClose={() => setSuccess('')} />
      ) : null}

      {activeTab !== 'editor' ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard
              label="Total"
              value={stats.totalBlog}
              detail="Articles enregistrés"
            />
            <MetricCard
              label="Publiés"
              value={stats.publishedBlog}
              detail="Contenus visibles en ligne"
            />
            <MetricCard
              label="Brouillons"
              value={draftCount}
              detail="Éléments à finaliser"
            />
          </div>

          <div className="border border-[#0A0A0A]/10 bg-white p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9A8A]" />
                <input
                  type="text"
                  placeholder="Rechercher par titre"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] pl-11 pr-4 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#9A9A8A] focus:border-[#C9A84C]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 min-w-[15rem] border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#C9A84C]"
              >
                <option value="all">Tous les statuts</option>
                <option value="published">Publiés</option>
                <option value="draft">Brouillons</option>
                <option value="archived">Archivés</option>
              </select>
            </div>
          </div>

          <div className="border border-[#0A0A0A]/10 bg-white overflow-hidden">
            {loading ? (
              <div className="px-8 py-20 text-center">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
                  Chargement des contenus
                </p>
              </div>
            ) : filteredBlogPosts.length === 0 ? (
              <div className="px-8 py-20 text-center">
                <p className="mx-auto max-w-lg font-serif text-[2rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
                  Aucun contenu ne correspond à cette sélection.
                </p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#9A9A8A]">
                  Reprenez un filtre plus large ou ouvrez directement un nouvel article.
                </p>
                <button
                  onClick={openNewEditor}
                  className="mt-6 inline-flex h-12 items-center justify-center border border-[#0A0A0A] bg-[#0A0A0A] px-6 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#F5F0E8] transition-colors hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
                >
                  Créer un article
                </button>
              </div>
            ) : (
              <>
                <div className="hidden border-b border-[#0A0A0A]/10 bg-[#FBF8F2] px-8 py-4 md:grid md:grid-cols-[minmax(0,1.2fr)_180px_180px_220px] md:gap-6">
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
                    Titre
                  </p>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
                    Statut
                  </p>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
                    Date
                  </p>
                  <p className="text-right text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
                    Actions
                  </p>
                </div>

                <div className="divide-y divide-[#0A0A0A]/8">
                  {filteredBlogPosts.map((post) => (
                    <div
                      key={post.id}
                      className="group px-6 py-5 transition-colors hover:bg-[#FBF8F2] md:px-8"
                    >
                      <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_180px_180px_220px] md:items-center md:gap-6">
                        <button
                          onClick={() => openEditor(post)}
                          className="flex items-center gap-4 text-left"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden border border-[#0A0A0A]/8 bg-[#F5F0E8]">
                            {post.cover_image ? (
                              <img src={post.cover_image} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-serif text-[1.35rem] leading-none tracking-[-0.02em] text-[#0A0A0A] transition-colors group-hover:text-[#8A6E2F]">
                              {post.title}
                            </p>
                            <p className="mt-2 truncate text-[0.7rem] uppercase tracking-[0.18em] text-[#9A9A8A]">
                              {post.slug}
                            </p>
                          </div>
                        </button>

                        <div>
                          <StatusBadge status={post.status} />
                        </div>

                        <p className="text-sm text-[#9A9A8A]">
                          {formatDate(post.published_at || post.created_at)}
                        </p>

                        <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                          <button
                            onClick={() => handleTogglePublish(post.id, post.status)}
                            className="inline-flex h-10 items-center justify-center gap-2 border border-[#0A0A0A]/10 px-3 text-[0.64rem] uppercase tracking-[0.2em] text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#8A6E2F]"
                            title={post.status === 'published' ? 'Dépublier' : 'Publier'}
                          >
                            {post.status === 'published' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                            {post.status === 'published' ? 'Dépublier' : 'Publier'}
                          </button>
                          <button
                            onClick={() => openEditor(post)}
                            className="inline-flex h-10 items-center justify-center gap-2 border border-[#0A0A0A]/10 px-3 text-[0.64rem] uppercase tracking-[0.2em] text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]"
                            title="Modifier"
                          >
                            <Edit2 size={14} />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="inline-flex h-10 items-center justify-center gap-2 border border-[#9C4C3A]/12 px-3 text-[0.64rem] uppercase tracking-[0.2em] text-[#9C4C3A] transition-colors hover:bg-[#F7E3DE]"
                            title="Supprimer"
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
                    {filteredBlogPosts.length} article(s)
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className={`space-y-6 ${fullscreen ? 'fixed inset-0 z-50 overflow-y-auto bg-[#F5F0E8] p-6' : ''}`}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => {
                  setActiveTab('blog');
                  resetForm();
                }}
                className="inline-flex h-11 w-11 items-center justify-center border border-[#0A0A0A]/10 text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[#C9A84C]">
                  {editingId ? 'Mise à jour' : 'Nouveau contenu'}
                </p>
                <h2 className="mt-2 font-serif text-[2.1rem] leading-none tracking-[-0.03em] text-[#0A0A0A] md:text-[2.8rem]">
                  {editingId ? 'Modifier l’article' : 'Rédiger un article'}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#9A9A8A]">
                  {wordCount} mot{wordCount > 1 ? 's' : ''} dans cette version.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`inline-flex h-11 items-center justify-center gap-2 border px-4 text-[0.68rem] uppercase tracking-[0.22em] transition-colors ${
                  showPreview
                    ? 'border-[#C9A84C] bg-[#EFE6D0] text-[#8A6E2F]'
                    : 'border-[#0A0A0A]/10 text-[#9A9A8A] hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]'
                }`}
              >
                <Eye size={15} />
                Aperçu
              </button>
              <button
                onClick={() => setFullscreen(!fullscreen)}
                className="inline-flex h-11 items-center justify-center border border-[#0A0A0A]/10 px-4 text-[0.68rem] uppercase tracking-[0.22em] text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]"
              >
                {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className={`${showPreview ? 'xl:col-span-1' : 'xl:col-span-2'} space-y-6`}>
              <div className="border border-[#0A0A0A]/10 bg-white overflow-hidden">
                <div className="border-b border-[#0A0A0A]/10 px-8 pb-5 pt-8">
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Titre de votre article"
                    className="w-full bg-transparent font-serif text-[2.5rem] leading-[0.94] tracking-[-0.03em] text-[#0A0A0A] outline-none placeholder:text-[#C9BCA6]"
                  />
                  {formSlug ? (
                    <p className="mt-3 text-[0.7rem] uppercase tracking-[0.18em] text-[#9A9A8A]">
                      /{formSlug}
                    </p>
                  ) : null}
                </div>

                <EditorToolbar
                  editor={editor}
                  onInsertImage={() => inlineImageRef.current?.click()}
                />

                <div style={{ minHeight: fullscreen ? '70vh' : '540px' }}>
                  <EditorContent editor={editor} />
                </div>
              </div>

              <div className="border border-[#0A0A0A]/10 bg-white p-6">
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
                  Extrait
                </p>
                <textarea
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  placeholder="Un résumé éditorial qui accompagne l’article dans les listes et les partages."
                  rows={4}
                  className="mt-4 w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] p-4 text-sm leading-7 text-[#0A0A0A] outline-none transition-colors placeholder:text-[#9A9A8A] focus:border-[#C9A84C] resize-none"
                />
              </div>
            </div>

            {showPreview ? (
              <div className="space-y-6">
                <div className="border border-[#0A0A0A]/10 bg-white overflow-hidden">
                  <div className="border-b border-[#0A0A0A]/10 bg-[#FBF8F2] px-6 py-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
                      Aperçu
                    </p>
                  </div>
                  <div className="p-6">
                    {formCoverImage ? (
                      <img src={formCoverImage} alt="" className="mb-6 aspect-video w-full object-cover" />
                    ) : null}
                    <h3 className="font-serif text-[2rem] leading-[0.96] tracking-[-0.03em] text-[#0A0A0A]">
                      {formTitle || 'Titre de l’article'}
                    </h3>
                    {formExcerpt ? (
                      <p className="mt-4 border-b border-[#0A0A0A]/8 pb-5 text-sm italic leading-7 text-[#9A9A8A]">
                        {formExcerpt}
                      </p>
                    ) : null}
                    <div
                      className="afrikher-preview mt-6"
                      dangerouslySetInnerHTML={{
                        __html:
                          editor?.getHTML() ||
                          '<p class="text-[#9A9A8A]">Commencez à écrire pour voir l’aperçu.</p>',
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-6">
              <div className="border border-[#0A0A0A]/10 bg-white p-6">
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
                  Image de couverture
                </p>
                <div className="mt-4">
                  {formCoverImage ? (
                    <div className="relative overflow-hidden border border-[#0A0A0A]/8">
                      <img src={formCoverImage} alt="" className="aspect-video w-full object-cover" />
                      <div className="absolute inset-0 bg-black/25 opacity-0 transition-opacity hover:opacity-100">
                        <button
                          onClick={() => setFormCoverImage('')}
                          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center bg-white text-[#9C4C3A]"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="flex aspect-video flex-col items-center justify-center border border-dashed border-[#0A0A0A]/15 bg-[#FBF8F2] px-6 text-center transition-colors hover:border-[#C9A84C]/40">
                        {uploading ? (
                          <RefreshCw size={22} className="animate-spin text-[#8A6E2F]" />
                        ) : (
                          <>
                            <Upload size={20} className="text-[#9A9A8A]" />
                            <p className="mt-4 text-[0.68rem] uppercase tracking-[0.2em] text-[#0A0A0A]">
                              Ajouter une image
                            </p>
                            <p className="mt-2 text-xs text-[#9A9A8A]">
                              JPG ou PNG, jusqu’à 5 MB
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="border border-[#0A0A0A]/10 bg-white p-6">
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
                  Slug
                </p>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="mt-4 h-12 w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#C9A84C]"
                />
              </div>

              <div className="border border-[#0A0A0A]/10 bg-white p-6">
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
                  Paramètres
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-[0.62rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
                      Statut
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="h-12 w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#C9A84C]"
                    >
                      <option value="draft">Brouillon</option>
                      <option value="published">Publié</option>
                      <option value="archived">Archivé</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="inline-flex h-12 w-full items-center justify-center gap-3 border border-[#0A0A0A]/14 bg-white px-6 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0A0A0A] transition-colors hover:border-[#C9A84C]/30 hover:bg-[#FBF8F2] disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving ? 'Enregistrement...' : 'Enregistrer brouillon'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="inline-flex h-12 w-full items-center justify-center gap-3 border border-[#0A0A0A] bg-[#0A0A0A] px-6 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#F5F0E8] transition-colors hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A0A0A] disabled:opacity-50"
                >
                  <Send size={15} />
                  {saving ? 'Publication...' : 'Publier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .afrikher-editor {
          color: #0A0A0A;
          font-size: 16px;
          line-height: 1.9;
        }

        .afrikher-editor p {
          margin-bottom: 1rem;
        }

        .afrikher-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9A9A8A;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }

        .afrikher-editor h1,
        .afrikher-editor h2,
        .afrikher-editor h3,
        .afrikher-preview h1,
        .afrikher-preview h2,
        .afrikher-preview h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          color: #0A0A0A;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .afrikher-editor h1,
        .afrikher-preview h1 {
          font-size: 2rem;
          margin: 2rem 0 1rem;
        }

        .afrikher-editor h2,
        .afrikher-preview h2 {
          font-size: 1.6rem;
          margin: 1.8rem 0 0.8rem;
        }

        .afrikher-editor h3,
        .afrikher-preview h3 {
          font-size: 1.3rem;
          margin: 1.4rem 0 0.7rem;
        }

        .afrikher-editor ul,
        .afrikher-editor ol,
        .afrikher-preview ul,
        .afrikher-preview ol {
          padding-left: 1.5rem;
          margin: 0 0 1rem;
        }

        .afrikher-editor li,
        .afrikher-preview li {
          margin-bottom: 0.25rem;
        }

        .afrikher-editor blockquote,
        .afrikher-preview blockquote {
          margin: 1.8rem 0;
          border-left: 3px solid #C9A84C;
          background: #FBF8F2;
          padding: 1rem 1.4rem;
          color: #6F6656;
          font-style: italic;
        }

        .afrikher-editor-image,
        .afrikher-preview img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 1.5rem auto;
        }

        .afrikher-link,
        .afrikher-editor a,
        .afrikher-preview a {
          color: #8A6E2F;
          text-decoration: underline;
        }

        .afrikher-editor code,
        .afrikher-preview code {
          background: #F5F0E8;
          padding: 0.2rem 0.35rem;
          color: #6F6656;
          font-size: 0.92em;
        }

        .afrikher-editor pre,
        .afrikher-preview pre {
          background: #0A0A0A;
          color: #F5F0E8;
          padding: 1.2rem;
          margin: 1.5rem 0;
          overflow-x: auto;
        }

        .afrikher-editor pre code,
        .afrikher-preview pre code {
          background: transparent;
          color: inherit;
          padding: 0;
        }

        .afrikher-preview {
          color: #0A0A0A;
          font-size: 15px;
          line-height: 1.85;
        }
      `}</style>
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
      <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
        {label}
      </p>
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

function StatusBadge({ status }: { status: string }) {
  const isPublished = status === 'published';
  const isArchived = status === 'archived';

  const className = isPublished
    ? 'border-[#C9A84C]/25 bg-[#EFE6D0] text-[#8A6E2F]'
    : isArchived
      ? 'border-[#9C4C3A]/18 bg-[#F7E3DE] text-[#9C4C3A]'
      : 'border-[#0A0A0A]/8 bg-[#F5F0E8] text-[#9A9A8A]';

  const label = isPublished ? 'Publié' : isArchived ? 'Archivé' : 'Brouillon';

  return (
    <span className={`inline-flex border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.2em] ${className}`}>
      {label}
    </span>
  );
}
