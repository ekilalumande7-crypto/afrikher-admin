import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Eye, Edit2, Trash2, CheckCircle, XCircle, Package, Tag, DollarSign, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function ProductsList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for products
    const mockProducts = [
      { id: '1', name: 'Huile de Baobab Pure', category: 'Soin Visage', price: 45.00, stock: 24, status: 'active', sales: 128 },
      { id: '2', name: 'Masque Argile Rose', category: 'Soin Corps', price: 38.00, stock: 12, status: 'active', sales: 85 },
      { id: '3', name: 'Sérum Éclat Hibiscus', category: 'Soin Visage', price: 55.00, stock: 0, status: 'out_of_stock', sales: 210 },
      { id: '4', name: 'Savon Noir Traditionnel', category: 'Hygiène', price: 12.00, stock: 45, status: 'active', sales: 342 },
      { id: '5', name: 'Beurre de Karité Brut', category: 'Soin Corps', price: 25.00, stock: 18, status: 'draft', sales: 0 },
    ];
    
    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-dark">Boutique</h1>
          <p className="text-gray-400 text-sm mt-1">Gérez votre catalogue de produits et vos stocks.</p>
        </div>
        <Link to="/admin/products/new" className="flex items-center px-8 py-3.5 bg-dark text-white rounded-2xl hover:bg-charcoal transition-all font-bold tracking-wide shadow-lg shadow-dark/10">
          <Plus size={20} className="mr-2 text-gold" />
          Nouveau produit
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Produits', value: '124', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'En Stock', value: '112', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Rupture', value: '12', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { title: 'Ventes (Mois)', value: '€4,250', icon: BarChart3, color: 'text-gold', bg: 'bg-gold/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm flex items-center space-x-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
              <p className="text-2xl font-serif font-bold text-dark">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center space-x-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input 
              type="text" 
              placeholder="Rechercher un produit, SKU..." 
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
          <button className="flex items-center px-6 py-4 bg-gray-50 text-dark rounded-2xl hover:bg-cream transition-all text-sm font-bold border border-transparent hover:border-gold/20">
            <Filter size={18} className="mr-2 text-gold" />
            Filtres
          </button>
        </div>
        <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-2xl">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Actions:</span>
          <button className="p-2.5 bg-white text-gray-400 hover:text-gold rounded-xl shadow-sm transition-all" title="Activer"><CheckCircle size={18} /></button>
          <button className="p-2.5 bg-white text-gray-400 hover:text-gold rounded-xl shadow-sm transition-all" title="Désactiver"><XCircle size={18} /></button>
          <button className="p-2.5 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm transition-all" title="Supprimer"><Trash2 size={18} /></button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-[10px] uppercase tracking-widest font-bold text-gray-400">
            <tr>
              <th className="px-10 py-6 w-12">
                <input type="checkbox" className="rounded-md border-gray-200 text-gold focus:ring-gold w-4 h-4" />
              </th>
              <th className="px-10 py-6">Produit</th>
              <th className="px-10 py-6">Catégorie</th>
              <th className="px-10 py-6">Prix</th>
              <th className="px-10 py-6">Stock</th>
              <th className="px-10 py-6">Statut</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-10 py-20 text-center text-gold font-serif text-2xl">Chargement des produits...</td>
              </tr>
            ) : products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-10 py-5">
                  <input type="checkbox" className="rounded-md border-gray-200 text-gold focus:ring-gold w-4 h-4" />
                </td>
                <td className="px-10 py-5">
                  <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 rounded-2xl bg-cream overflow-hidden shrink-0 shadow-sm">
                      <img src={`https://picsum.photos/seed/prod-${product.id}/200/200`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark group-hover:text-gold transition-colors">{product.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">SKU: AFK-{product.id}00{product.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-5">
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">{product.category}</span>
                </td>
                <td className="px-10 py-5">
                  <span className="text-sm font-bold text-dark">€{product.price.toFixed(2)}</span>
                </td>
                <td className="px-10 py-5">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      product.stock > 10 ? "bg-emerald-500" : product.stock > 0 ? "bg-orange-500" : "bg-red-500"
                    )} />
                    <span className={cn(
                      "text-xs font-bold",
                      product.stock > 10 ? "text-emerald-600" : product.stock > 0 ? "text-orange-600" : "text-red-600"
                    )}>
                      {product.stock} en stock
                    </span>
                  </div>
                </td>
                <td className="px-10 py-5">
                  <span className={cn(
                    "text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider",
                    product.status === 'active' ? "bg-green-50 text-green-600" : 
                    product.status === 'out_of_stock' ? "bg-red-50 text-red-600" : "bg-gold/10 text-gold"
                  )}>
                    {product.status === 'active' ? 'Actif' : 
                     product.status === 'out_of_stock' ? 'Rupture' : 'Brouillon'}
                  </span>
                </td>
                <td className="px-10 py-5 text-right">
                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2.5 bg-white text-gray-400 hover:text-gold rounded-xl shadow-sm transition-all" title="Voir"><Eye size={18} /></button>
                    <Link to={`/admin/products/${product.id}`} className="p-2.5 bg-white text-gray-400 hover:text-gold rounded-xl shadow-sm transition-all" title="Modifier"><Edit2 size={18} /></Link>
                    <button className="p-2.5 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm transition-all" title="Supprimer"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-8 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-medium">Affichage de 1-10 sur 124 produits</p>
          <div className="flex space-x-2">
            <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-dark transition-colors">Précédent</button>
            <button className="w-10 h-10 flex items-center justify-center text-xs font-bold bg-dark text-gold rounded-xl shadow-lg shadow-dark/10">1</button>
            <button className="w-10 h-10 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-dark transition-colors">2</button>
            <button className="w-10 h-10 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-dark transition-colors">3</button>
            <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-dark transition-colors">Suivant</button>
          </div>
        </div>
      </div>
    </div>
  );
}
