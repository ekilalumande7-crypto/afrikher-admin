import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Clock,
  User,
  FileText,
  ExternalLink
} from 'lucide-react'
import {
  AdminIconBadge,
  adminGhostButtonClass,
  adminInputClass,
  adminSecondaryButtonClass,
} from '../components/AdminPrimitives'

interface OrderItem {
  product_id: string
  name: string
  qty: number
  price: number
}

interface ShippingAddress {
  full_name?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  postal_code?: string
  notes?: string
}

interface Order {
  id: string
  user_id: string | null
  items: OrderItem[]
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  customer_email: string
  shipping_address: ShippingAddress | null
  created_at: string
  updated_at: string
  fidepay_payment_id: string | null
  fidepay_payment_url: string | null
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; border: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', bg: 'bg-[#FBF7ED]', text: 'text-[#6D5622]', dot: 'bg-[#C9A84C]', border: 'border-[#C9A84C]/30', icon: <Clock className="w-4 h-4" /> },
  paid: { label: 'Payée', bg: 'bg-[#F5F3EF]', text: 'text-[#3A342A]', dot: 'bg-[#0A0A0A]', border: 'border-[#D9D1C2]', icon: <CheckCircle className="w-4 h-4" /> },
  shipped: { label: 'Expédiée', bg: 'bg-[#F8F6F2]', text: 'text-[#6F675B]', dot: 'bg-[#9A9A8A]', border: 'border-[#E5E0D8]', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Livrée', bg: 'bg-[#FBF7ED]', text: 'text-[#6D5622]', dot: 'bg-[#C9A84C]', border: 'border-[#C9A84C]/30', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Annulée', bg: 'bg-[#FBF1F0]', text: 'text-[#7C2D2D]', dot: 'bg-[#7C2D2D]', border: 'border-[#7C2D2D]/18', icon: <XCircle className="w-4 h-4" /> }
}

const statusFlow: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setOrders((data as Order[]) || [])
    setLoading(false)
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o))
    }
    setUpdatingId(null)
  }

  // Computed
  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return o.id.toLowerCase().includes(q)
        || o.customer_email.toLowerCase().includes(q)
        || (o.shipping_address?.full_name || '').toLowerCase().includes(q)
    }
    return true
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const getName = (o: Order) => o.shipping_address?.full_name || o.customer_email.split('@')[0]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[#9A9A8A]">Commandes & suivi</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-[#0A0A0A]">Commandes</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F675B]">Suivez les achats, la progression de traitement et les informations client dans une lecture plus claire, plus calme et plus premium.</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total', val: stats.total, color: 'text-[#0A0A0A]' },
          { label: 'En attente', val: stats.pending, color: 'text-[#6D5622]' },
          { label: 'Payées', val: stats.paid, color: 'text-[#3A342A]' },
          { label: 'Expédiées', val: stats.shipped, color: 'text-[#6F675B]' },
          { label: 'Livrées', val: stats.delivered, color: 'text-[#6D5622]' },
          { label: 'Annulées', val: stats.cancelled, color: 'text-[#7C2D2D]' },
        ].map(s => (
          <div key={s.label} className="rounded-[1.75rem] border border-[#E9E2D6] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-[#9A9A8A]" />
          <input
            type="text"
            placeholder="Rechercher par email, nom ou ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`${adminInputClass} rounded-2xl py-2.5 pl-10`}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className={`${adminInputClass} w-auto rounded-2xl py-2.5`}
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="paid">Payée</option>
          <option value="shipped">Expédiée</option>
          <option value="delivered">Livrée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-8 h-8 animate-spin text-[#C9A84C]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto mb-4 h-16 w-16 text-[#C9A84C]" />
          <p className="font-display text-3xl font-semibold text-[#0A0A0A]">Aucune commande trouvée</p>
          <p className="mt-2 text-sm text-[#6F675B]">Ajustez les filtres ou attendez les prochaines commandes.</p>
        </div>
      ) : (
        /* Orders list — expandable rows */
        <div className="space-y-3">
          {filtered.map(order => {
            const st = statusConfig[order.status] || statusConfig.pending
            const isOpen = expandedId === order.id
            const transitions = statusFlow[order.status] || []

            return (
              <div key={order.id} className={`overflow-hidden rounded-[1.75rem] border bg-white transition-all ${isOpen ? 'border-[#C9A84C]/35 shadow-md' : 'border-[#E9E2D6] hover:border-[#D8CEBF]'}`}>
                {/* Row header — click to expand */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : order.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left"
                >
                  {/* Status dot */}
                  <div className={`w-3 h-3 rounded-full shrink-0 ${st.dot}`} />

                  {/* Customer + ID */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-display text-xl font-semibold text-[#0A0A0A]">{getName(order)}</p>
                    <p className="mt-0.5 text-[11px] text-[#9A9A8A]">#{order.id.slice(0, 8).toUpperCase()} · {fmtDate(order.created_at)}</p>
                  </div>

                  {/* Items count */}
                  <div className="hidden text-xs text-[#6F675B] sm:block">
                    {order.items?.length || 0} article(s)
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${st.bg} ${st.text} ${st.border}`}>
                    {st.icon}
                    {st.label}
                  </span>

                  {/* Total */}
                  <span className="w-24 text-right text-sm font-semibold text-[#0A0A0A]">{fmt(order.total)}</span>

                  {/* Chevron */}
                  {isOpen ? <ChevronUp className="h-5 w-5 shrink-0 text-[#9A9A8A]" /> : <ChevronDown className="h-5 w-5 shrink-0 text-[#9A9A8A]" />}
                </button>

                {/* Expanded detail panel */}
                {isOpen && (
                  <div className="border-t border-[#F1ECE4] px-5 pb-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">

                      {/* COL 1: Client info */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Client</h3>
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5 text-sm">
                            <User className="h-4 w-4 shrink-0 text-[#9A9A8A]" />
                            <span className="font-medium text-[#0A0A0A]">{getName(order)}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm">
                            <Mail className="h-4 w-4 shrink-0 text-[#9A9A8A]" />
                            <span className="text-[#6F675B]">{order.customer_email}</span>
                          </div>
                          {order.shipping_address?.phone && (
                            <div className="flex items-center gap-2.5 text-sm">
                              <Phone className="h-4 w-4 shrink-0 text-[#9A9A8A]" />
                              <span className="text-[#6F675B]">{order.shipping_address.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Address */}
                        {order.shipping_address?.address && (
                          <div className="pt-2">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Livraison</h3>
                            <div className="flex items-start gap-2.5 text-sm">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9A9A8A]" />
                              <div className="text-[#6F675B]">
                                <p>{order.shipping_address.address}</p>
                                <p>{order.shipping_address.postal_code} {order.shipping_address.city}</p>
                                <p>{order.shipping_address.country}</p>
                                {order.shipping_address.notes && (
                                  <p className="mt-1 text-xs italic text-[#9A9A8A]">{order.shipping_address.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* COL 2: Items */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Articles ({order.items?.length || 0})</h3>
                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-2xl border border-[#EDE7DD] bg-[#FAF7F2] p-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-[#0A0A0A]">{item.name}</p>
                                <p className="text-xs text-[#9A9A8A]">Qté : {item.qty}</p>
                              </div>
                              <p className="ml-3 text-sm font-semibold text-[#0A0A0A]">{fmt(item.price * item.qty)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-[#C9A84C]/20 bg-[#FBF7ED] p-3">
                          <p className="text-sm font-semibold text-[#0A0A0A]">Total</p>
                          <p className="text-lg font-semibold text-[#6D5622]">{fmt(order.total)}</p>
                        </div>
                      </div>

                      {/* COL 3: Status + Payment + Actions */}
                      <div className="space-y-4">
                        {/* Current status timeline */}
                        <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Statut & Suivi</h3>

                        {/* Status timeline */}
                        <div className="space-y-2">
                          {['pending', 'paid', 'shipped', 'delivered'].map((step, idx) => {
                            const stepCfg = statusConfig[step]
                            const statusOrder = ['pending', 'paid', 'shipped', 'delivered']
                            const currentIdx = statusOrder.indexOf(order.status === 'cancelled' ? 'pending' : order.status)
                            const stepIdx = idx
                            const isActive = stepIdx <= currentIdx && order.status !== 'cancelled'
                            const isCurrent = step === order.status

                            return (
                              <div key={step} className="flex items-center gap-3">
                                <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center ${isActive ? `${stepCfg.bg} ${stepCfg.text}` : 'bg-[#F5F3EF] text-[#C9C1B3]'}`}>
                                  {stepCfg.icon}
                                </div>
                                <p className={`text-sm ${isCurrent ? 'font-semibold text-[#0A0A0A]' : isActive ? 'text-[#6F675B]' : 'text-[#C9C1B3]'}`}>
                                  {stepCfg.label}
                                  {isCurrent && <span className="ml-2 text-xs font-normal text-[#9A9A8A]">(actuel)</span>}
                                </p>
                              </div>
                            )
                          })}
                          {order.status === 'cancelled' && (
                            <div className="flex items-center gap-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FBF1F0] text-[#7C2D2D]">
                                <XCircle className="w-4 h-4" />
                              </div>
                              <p className="text-sm font-semibold text-[#7C2D2D]">Annulée</p>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        {transitions.length > 0 && (
                          <div className="pt-2">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Changer le statut</h3>
                            <div className="flex flex-wrap gap-2">
                              {transitions.map(ns => {
                                const nsCfg = statusConfig[ns]
                                return (
                                  <button
                                    key={ns}
                                    onClick={(e) => { e.stopPropagation(); updateStatus(order.id, ns) }}
                                    disabled={updatingId === order.id}
                                    className={`inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${nsCfg.bg} ${nsCfg.text} ${nsCfg.border} hover:shadow-sm`}
                                  >
                                    {updatingId === order.id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : nsCfg.icon}
                                    {nsCfg.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Payment info */}
                        {(order.fidepay_payment_id || order.fidepay_payment_url) && (
                          <div className="pt-2">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Paiement</h3>
                            <div className="space-y-2 rounded-2xl border border-[#EDE7DD] bg-[#FAF7F2] p-3">
                              {order.fidepay_payment_id && (
                                <div className="flex items-center gap-2 text-sm">
                                  <CreditCard className="h-4 w-4 shrink-0 text-[#9A9A8A]" />
                                  <code className="break-all text-xs font-mono text-[#6F675B]">{order.fidepay_payment_id}</code>
                                </div>
                              )}
                              {order.fidepay_payment_url && (
                                <a
                                  href={order.fidepay_payment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A84C] hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Voir sur FIDEPAY
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="space-y-1 pt-2 text-xs text-[#9A9A8A]">
                          <p>Créée : {fmtDate(order.created_at)} à {fmtTime(order.created_at)}</p>
                          {order.updated_at && order.updated_at !== order.created_at && (
                            <p>Mise à jour : {fmtDate(order.updated_at)} à {fmtTime(order.updated_at)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
