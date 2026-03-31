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
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-dark">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-3xl font-serif font-bold text-dark">
            {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => handleSave()}
            className="flex items-center px-8 py-3.5 bg-dark text-white rounded-2xl hover:bg-charcoal transition-all font-bold tracking-wide shadow-lg shadow-dark/10"
          >
            <Save size={20} className="mr-2 text-gold" />
            Enregistrer le produit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-6">
            <h3 className="text-xl font-serif font-bold text-dark border-b border-gray-50 pb-4">Informations Générales</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Nom du produit</label>
                <input 
                  type="text" 
                  placeholder="Ex: Huile de Baobab Pure" 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Description</label>
                <textarea 
                  placeholder="Décrivez les bienfaits, l'utilisation et la composition..." 
                  className="w-full h-48 p-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-6">
            <h3 className="text-xl font-serif font-bold text-dark border-b border-gray-50 pb-4">Médias</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group border border-gray-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => removeImage(i)} className="p-2 bg-white rounded-full text-red-500 shadow-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              <button 
                onClick={addImage}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-gold/30 hover:bg-gold/5 transition-all flex flex-col items-center justify-center text-gray-400 hover:text-gold"
              >
                <Plus size={24} className="mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Ajouter</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-6">
            <h3 className="text-xl font-serif font-bold text-dark border-b border-gray-50 pb-4">Inventaire & Prix</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Prix de vente (€)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Stock initial</label>
                <div className="relative">
                  <Package size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-6">
            <h3 className="text-xl font-serif font-bold text-dark border-b border-gray-50 pb-4">Organisation</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Catégorie</label>
                <select 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gold/20"
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
                    { id: 'active', label: 'Actif', desc: 'Visible sur la boutique', color: 'bg-emerald-500' },
                    { id: 'draft', label: 'Brouillon', desc: 'Masqué pour le moment', color: 'bg-gold' },
                    { id: 'archived', label: 'Archivé', desc: 'Retiré de la vente', color: 'bg-gray-400' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatus(s.id)}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between",
                        status === s.id ? "border-gold bg-gold/5" : "border-gray-50 hover:border-gray-200"
                      )}
                    >
                      <div>
                        <p className="text-sm font-bold text-dark">{s.label}</p>
                        <p className="text-[10px] text-gray-400">{s.desc}</p>
                      </div>
                      {status === s.id && <Check size={18} className="text-gold" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark p-8 rounded-[32px] text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <h3 className="text-xl font-serif font-bold text-gold relative z-10">Aide & Conseils</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex space-x-3">
                <Info size={18} className="text-gold shrink-0 mt-1" />
                <p className="text-xs text-gray-300 leading-relaxed">
                  Utilisez des images haute résolution (min. 1000x1000px) sur fond neutre pour un rendu premium.
                </p>
              </div>
              <div className="flex space-x-3">
                <Info size={18} className="text-gold shrink-0 mt-1" />
                <p className="text-xs text-gray-300 leading-relaxed">
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
