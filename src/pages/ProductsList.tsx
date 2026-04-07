import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Eye, Edit2, Trash2, CheckCircle, XCircle,
  Package, BarChart3, Upload, Save, ChevronLeft, X, Image as ImageIcon,
  Users, Percent, AlertCircle, RefreshCw, ShoppingBag
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AdminAlert,
  AdminIconBadge,
  AdminSectionHeader,
  AdminSectionShell,
  adminGhostButtonClass,
  adminInputClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
  adminTextareaClass,
} from '../components/AdminPrimitives';

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
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#9A9A8A]">Boutique & sélection</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-[#0A0A0A]">Boutique</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F675B]">Pilotez le catalogue AFRIKHER, les produits partenaires et la qualité de présentation commerciale sans retomber dans un outil e-commerce générique.</p>
        </div>
        <button
          onClick={() => openEditor()}
          className={adminPrimaryButtonClass}
        >
          <Plus size={18} className="mr-2" />
          Nouveau produit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {[
          { title: 'Total Produits', value: stats.total },
          { title: 'Actifs', value: stats.active },
          { title: 'Rupture', value: stats.outOfStock },
          { title: 'En attente partenaires', value: stats.pending },
        ].map((stat, i) => (
          <div key={i} className="rounded-[2rem] border border-[#E9E2D6] bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9A9A8A]">{stat.title}</p>
              <p className="mt-3 font-display text-4xl font-semibold text-[#0A0A0A]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex w-fit space-x-2 rounded-[1.75rem] border border-[#E5E0D8] bg-[#F8F6F2] p-2">
        {[
          { id: 'catalogue' as Tab, label: 'Catalogue', icon: ShoppingBag },
          { id: 'partenaires' as Tab, label: `Produits partenaires${stats.pending > 0 ? ` (${stats.pending})` : ''}`, icon: Users },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center rounded-2xl px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] transition-all ${
              tab === t.id ? 'bg-[#0A0A0A] text-[#F5F0E8] shadow-sm' : 'text-[#6F675B] hover:text-[#0A0A0A]'
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
          <div className="flex flex-wrap items-center gap-4 rounded-[2rem] border border-[#E9E2D6] bg-white p-6 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9A8A]" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`${adminInputClass} rounded-2xl pl-12`}
              />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className={`${adminInputClass} w-auto rounded-2xl font-semibold`}
            >
              <option value="all">Tous les types</option>
              {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className={`${adminInputClass} w-auto rounded-2xl font-semibold`}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="out_of_stock">Rupture</option>
            </select>
            <button onClick={() => { fetchProducts(); }} className={`${adminGhostButtonClass} p-3`}>
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Products Table */}
          <div className="overflow-hidden rounded-[2rem] border border-[#E9E2D6] bg-white shadow-sm">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-[#6F675B]">Chargement des produits...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-20 text-center">
                <Package size={48} className="mx-auto mb-4 text-[#C9A84C]" />
                <p className="font-display text-3xl font-semibold text-[#0A0A0A]">Aucun produit trouvé</p>
                <p className="mt-2 text-sm text-[#6F675B]">Créez votre premier produit pour commencer</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[#FBF8F2] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">
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
                <tbody className="divide-y divide-[#F1ECE4]">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="group transition-colors hover:bg-[#FBF8F2]">
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#F8F6F2] shadow-sm">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#9A9A8A]">
                                <ImageIcon size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-display text-xl font-semibold text-[#0A0A0A]">{product.name}</p>
                            <p className="mt-0.5 line-clamp-1 max-w-[220px] text-[11px] text-[#9A9A8A]">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-[#E5E0D8] bg-[#F8F6F2] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6F675B]">
                          {typeLabel(product.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.external_url ? (
                          <a href={product.external_url} target="_blank" rel="noopener noreferrer" className="inline-block max-w-[160px] truncate text-xs font-semibold text-[#C9A84C] hover:underline">
                            Voir le lien ↗
                          </a>
                        ) : (
                          <span className="text-xs text-[#B8AF9F]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {product.unlimited ? (
                            <span className="text-xs font-semibold text-[#6D5622]">Illimité</span>
                          ) : (
                            <>
                              <div className={`w-2 h-2 rounded-full ${
                                product.stock > 10 ? 'bg-[#0A0A0A]' : product.stock > 0 ? 'bg-[#C9A84C]' : 'bg-[#7C2D2D]'
                              }`} />
                              <span className={`text-xs font-semibold ${
                                product.stock > 10 ? 'text-[#0A0A0A]' : product.stock > 0 ? 'text-[#6D5622]' : 'text-[#7C2D2D]'
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
                            <p className="text-xs font-semibold text-[#0A0A0A]">{product.partner_company || product.partner_name}</p>
                            <p className="text-[10px] text-[#C9A84C]">{((product.commission_rate || 0.15) * 100).toFixed(0)}% commission</p>
                          </div>
                        ) : (
                          <span className="text-[10px] uppercase tracking-[0.22em] text-[#9A9A8A]">AFRIKHER</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                          product.status === 'active' ? 'border-[#C9A84C]/30 bg-[#FBF7ED] text-[#6D5622]' :
                          product.status === 'out_of_stock' ? 'border-[#7C2D2D]/18 bg-[#FBF1F0] text-[#7C2D2D]' :
                          'border-[#E5E0D8] bg-[#F8F6F2] text-[#6F675B]'
                        }`}>
                          {product.status === 'active' ? 'Actif' :
                           product.status === 'out_of_stock' ? 'Rupture' :
                           product.status === 'inactive' ? 'Inactif' : product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => openEditor(product)}
                            className="rounded-2xl border border-[#E5E0D8] bg-white p-2.5 text-[#6F675B] shadow-sm transition-all hover:border-[#C9A84C]/35 hover:text-[#C9A84C]"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="rounded-2xl border border-[#E5E0D8] bg-white p-2.5 text-[#6F675B] shadow-sm transition-all hover:border-[#7C2D2D]/20 hover:text-[#7C2D2D]"
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
            <div className="rounded-[2rem] border border-[#C9A84C]/20 bg-[#FBF7ED] p-6">
              <h3 className="mb-4 flex items-center font-display text-2xl font-semibold text-[#0A0A0A]">
                <AlertCircle size={20} className="mr-2 text-[#C9A84C]" />
                En attente d'approbation ({pendingPartner.length})
              </h3>
              <div className="space-y-4">
                {pendingPartner.map(pp => (
                  <div key={pp.id} className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#F8F6F2]">
                        {pp.images?.[0] ? (
                          <img src={pp.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#9A9A8A]"><ImageIcon size={20} /></div>
                        )}
                      </div>
                      <div>
                        <p className="font-display text-xl font-semibold text-[#0A0A0A]">{pp.name}</p>
                        <p className="text-xs text-[#9A9A8A]">{typeLabel(pp.type)} — {pp.price.toFixed(2)} €</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#C9A84C]">Par: {pp.partner_company || pp.partner_name || 'Partenaire'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => approvePartnerProduct(pp)}
                        className={adminPrimaryButtonClass}
                      >
                        <CheckCircle size={16} className="mr-1.5" />
                        Approuver
                      </button>
                      <button
                        onClick={() => { setRejectingId(pp.id); setRejectReason(''); }}
                        className="inline-flex items-center rounded-2xl border border-[#7C2D2D]/18 bg-[#FBF1F0] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#7C2D2D] transition-all hover:bg-[#F7E6E4]"
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
          <div className="overflow-hidden rounded-[2rem] border border-[#E9E2D6] bg-white shadow-sm">
            <div className="border-b border-[#F1ECE4] p-6">
              <h3 className="font-display text-2xl font-semibold text-[#0A0A0A]">Tous les produits partenaires</h3>
            </div>
            {partnerProducts.length === 0 ? (
              <div className="p-16 text-center">
                <Users size={48} className="mx-auto mb-4 text-[#C9A84C]" />
                <p className="font-display text-3xl font-semibold text-[#0A0A0A]">Aucun produit partenaire</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[#FBF8F2] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">
                  <tr>
                    <th className="px-8 py-5">Produit</th>
                    <th className="px-6 py-5">Partenaire</th>
                    <th className="px-6 py-5">Prix</th>
                    <th className="px-6 py-5">Commission</th>
                    <th className="px-6 py-5">Statut</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1ECE4]">
                  {partnerProducts.map(pp => (
                    <tr key={pp.id} className="group transition-colors hover:bg-[#FBF8F2]">
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#F8F6F2]">
                            {pp.images?.[0] ? (
                              <img src={pp.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#9A9A8A]"><ImageIcon size={16} /></div>
                            )}
                          </div>
                          <div>
                            <p className="font-display text-xl font-semibold text-[#0A0A0A]">{pp.name}</p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-[#9A9A8A]">{typeLabel(pp.type)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-900">{pp.partner_company || pp.partner_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-[#0A0A0A]">{pp.price.toFixed(2)} €</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Percent size={14} className="text-[#C9A84C]" />
                          <select
                            defaultValue="15"
                            onChange={e => setCommissionRate(pp.partner_id, parseInt(e.target.value) / 100)}
                            className={`${adminInputClass} rounded-xl px-2 py-1 text-xs font-semibold`}
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
                        <span className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                          pp.status === 'approved' || pp.status === 'active' ? 'border-[#C9A84C]/30 bg-[#FBF7ED] text-[#6D5622]' :
                          pp.status === 'pending_approval' ? 'border-[#C9A84C]/30 bg-[#FBF7ED] text-[#6D5622]' :
                          pp.status === 'rejected' ? 'border-[#7C2D2D]/18 bg-[#FBF1F0] text-[#7C2D2D]' :
                          'border-[#E5E0D8] bg-[#F8F6F2] text-[#6F675B]'
                        }`}>
                          {pp.status === 'approved' || pp.status === 'active' ? 'Approuvé' :
                           pp.status === 'pending_approval' ? 'En attente' :
                           pp.status === 'rejected' ? 'Refusé' : pp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {pp.status === 'pending_approval' && (
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => approvePartnerProduct(pp)} className="rounded-2xl border border-[#C9A84C]/30 bg-[#FBF7ED] p-2 text-[#6D5622] transition-all hover:bg-[#F7EED9]" title="Approuver">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => { setRejectingId(pp.id); setRejectReason(''); }} className="rounded-2xl border border-[#7C2D2D]/18 bg-[#FBF1F0] p-2 text-[#7C2D2D] transition-all hover:bg-[#F7E6E4]" title="Refuser">
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
            <button onClick={() => setTab('catalogue')} className={`${adminGhostButtonClass} rounded-2xl px-3 py-2 text-[11px]`}>
              <ChevronLeft size={24} />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#9A9A8A]">Edition boutique</p>
              <h2 className="mt-2 font-display text-4xl font-semibold text-[#0A0A0A]">
              {isNew ? 'Nouveau produit' : `Modifier : ${editingProduct?.name}`}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info */}
              <AdminSectionShell>
                <AdminSectionHeader eyebrow="Informations" title="Presence produit" description="Affinez le ton, la promesse et la lecture du produit dans un registre plus marque que catalogue." />
                <div className="space-y-5 p-8">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Nom du produit *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ex: Bouquet Souveraine"
                    className={`${adminInputClass} rounded-2xl`}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Description</label>
                  <textarea
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Description détaillée du produit..."
                    className={`${adminTextareaClass} h-40 rounded-2xl`}
                  />
                </div>
                </div>
              </AdminSectionShell>

              {/* Images */}
              <AdminSectionShell>
                <AdminSectionHeader eyebrow="Visuels" title="Galerie produit" description="Travaillez la premiere impression avec une mise en scene plus editorialisee des images." />
                <div className="grid grid-cols-2 gap-4 p-8 md:grid-cols-4">
                  {formImages.map((img, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#F8F6F2]">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => setFormImages(formImages.filter((_, j) => j !== i))} className="rounded-full bg-white p-2 text-[#7C2D2D] shadow-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#C9A84C]/35 bg-[#FBF8F2] text-[#6F675B] transition-all hover:border-[#C9A84C] hover:bg-white hover:text-[#0A0A0A]">
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
              </AdminSectionShell>

              {/* Lien partenaire */}
              <AdminSectionShell>
                <AdminSectionHeader eyebrow="Redirection" title="Lien partenaire" description="Ce module controle la sortie vers l'univers de vente du partenaire en gardant un cadre clair pour l'utilisatrice." />
                <div className="space-y-5 p-8">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">URL externe du produit *</label>
                  <input
                    type="url"
                    value={formExternalUrl}
                    onChange={e => setFormExternalUrl(e.target.value)}
                    placeholder="https://site-du-partenaire.com/produit"
                    className={`${adminInputClass} rounded-2xl`}
                  />
                  <p className="mt-2 text-[11px] leading-relaxed text-[#9A9A8A]">
                    Le bouton redirigera les visiteurs vers ce lien. Le client contacte directement le partenaire.
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Texte du bouton (optionnel)</label>
                  <input
                    type="text"
                    value={formCtaText}
                    onChange={e => setFormCtaText(e.target.value)}
                    placeholder="Ex: Découvrir l'article, Contacter la vendeuse..."
                    className={`${adminInputClass} rounded-2xl`}
                  />
                  <p className="mt-2 text-[11px] leading-relaxed text-[#9A9A8A]">
                    Si vide, le texte par défaut sera «&nbsp;Découvrir l'article&nbsp;».
                  </p>
                </div>
                </div>
              </AdminSectionShell>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Type & Status */}
              <AdminSectionShell>
                <AdminSectionHeader eyebrow="Organisation" title="Cadre de diffusion" description="Positionnez le produit dans le bon registre et choisissez son niveau de visibilite." />
                <div className="space-y-5 p-8">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Type de produit</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className={`${adminInputClass} rounded-2xl font-semibold`}
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
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                          formStatus === s.id ? 'border-[#C9A84C]/35 bg-[#FBF7ED]' : 'border-[#E5E0D8] bg-[#F8F6F2] hover:border-[#D6CCBC]'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-[#0A0A0A]">{s.label}</p>
                          <p className="text-[10px] text-[#9A9A8A]">{s.desc}</p>
                        </div>
                        {formStatus === s.id && <CheckCircle size={16} className="text-[#C9A84C]" />}
                      </button>
                    ))}
                  </div>
                </div>
                </div>
              </AdminSectionShell>

              {/* Save button */}
              <button
                onClick={saveProduct}
                disabled={saving}
                className={`${adminPrimaryButtonClass} w-full justify-center py-4 disabled:opacity-50`}
              >
                {saving ? (
                  <div className="h-5 w-5 rounded-full border-2 border-[#F5F0E8] border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    {isNew ? 'Créer le produit' : 'Enregistrer'}
                  </>
                )}
              </button>

              {saveMsg && (
                <AdminAlert tone={saveMsg.includes('Erreur') ? 'error' : 'success'} className="justify-center text-center">
                  <p className="text-sm font-semibold">{saveMsg}</p>
                </AdminAlert>
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
          <div className="w-full max-w-md rounded-[2rem] border border-[#E9E2D6] bg-white p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 font-display text-3xl font-semibold text-[#0A0A0A]">Refuser le produit</h3>
            <p className="mb-4 text-sm text-[#6F675B]">Indiquez la raison du refus (sera envoyée au partenaire).</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Raison du refus..."
              className={`${adminTextareaClass} mb-4 h-28 rounded-2xl`}
            />
            <div className="flex space-x-3">
              <button onClick={() => setRejectingId(null)} className={`${adminSecondaryButtonClass} flex-1 justify-center py-3`}>
                Annuler
              </button>
              <button
                onClick={rejectPartnerProduct}
                disabled={!rejectReason.trim()}
                className="flex-1 rounded-2xl border border-[#7C2D2D]/18 bg-[#FBF1F0] py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#7C2D2D] transition-all hover:bg-[#F7E6E4] disabled:opacity-50"
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
