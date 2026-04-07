import React, { useState } from 'react';
import { 
  Plus, 
  Save, 
  ChevronLeft, 
  X, 
  Image as ImageIcon,
  DollarSign,
  Package,
  Tag,
  Info,
  Trash2,
  Check
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  AdminIconBadge,
  AdminSectionHeader,
  AdminSectionShell,
  adminGhostButtonClass,
  adminInputClass,
  adminPrimaryButtonClass,
  adminTextareaClass,
} from '../components/AdminPrimitives';

export default function ProductEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Soin Visage');
  const [status, setStatus] = useState('active');
  const [images, setImages] = useState<string[]>([]);

  const handleSave = () => {
    // Logic to save to Supabase
    console.log({ name, description, price, stock, category, status, images });
    navigate('/admin/products');
  };

  const addImage = () => {
    setImages([...images, `https://picsum.photos/seed/prod-${Date.now()}/800/800`]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className={`${adminGhostButtonClass} rounded-2xl px-3 py-2 text-[11px]`}>
            <ChevronLeft size={24} />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#9A9A8A]">Edition boutique</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-[#0A0A0A]">
            {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => handleSave()}
            className={adminPrimaryButtonClass}
          >
            <Save size={18} className="mr-2" />
            Enregistrer le produit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AdminSectionShell>
            <AdminSectionHeader
              eyebrow="Informations generales"
              title="Identite produit"
              description="Cadrez le nom, la promesse et le vocabulaire du produit dans une logique plus editoriale que marchande."
            />
            
            <div className="space-y-4 p-8">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Nom du produit</label>
                <input 
                  type="text" 
                  placeholder="Ex: Huile de Baobab Pure" 
                  className={`${adminInputClass} rounded-2xl`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Description</label>
                <textarea 
                  placeholder="Décrivez les bienfaits, l'utilisation et la composition..." 
                  className={`${adminTextareaClass} h-48 rounded-2xl`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </AdminSectionShell>

          <AdminSectionShell>
            <AdminSectionHeader
              eyebrow="Visuels"
              title="Mise en scene des medias"
              description="Travaillez les images du produit comme un asset de marque, pas comme un simple fichier catalogue."
            />
            
            <div className="grid grid-cols-2 gap-4 p-8 md:grid-cols-4">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#F8F6F2]">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => removeImage(i)} className="rounded-full bg-white p-2 text-[#7C2D2D] shadow-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              <button 
                onClick={addImage}
                className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9A84C]/35 bg-[#FBF8F2] text-[#6F675B] transition-all hover:border-[#C9A84C] hover:bg-white hover:text-[#0A0A0A]"
              >
                <Plus size={24} className="mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Ajouter</span>
              </button>
            </div>
          </AdminSectionShell>

          <AdminSectionShell>
            <AdminSectionHeader
              eyebrow="Structure commerciale"
              title="Prix & disponibilite"
              description="Conservez une lecture simple et premium des informations de vente et de disponibilite."
            />
            
            <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Prix de vente (€)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9A8A]" />
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className={`${adminInputClass} rounded-2xl pl-12 pr-6 py-4`}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Stock initial</label>
                <div className="relative">
                  <Package size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9A8A]" />
                  <input 
                    type="number" 
                    placeholder="0" 
                    className={`${adminInputClass} rounded-2xl pl-12 pr-6 py-4`}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </AdminSectionShell>
        </div>

        <div className="space-y-8">
          <AdminSectionShell>
            <AdminSectionHeader
              eyebrow="Organisation"
              title="Cadre de diffusion"
              description="Choisissez la famille du produit et le niveau de visibilite sans basculer dans un panneau trop technique."
            />
            
            <div className="space-y-6 p-8">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Catégorie</label>
                <select 
                  className={`${adminInputClass} rounded-2xl font-semibold`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Soin Visage</option>
                  <option>Soin Corps</option>
                  <option>Cheveux</option>
                  <option>Hygiène</option>
                  <option>Accessoires</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Statut du produit</label>
                <div className="space-y-2">
                  {[
                    { id: 'active', label: 'Actif', desc: 'Visible sur la boutique' },
                    { id: 'draft', label: 'Brouillon', desc: 'Masqué pour le moment' },
                    { id: 'archived', label: 'Archivé', desc: 'Retiré de la vente' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatus(s.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all",
                        status === s.id ? "border-[#C9A84C]/35 bg-[#FBF7ED]" : "border-[#E5E0D8] bg-[#F8F6F2] hover:border-[#D6CCBC]"
                      )}
                    >
                      <div>
                        <p className="text-sm font-bold text-[#0A0A0A]">{s.label}</p>
                        <p className="text-[10px] text-[#9A9A8A]">{s.desc}</p>
                      </div>
                      {status === s.id && <Check size={18} className="text-[#C9A84C]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </AdminSectionShell>

          <div className="relative overflow-hidden rounded-[2rem] border border-[#C9A84C]/20 bg-[#FBF7ED] p-8 text-[#0A0A0A]">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-[#C9A84C]/10 blur-3xl" />
            <div className="relative z-10 flex items-center gap-4">
              <AdminIconBadge icon={Info} />
              <h3 className="font-display text-2xl font-semibold text-[#0A0A0A]">Aide & Conseils</h3>
            </div>
            <div className="relative z-10 mt-6 space-y-4">
              <div className="flex space-x-3">
                <Info size={18} className="mt-1 shrink-0 text-[#C9A84C]" />
                <p className="text-xs leading-relaxed text-[#6F675B]">
                  Utilisez des images haute résolution (min. 1000x1000px) sur fond neutre pour un rendu premium.
                </p>
              </div>
              <div className="flex space-x-3">
                <Info size={18} className="mt-1 shrink-0 text-[#C9A84C]" />
                <p className="text-xs leading-relaxed text-[#6F675B]">
                  Une description détaillée améliore votre référencement naturel (SEO).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
