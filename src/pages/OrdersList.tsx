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

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', icon: <Clock className="w-4 h-4" /> },
  paid: { label: 'Payée', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', icon: <CheckCircle className="w-4 h-4" /> },
  shipped: { label: 'Expédiée', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Livrée', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Annulée', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400', icon: <XCircle className="w-4 h-4" /> }
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
        <h1 className="text-2xl font-bold text-slate-900">Commandes</h1>
        <p className="text-slate-500 text-sm mt-1">Gérez et suivez toutes les commandes</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total', val: stats.total, color: 'text-slate-700' },
          { label: 'En attente', val: stats.pending, color: 'text-amber-600' },
          { label: 'Payées', val: stats.paid, color: 'text-green-600' },
          { label: 'Expédiées', val: stats.shipped, color: 'text-blue-600' },
          { label: 'Livrées', val: stats.delivered, color: 'text-emerald-600' },
          { label: 'Annulées', val: stats.cancelled, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par email, nom ou ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
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
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 text-slate-200" />
          <p className="text-slate-500">Aucune commande trouvée</p>
        </div>
      ) : (
        /* Orders list — expandable rows */
        <div className="space-y-3">
          {filtered.map(order => {
            const st = statusConfig[order.status] || statusConfig.pending
            const isOpen = expandedId === order.id
            const transitions = statusFlow[order.status] || []

            return (
              <div key={order.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${isOpen ? 'border-green-300 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                {/* Row header — click to expand */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : order.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left"
                >
                  {/* Status dot */}
                  <div className={`w-3 h-3 rounded-full shrink-0 ${st.dot}`} />

                  {/* Customer + ID */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{getName(order)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">#{order.id.slice(0, 8).toUpperCase()} · {fmtDate(order.created_at)}</p>
                  </div>

                  {/* Items count */}
                  <div className="hidden sm:block text-xs text-slate-500">
                    {order.items?.length || 0} article(s)
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
                    {st.icon}
                    {st.label}
                  </span>

                  {/* Total */}
                  <span className="text-sm font-bold text-slate-900 w-24 text-right">{fmt(order.total)}</span>

                  {/* Chevron */}
                  {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                </button>

                {/* Expanded detail panel */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 pb-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">

                      {/* COL 1: Client info */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Client</h3>
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5 text-sm">
                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-slate-900 font-medium">{getName(order)}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm">
                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-slate-600">{order.customer_email}</span>
                          </div>
                          {order.shipping_address?.phone && (
                            <div className="flex items-center gap-2.5 text-sm">
                              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-slate-600">{order.shipping_address.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Address */}
                        {order.shipping_address?.address && (
                          <div className="pt-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Livraison</h3>
                            <div className="flex items-start gap-2.5 text-sm">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div className="text-slate-600">
                                <p>{order.shipping_address.address}</p>
                                <p>{order.shipping_address.postal_code} {order.shipping_address.city}</p>
                                <p>{order.shipping_address.country}</p>
                                {order.shipping_address.notes && (
                                  <p className="mt-1 text-xs italic text-slate-400">{order.shipping_address.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* COL 2: Items */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Articles ({order.items?.length || 0})</h3>
                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                                <p className="text-xs text-slate-400">Qté : {item.qty}</p>
                              </div>
                              <p className="text-sm font-semibold text-slate-900 ml-3">{fmt(item.price * item.qty)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                          <p className="text-sm font-semibold text-slate-900">Total</p>
                          <p className="text-lg font-bold text-green-700">{fmt(order.total)}</p>
                        </div>
                      </div>

                      {/* COL 3: Status + Payment + Actions */}
                      <div className="space-y-4">
                        {/* Current status timeline */}
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Statut & Suivi</h3>

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
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isActive ? `${stepCfg.bg} ${stepCfg.text}` : 'bg-slate-100 text-slate-300'}`}>
                                  {stepCfg.icon}
                                </div>
                                <p className={`text-sm ${isCurrent ? 'font-bold text-slate-900' : isActive ? 'text-slate-600' : 'text-slate-300'}`}>
                                  {stepCfg.label}
                                  {isCurrent && <span className="ml-2 text-xs font-normal text-slate-400">(actuel)</span>}
                                </p>
                              </div>
                            )
                          })}
                          {order.status === 'cancelled' && (
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-red-50 text-red-600">
                                <XCircle className="w-4 h-4" />
                              </div>
                              <p className="text-sm font-bold text-red-600">Annulée</p>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        {transitions.length > 0 && (
                          <div className="pt-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Changer le statut</h3>
                            <div className="flex flex-wrap gap-2">
                              {transitions.map(ns => {
                                const nsCfg = statusConfig[ns]
                                return (
                                  <button
                                    key={ns}
                                    onClick={(e) => { e.stopPropagation(); updateStatus(order.id, ns) }}
                                    disabled={updatingId === order.id}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 border ${nsCfg.bg} ${nsCfg.text} border-current/20 hover:shadow-sm`}
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
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Paiement</h3>
                            <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                              {order.fidepay_payment_id && (
                                <div className="flex items-center gap-2 text-sm">
                                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                                  <code className="text-xs font-mono text-slate-600 break-all">{order.fidepay_payment_id}</code>
                                </div>
                              )}
                              {order.fidepay_payment_url && (
                                <a
                                  href={order.fidepay_payment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Voir sur FIDEPAY
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="pt-2 text-xs text-slate-400 space-y-1">
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
