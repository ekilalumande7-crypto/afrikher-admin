import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Eye, Edit2, Trash2, CheckCircle, XCircle,
  Package, BarChart3, Upload, Save, ChevronLeft, X, Image as ImageIcon,
  Users, Percent, AlertCircle, RefreshCw, ShoppingBag
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

interface Product {
  id: string;
  name: string;
  description: string;
  price: number | null;
  external_url: string | null;
  cta_text: string | null;
  images: string[];
  type: string;
  stock: number;
  unlimited: boolean;
  status: string;
  partner_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  // Joined
  partner_name?: string;
  partner_company?: string;
  commission_rate?: number;
}

interface PartnerProduct {
  id: string;
  partner_id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  stock: number;
  unlimited_stock: boolean;
  images: string[];
  status: string;
  rejection_reason: string | null;
  created_at: string;
  // Joined
  partner_name?: string;
  partner_company?: string;
}

type Tab = 'catalogue' | 'partenaires' | 'editor';

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function convertImageToJpeg(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}

const PRODUCT_TYPES = [
  { value: 'book', label: 'Livre' },
  { value: 'bouquet', label: 'Bouquet / Fleurs' },
  { value: 'digital', label: 'Digital' },
  { value: 'service', label: 'Service' },
  { value: 'accessory', label: 'Accessoire' },
  { value: 'other', label: 'Autre' },
];

function typeLabel(type: string): string {
  return PRODUCT_TYPES.find(t => t.value === type)?.label || type;
}

// ══════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════

export default function ProductsList() {
  const [tab, setTab] = useState<Tab>('catalogue');
  const [products, setProducts] = useState<Product[]>([]);
  const [partnerProducts, setPartnerProducts] = useState<PartnerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, outOfStock: 0, pending: 0 });

  // Editor state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Editor form
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formExternalUrl, setFormExternalUrl] = useState('');
  const [formCtaText, setFormCtaText] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formUnlimited, setFormUnlimited] = useState(false);
  const [formType, setFormType] = useState('book');
  const [formStatus, setFormStatus] = useState('active');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Rejection modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ══════════════════════════════════════════════
  // FETCH
  // ══════════════════════════════════════════════

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch products from Supabase
      const { data: prods, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get partner names for products that have partner_id
      const partnerIds = (prods || []).filter(p => p.partner_id).map(p => p.partner_id);
      let partnerMap: Record<string, { name: string; company: string; commission: number }> = {};

      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', partnerIds);

        const { data: partners } = await supabase
          .from('partners')
          .select('id, company_name, commission_rate')
          .in('id', partnerIds);

        (profiles || []).forEach(p => {
          partnerMap[p.id] = { name: p.full_name || '', company: '', commission: 0.15 };
        });
        (partners || []).forEach(p => {
          if (partnerMap[p.id]) {
            partnerMap[p.id].company = p.company_name || '';
            partnerMap[p.id].commission = p.commission_rate || 0.15;
          }
        });
      }

      const enriched: Product[] = (prods || []).map(p => ({
        ...p,
        images: p.images || [],
        partner_name: p.partner_id ? partnerMap[p.partner_id]?.name : undefined,
        partner_company: p.partner_id ? partnerMap[p.partner_id]?.company : undefined,
        commission_rate: p.partner_id ? partnerMap[p.partner_id]?.commission : undefined,
      }));

      setProducts(enriched);

      // Stats
      const active = enriched.filter(p => p.status === 'active').length;
      const oos = enriched.filter(p => p.status === 'out_of_stock' || (p.stock <= 0 && !p.unlimited)).length;
      setStats({ total: enriched.length, active, outOfStock: oos, pending: 0 });

    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPartnerProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('partner_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with partner names
      const partnerIds = (data || []).map(p => p.partner_id);
      let partnerMap: Record<string, { name: string; company: string }> = {};

      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', partnerIds);
        const { data: partners } = await supabase
          .from('partners')
          .select('id, company_name')
          .in('id', partnerIds);

        (profiles || []).forEach(p => {
          partnerMap[p.id] = { name: p.full_name || '', company: '' };
        });
        (partners || []).forEach(p => {
          if (partnerMap[p.id]) partnerMap[p.id].company = p.company_name || '';
        });
      }

      const enriched: PartnerProduct[] = (data || []).map(p => ({
        ...p,
        images: p.images || [],
        partner_name: partnerMap[p.partner_id]?.name,
        partner_company: partnerMap[p.partner_id]?.company,
      }));

      setPartnerProducts(enriched);
      setStats(prev => ({ ...prev, pending: enriched.filter(p => p.status === 'pending_approval').length }));
    } catch (err) {
      console.error('Error fetching partner products:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchPartnerProducts();
  }, [fetchProducts, fetchPartnerProducts]);

  // ══════════════════════════════════════════════
  // IMAGE UPLOAD
  // ══════════════════════════════════════════════

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const blob = await convertImageToJpeg(file);
        const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

        const { error } = await supabase.storage
          .from('afrikher-public')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('afrikher-public')
          .getPublicUrl(fileName);

        newUrls.push(urlData.publicUrl);
      }
      setFormImages(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  // ══════════════════════════════════════════════
  // CRUD
  // ══════════════════════════════════════════════

  const openEditor = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setIsNew(false);
      setFormName(product.name);
      setFormDesc(product.description || '');
      setFormExternalUrl(product.external_url || '');
      setFormCtaText(product.cta_text || '');
      setFormStock(product.stock.toString());
      setFormUnlimited(product.unlimited || false);
      setFormType(product.type || 'other');
      setFormStatus(product.status || 'active');
      setFormImages(product.images || []);
    } else {
      setEditingProduct(null);
      setIsNew(true);
      setFormName('');
      setFormDesc('');
      setFormExternalUrl('');
      setFormCtaText('');
      setFormStock('0');
      setFormUnlimited(false);
      setFormType('book');
      setFormStatus('active');
      setFormImages([]);
    }
    setSaveMsg('');
    window.scrollTo(0, 0);
    setTab('editor');
  };

  const saveProduct = async () => {
    if (!formName.trim() || !formExternalUrl.trim()) {
      setSaveMsg('Le nom et le lien partenaire sont obligatoires');
      return;
    }

    setSaving(true);
    setSaveMsg('');

    try {
      const payload: any = {
        name: formName.trim(),
        description: formDesc.trim(),
        external_url: formExternalUrl.trim(),
        cta_text: formCtaText.trim() || null,
        price: 0,
        stock: 0,
        unlimited: true,
        type: formType,
        status: formStatus,
        images: formImages,
      };

      if (isNew) {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        setSaveMsg('Produit créé avec succès !');
      } else if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        setSaveMsg('Produit mis à jour !');
      }

      await fetchProducts();
      setTimeout(() => { setTab('catalogue'); setSaveMsg(''); }, 1200);
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveMsg(`Erreur: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Supprimer ce produit définitivement ?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // ══════════════════════════════════════════════
  // PARTNER PRODUCTS APPROVAL
  // ══════════════════════════════════════════════

  const approvePartnerProduct = async (pp: PartnerProduct) => {
    try {
      // 1. Create in products table
      const { error: insertErr } = await supabase.from('products').insert({
        name: pp.name,
        description: pp.description,
        price: pp.price,
        images: pp.images,
        type: pp.type,
        stock: pp.stock,
        unlimited: pp.unlimited_stock,
        status: 'active',
        partner_id: pp.partner_id,
      });
      if (insertErr) throw insertErr;

      // 2. Update partner_products status
      const { error: updateErr } = await supabase
        .from('partner_products')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', pp.id);
      if (updateErr) throw updateErr;

      await fetchProducts();
      await fetchPartnerProducts();
    } catch (err) {
      console.error('Approve error:', err);
      alert('Erreur lors de l\'approbation');
    }
  };

  const rejectPartnerProduct = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    try {
      const { error } = await supabase
        .from('partner_products')
        .update({ status: 'rejected', rejection_reason: rejectReason.trim() })
        .eq('id', rejectingId);
      if (error) throw error;

      setRejectingId(null);
      setRejectReason('');
      await fetchPartnerProducts();
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  const setCommissionRate = async (partnerId: string, rate: number) => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ commission_rate: rate })
        .eq('id', partnerId);
      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error('Commission update error:', err);
    }
  };

  // ══════════════════════════════════════════════
  // FILTER
  // ══════════════════════════════════════════════

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || p.type === filterType;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const pendingPartner = partnerProducts.filter(p => p.status === 'pending_approval');

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {tab !== 'editor' && (
      <>
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-sans font-bold text-slate-900">Boutique</h1>
          <p className="text-gray-400 text-sm mt-1">Gérez votre catalogue de produits, stocks et produits partenaires.</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="flex items-center px-8 py-3.5 bg-white text-slate-900 rounded-2xl hover:bg-slate-100 transition-all font-bold tracking-wide shadow-lg shadow-slate-200"
        >
          <Plus size={20} className="mr-2 text-green-600" />
          Nouveau produit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Produits', value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Actifs', value: stats.active, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Rupture', value: stats.outOfStock, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { title: 'En attente partenaires', value: stats.pending, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
              <p className="text-2xl font-sans font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'catalogue' as Tab, label: 'Catalogue', icon: ShoppingBag },
          { id: 'partenaires' as Tab, label: `Produits partenaires${stats.pending > 0 ? ` (${stats.pending})` : ''}`, icon: Users },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-slate-900'
            }`}
          >
            <t.icon size={16} className="mr-2" />
            {t.label}
          </button>
        ))}
      </div>

      </>
      )}
      {/* ══════════════════════════════════════════════ */}
      {/* TAB: CATALOGUE */}
      {/* ══════════════════════════════════════════════ */}
      {tab === 'catalogue' && (
        <>
          {/* Search & Filters */}
          <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
              />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <option value="all">Tous les types</option>
              {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="out_of_stock">Rupture</option>
            </select>
            <button onClick={() => { fetchProducts(); }} className="p-3 bg-gray-50 hover:bg-cream rounded-xl transition-all text-gray-400 hover:text-green-600">
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Chargement des produits...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-20 text-center">
                <Package size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">Aucun produit trouvé</p>
                <p className="text-gray-300 text-sm mt-1">Créez votre premier produit pour commencer</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  <tr>
                    <th className="px-8 py-5">Produit</th>
                    <th className="px-6 py-5">Type</th>
                    <th className="px-6 py-5">Lien</th>
                    <th className="px-6 py-5">Stock</th>
                    <th className="px-6 py-5">Partenaire</th>
                    <th className="px-6 py-5">Statut</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 rounded-xl bg-cream overflow-hidden shrink-0 shadow-sm">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-green-600 transition-colors">{product.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 max-w-[200px]">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                          {typeLabel(product.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.external_url ? (
                          <a href={product.external_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-green-600 hover:underline truncate max-w-[160px] inline-block">
                            Voir le lien ↗
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {product.unlimited ? (
                            <span className="text-xs font-bold text-blue-600">Illimité</span>
                          ) : (
                            <>
                              <div className={`w-2 h-2 rounded-full ${
                                product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'
                              }`} />
                              <span className={`text-xs font-bold ${
                                product.stock > 10 ? 'text-emerald-600' : product.stock > 0 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {product.stock}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.partner_id ? (
                          <div>
                            <p className="text-xs font-bold text-slate-900">{product.partner_company || product.partner_name}</p>
                            <p className="text-[10px] text-green-600">{((product.commission_rate || 0.15) * 100).toFixed(0)}% commission</p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 uppercase tracking-wider">AFRIKHER</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider ${
                          product.status === 'active' ? 'bg-green-50 text-green-600' :
                          product.status === 'out_of_stock' ? 'bg-red-50 text-red-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {product.status === 'active' ? 'Actif' :
                           product.status === 'out_of_stock' ? 'Rupture' :
                           product.status === 'inactive' ? 'Inactif' : product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditor(product)}
                            className="p-2.5 bg-white text-gray-400 hover:text-green-600 rounded-xl shadow-sm transition-all"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2.5 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm transition-all"
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
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: PARTNER PRODUCTS */}
      {/* ══════════════════════════════════════════════ */}
      {tab === 'partenaires' && (
        <div className="space-y-6">
          {/* Pending */}
          {pendingPartner.length > 0 && (
            <div className="bg-green-50 border border-gold/20 p-6 rounded-[32px]">
              <h3 className="font-sans font-bold text-slate-900 text-lg mb-4 flex items-center">
                <AlertCircle size={20} className="text-green-600 mr-2" />
                En attente d'approbation ({pendingPartner.length})
              </h3>
              <div className="space-y-4">
                {pendingPartner.map(pp => (
                  <div key={pp.id} className="bg-white p-5 rounded-2xl border border-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-xl bg-cream overflow-hidden shrink-0">
                        {pp.images?.[0] ? (
                          <img src={pp.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{pp.name}</p>
                        <p className="text-xs text-gray-400">{typeLabel(pp.type)} — {pp.price.toFixed(2)} €</p>
                        <p className="text-[10px] text-green-600 mt-1">Par: {pp.partner_company || pp.partner_name || 'Partenaire'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => approvePartnerProduct(pp)}
                        className="flex items-center px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all"
                      >
                        <CheckCircle size={16} className="mr-1.5" />
                        Approuver
                      </button>
                      <button
                        onClick={() => { setRejectingId(pp.id); setRejectReason(''); }}
                        className="flex items-center px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-all"
                      >
                        <XCircle size={16} className="mr-1.5" />
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All partner products */}
          <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="font-sans font-bold text-slate-900 text-lg">Tous les produits partenaires</h3>
            </div>
            {partnerProducts.length === 0 ? (
              <div className="p-16 text-center">
                <Users size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">Aucun produit partenaire</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  <tr>
                    <th className="px-8 py-5">Produit</th>
                    <th className="px-6 py-5">Partenaire</th>
                    <th className="px-6 py-5">Prix</th>
                    <th className="px-6 py-5">Commission</th>
                    <th className="px-6 py-5">Statut</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {partnerProducts.map(pp => (
                    <tr key={pp.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-cream overflow-hidden shrink-0">
                            {pp.images?.[0] ? (
                              <img src={pp.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={16} /></div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{pp.name}</p>
                            <p className="text-[10px] text-gray-400">{typeLabel(pp.type)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-900">{pp.partner_company || pp.partner_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">{pp.price.toFixed(2)} €</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Percent size={14} className="text-green-600" />
                          <select
                            defaultValue="15"
                            onChange={e => setCommissionRate(pp.partner_id, parseInt(e.target.value) / 100)}
                            className="text-xs font-bold bg-gray-50 border-none rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-green-500/20"
                          >
                            <option value="10">10%</option>
                            <option value="15">15%</option>
                            <option value="20">20%</option>
                            <option value="25">25%</option>
                            <option value="30">30%</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider ${
                          pp.status === 'approved' || pp.status === 'active' ? 'bg-green-50 text-green-600' :
                          pp.status === 'pending_approval' ? 'bg-green-50 text-green-600' :
                          pp.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {pp.status === 'approved' || pp.status === 'active' ? 'Approuvé' :
                           pp.status === 'pending_approval' ? 'En attente' :
                           pp.status === 'rejected' ? 'Refusé' : pp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {pp.status === 'pending_approval' && (
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => approvePartnerProduct(pp)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all" title="Approuver">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => { setRejectingId(pp.id); setRejectReason(''); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all" title="Refuser">
                              <XCircle size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: EDITOR */}
      {/* ══════════════════════════════════════════════ */}
      {tab === 'editor' && (
        <div className="space-y-8">
          <div className="flex items-center space-x-4">
            <button onClick={() => setTab('catalogue')} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-slate-900">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-sans font-bold text-slate-900">
              {isNew ? 'Nouveau produit' : `Modifier : ${editingProduct?.name}`}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info */}
              <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-5">
                <h3 className="text-lg font-sans font-bold text-slate-900 border-b border-gray-50 pb-3">Informations</h3>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Nom du produit *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ex: Bouquet Souveraine"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Description</label>
                  <textarea
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Description détaillée du produit..."
                    className="w-full h-40 p-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Images */}
              <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-5">
                <h3 className="text-lg font-sans font-bold text-slate-900 border-b border-gray-50 pb-3">Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formImages.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden relative group border border-gray-100">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => setFormImages(formImages.filter((_, j) => j !== i))} className="p-2 bg-white rounded-full text-red-500 shadow-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-gold/30 hover:bg-green-50 transition-all flex flex-col items-center justify-center text-gray-400 hover:text-green-600 cursor-pointer">
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={24} className="mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Ajouter</span>
                      </>
                    )}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Lien partenaire */}
              <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-5">
                <h3 className="text-lg font-sans font-bold text-slate-900 border-b border-gray-50 pb-3">Lien partenaire</h3>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">URL externe du produit *</label>
                  <input
                    type="url"
                    value={formExternalUrl}
                    onChange={e => setFormExternalUrl(e.target.value)}
                    placeholder="https://site-du-partenaire.com/produit"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                  />
                  <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                    Le bouton redirigera les visiteurs vers ce lien. Le client contacte directement le partenaire.
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Texte du bouton (optionnel)</label>
                  <input
                    type="text"
                    value={formCtaText}
                    onChange={e => setFormCtaText(e.target.value)}
                    placeholder="Ex: Découvrir l'article, Contacter la vendeuse..."
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                  />
                  <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                    Si vide, le texte par défaut sera «&nbsp;Découvrir l'article&nbsp;».
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Type & Status */}
              <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-5">
                <h3 className="text-lg font-sans font-bold text-slate-900 border-b border-gray-50 pb-3">Organisation</h3>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Type de produit</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-500/20"
                  >
                    {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Statut</label>
                  <div className="space-y-2">
                    {[
                      { id: 'active', label: 'Actif', desc: 'Visible sur la boutique' },
                      { id: 'inactive', label: 'Inactif', desc: 'Masqué' },
                      { id: 'out_of_stock', label: 'Rupture', desc: 'Plus disponible' },
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => setFormStatus(s.id)}
                        className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          formStatus === s.id ? 'border-gold bg-green-50' : 'border-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">{s.label}</p>
                          <p className="text-[10px] text-gray-400">{s.desc}</p>
                        </div>
                        {formStatus === s.id && <CheckCircle size={16} className="text-green-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={saveProduct}
                disabled={saving}
                className="w-full flex items-center justify-center px-8 py-4 bg-white text-slate-900 rounded-2xl hover:bg-slate-100 transition-all font-bold tracking-wide shadow-lg shadow-slate-200 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} className="mr-2 text-green-600" />
                    {isNew ? 'Créer le produit' : 'Enregistrer'}
                  </>
                )}
              </button>

              {saveMsg && (
                <div className={`p-4 rounded-xl text-sm font-bold text-center ${
                  saveMsg.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {saveMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* REJECT MODAL */}
      {/* ══════════════════════════════════════════════ */}
      {rejectingId && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setRejectingId(null)}>
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-sans font-bold text-slate-900 text-xl mb-4">Refuser le produit</h3>
            <p className="text-sm text-gray-400 mb-4">Indiquez la raison du refus (sera envoyée au partenaire).</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Raison du refus..."
              className="w-full h-28 p-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all resize-none mb-4"
            />
            <div className="flex space-x-3">
              <button onClick={() => setRejectingId(null)} className="flex-1 py-3 bg-gray-100 text-slate-900 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">
                Annuler
              </button>
              <button
                onClick={rejectPartnerProduct}
                disabled={!rejectReason.trim()}
                className="flex-1 py-3 bg-red-500 text-slate-900 rounded-xl font-bold text-sm hover:bg-red-600 transition-all disabled:opacity-50"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
