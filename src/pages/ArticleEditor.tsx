import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Image as ImageIcon, 
  Link as LinkIcon,
  Save,
  Send,
  Eye,
  ChevronLeft,
  X
} from 'lucide-react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { cn } from '../lib/utils';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-cream/30 sticky top-0 z-10">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn("p-2 rounded hover:bg-green-50 transition-colors", editor.isActive('bold') ? 'text-green-600 bg-green-50' : 'text-gray-500')}
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn("p-2 rounded hover:bg-green-50 transition-colors", editor.isActive('italic') ? 'text-green-600 bg-green-50' : 'text-gray-500')}
      >
        <Italic size={18} />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn("p-2 rounded hover:bg-green-50 transition-colors", editor.isActive('bulletList') ? 'text-green-600 bg-green-50' : 'text-gray-500')}
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn("p-2 rounded hover:bg-green-50 transition-colors", editor.isActive('orderedList') ? 'text-green-600 bg-green-50' : 'text-gray-500')}
      >
        <ListOrdered size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn("p-2 rounded hover:bg-green-50 transition-colors", editor.isActive('blockquote') ? 'text-green-600 bg-green-50' : 'text-gray-500')}
      >
        <Quote size={18} />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <button className="p-2 text-gray-500 hover:text-green-600 transition-colors"><ImageIcon size={18} /></button>
      <button className="p-2 text-gray-500 hover:text-green-600 transition-colors"><LinkIcon size={18} /></button>
      <div className="flex-1" />
      <button onClick={() => editor.chain().focus().undo().run()} className="p-2 text-gray-400 hover:text-slate-900"><Undo size={18} /></button>
      <button onClick={() => editor.chain().focus().redo().run()} className="p-2 text-gray-400 hover:text-slate-900"><Redo size={18} /></button>
    </div>
  );
};

export default function ArticleEditor() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('draft');
  const [category, setCategory] = useState('Culture');
  const [featured, setFeatured] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: '<p>Commencez à écrire votre article ici...</p>',
  });

  const handleSave = (publish = false) => {
    // Logic to save to Supabase
    console.log({ title, category, featured, content: editor?.getHTML(), status: publish ? 'published' : 'draft' });
    navigate('/admin/articles');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-slate-900">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-3xl font-sans font-bold text-slate-900">Nouvel article</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 text-slate-900 font-bold hover:text-green-600 transition-colors text-sm">
            <Eye size={18} className="mr-2" />
            Aperçu
          </button>
          <button 
            onClick={() => handleSave(false)}
            className="flex items-center px-6 py-2 border border-dark text-slate-900 rounded-xl hover:bg-white hover:text-slate-900 transition-all font-bold text-sm"
          >
            <Save size={18} className="mr-2" />
            Enregistrer brouillon
          </button>
          <button 
            onClick={() => handleSave(true)}
            className="flex items-center px-6 py-2 bg-green-600 text-slate-900 rounded-xl hover:bg-green-600/90 transition-all font-bold text-sm shadow-lg shadow-gold/20"
          >
            <Send size={18} className="mr-2" />
            Publier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <input 
              type="text" 
              placeholder="Titre de l'article" 
              className="w-full text-4xl font-sans font-bold text-slate-900 border-none focus:ring-0 placeholder:text-gray-200 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <div className="flex items-center space-x-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-y border-gray-50 py-4">
              <span>Slug: {title.toLowerCase().replace(/ /g, '-')}</span>
              <span className="text-gray-200">|</span>
              <span>Auteur: Admin Afrikher</span>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
              <MenuBar editor={editor} />
              <div className="p-8 min-h-[600px] prose prose-stone max-w-none focus:outline-none">
                <EditorContent editor={editor} className="focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-sans font-bold text-slate-900 mb-4">Extrait (Résumé)</h3>
            <textarea 
              placeholder="Un court résumé pour les listes d'articles..." 
              className="w-full h-32 p-4 bg-cream/30 border-none rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all resize-none"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-sans font-bold text-slate-900 border-b border-gray-50 pb-4">Paramètres</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Catégorie</label>
                <select 
                  className="w-full p-3 bg-cream/50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-500/20"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Culture</option>
                  <option>Beauté</option>
                  <option>Mode</option>
                  <option>Lifestyle</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-cream/30 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-900">Mettre en avant</p>
                  <p className="text-[10px] text-gray-500">Afficher en haut de page</p>
                </div>
                <button 
                  onClick={() => setFeatured(!featured)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    featured ? "bg-green-600" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    featured ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Date de publication</label>
                <input type="datetime-local" className="w-full p-3 bg-cream/50 border-none rounded-xl text-sm outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-sans font-bold text-slate-900 border-b border-gray-50 pb-4">Image de couverture</h3>
            
            <div className={cn(
              "aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer overflow-hidden relative group",
              coverImage ? "border-gold/50" : "border-gray-200 hover:border-gold/30 hover:bg-green-50"
            )}>
              {coverImage ? (
                <>
                  <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => setCoverImage(null)} className="p-2 bg-white rounded-full text-red-500"><X size={20} /></button>
                  </div>
                </>
              ) : (
                <div onClick={() => setCoverImage('https://picsum.photos/seed/cover/800/600')}>
                  <div className="p-4 bg-cream rounded-full text-green-600 mb-4 mx-auto w-fit">
                    <ImageIcon size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Cliquez pour uploader</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">PNG, JPG jusqu'à 5MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
