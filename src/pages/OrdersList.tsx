import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Search,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  Loader
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

interface OrderStats {
  total: number
  pending: number
  paid: number
  shipped: number
  delivered: number
  cancelled: number
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: '#1A1A14', text: '#FDD34D', dot: '#FDD34D' },
  paid: { bg: '#0D2818', text: '#4ADE80', dot: '#4ADE80' },
  shipped: { bg: '#0C1E2E', text: '#38BDF8', dot: '#38BDF8' },
  delivered: { bg: '#05382A', text: '#10B981', dot: '#10B981' },
  cancelled: { bg: '#3D0F0A', text: '#EF4444', dot: '#EF4444' }
}

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée'
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Package className="w-4 h-4" />,
  paid: <ShoppingCart className="w-4 h-4" />,
  shipped: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />
}

const allowedTransitions: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  // Fetch orders from Supabase
  useEffect(() => {
    fetchOrders()
  }, [])

  // Filter orders based on search and status
  useEffect(() => {
    let result = orders

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(order => order.status === filterStatus)
    }

    // Filter by search query (email or order ID)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        order =>
          order.id.toLowerCase().includes(query) ||
          order.customer_email.toLowerCase().includes(query) ||
          (order.shipping_address?.full_name &&
            order.shipping_address.full_name.toLowerCase().includes(query))
      )
    }

    setFilteredOrders(result)
  }, [orders, searchQuery, filterStatus])

  // Calculate stats whenever orders change
  useEffect(() => {
    const newStats: OrderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      paid: orders.filter(o => o.status === 'paid').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    }
    setStats(newStats)
  }, [orders])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrders((data as Order[]) || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId)

      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // Update local state
      setOrders(
        orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus as any } : order
        )
      )
    } catch (err) {
      console.error('Error updating order status:', err)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const getCustomerName = (order: Order) => {
    if (order.shipping_address?.full_name) {
      return order.shipping_address.full_name
    }
    return order.customer_email.split('@')[0]
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: '#2A2A2A' }}>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFFFFF' }}
          >
            Gestion des Commandes
          </h1>
          <p style={{ color: '#9A9A8A' }}>
            Suivi et gestion de toutes les commandes
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Total" value={stats.total} color="#C9A84C" />
          <StatCard label="En attente" value={stats.pending} color="#FDD34D" />
          <StatCard label="Payées" value={stats.paid} color="#4ADE80" />
          <StatCard label="Expédiées" value={stats.shipped} color="#38BDF8" />
          <StatCard label="Livrées" value={stats.delivered} color="#10B981" />
          <StatCard label="Annulées" value={stats.cancelled} color="#EF4444" />
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-3 w-5 h-5"
              style={{ color: '#9A9A8A' }}
            />
            <input
              type="text"
              placeholder="Rechercher par email ou ID de commande..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded border"
              style={{
                backgroundColor: '#2A2A2A',
                borderColor: '#3A3A3A',
                color: '#FFFFFF'
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded border"
            style={{
              backgroundColor: '#2A2A2A',
              borderColor: '#3A3A3A',
              color: '#FFFFFF'
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="paid">Payée</option>
            <option value="shipped">Expédiée</option>
            <option value="delivered">Livrée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin" style={{ color: '#C9A84C' }} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: '#3A3A3A' }}
            />
            <p
              className="text-lg"
              style={{ color: '#9A9A8A' }}
            >
              Aucune commande trouvée
            </p>
          </div>
        ) : (
          /* Orders Table */
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#2A2A2A' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#2A2A2A', borderBottom: '1px solid #3A3A3A' }}>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, idx) => (
                    <React.Fragment key={order.id}>
                      {/* Main Row */}
                      <tr
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#0A0A0A' : '#1A1A1A',
                          borderBottom: '1px solid #2A2A2A'
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-sm" style={{ color: '#C9A84C' }}>
                          {order.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p style={{ color: '#FFFFFF' }}>{getCustomerName(order)}</p>
                            <p style={{ color: '#9A9A8A', fontSize: '0.875rem' }}>
                              {order.customer_email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: '#9A9A8A' }}>
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-medium"
                            style={{
                              backgroundColor: statusColors[order.status].bg,
                              color: statusColors[order.status].text
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: statusColors[order.status].dot }}
                            />
                            {statusLabels[order.status]}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: '#FFFFFF' }}>
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              setExpandedOrderId(
                                expandedOrderId === order.id ? null : order.id
                              )
                            }
                            className="inline-flex items-center justify-center p-2 rounded hover:opacity-80 transition"
                            style={{ backgroundColor: '#2A2A2A' }}
                          >
                            {expandedOrderId === order.id ? (
                              <ChevronUp className="w-5 h-5" style={{ color: '#C9A84C' }} />
                            ) : (
                              <ChevronDown className="w-5 h-5" style={{ color: '#9A9A8A' }} />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {expandedOrderId === order.id && (
                        <tr style={{ backgroundColor: '#1A1A1A', borderBottom: '1px solid #2A2A2A' }}>
                          <td colSpan={6} className="px-4 py-6">
                            <div className="space-y-6">
                              {/* Items Section */}
                              <div>
                                <h4
                                  className="font-semibold mb-3"
                                  style={{
                                    fontFamily: "'Cormorant Garamond', serif",
                                    color: '#C9A84C',
                                    fontSize: '1.125rem'
                                  }}
                                >
                                  Articles ({order.items.length})
                                </h4>
                                <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center p-3 rounded"
                                      style={{ backgroundColor: '#0A0A0A', borderLeft: '3px solid #C9A84C' }}
                                    >
                                      <div>
                                        <p style={{ color: '#FFFFFF' }}>{item.name}</p>
                                        <p style={{ color: '#9A9A8A', fontSize: '0.875rem' }}>
                                          Quantité : {item.qty}
                                        </p>
                                      </div>
                                      <p style={{ color: '#C9A84C', fontWeight: '600' }}>
                                        {formatPrice(item.price * item.qty)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Shipping Address Section */}
                              {order.shipping_address && (
                                <div>
                                  <h4
                                    className="font-semibold mb-3"
                                    style={{
                                      fontFamily: "'Cormorant Garamond', serif",
                                      color: '#C9A84C',
                                      fontSize: '1.125rem'
                                    }}
                                  >
                                    Adresse de livraison
                                  </h4>
                                  <div
                                    className="p-3 rounded space-y-1"
                                    style={{ backgroundColor: '#0A0A0A' }}
                                  >
                                    {order.shipping_address.full_name && (
                                      <p style={{ color: '#FFFFFF' }}>
                                        <span style={{ color: '#9A9A8A' }}>Nom :</span>{' '}
                                        {order.shipping_address.full_name}
                                      </p>
                                    )}
                                    {order.shipping_address.phone && (
                                      <p style={{ color: '#FFFFFF' }}>
                                        <span style={{ color: '#9A9A8A' }}>Téléphone :</span>{' '}
                                        {order.shipping_address.phone}
                                      </p>
                                    )}
                                    {order.shipping_address.address && (
                                      <p style={{ color: '#FFFFFF' }}>
                                        <span style={{ color: '#9A9A8A' }}>Adresse :</span>{' '}
                                        {order.shipping_address.address}
                                      </p>
                                    )}
                                    {order.shipping_address.city && (
                                      <p style={{ color: '#FFFFFF' }}>
                                        <span style={{ color: '#9A9A8A' }}>Ville :</span>{' '}
                                        {order.shipping_address.city}
                                      </p>
                                    )}
                                    {order.shipping_address.postal_code && (
                                      <p style={{ color: '#FFFFFF' }}>
                                        <span style={{ color: '#9A9A8A' }}>Code postal :</span>{' '}
                                        {order.shipping_address.postal_code}
                                      </p>
                                    )}
                                    {order.shipping_address.country && (
                                      <p style={{ color: '#FFFFFF' }}>
                                        <span style={{ color: '#9A9A8A' }}>Pays :</span>{' '}
                                        {order.shipping_address.country}
                                      </p>
                                    )}
                                    {order.shipping_address.notes && (
                                      <p style={{ color: '#FFFFFF' }}>
                                        <span style={{ color: '#9A9A8A' }}>Notes :</span>{' '}
                                        {order.shipping_address.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Status Update Section */}
                              {allowedTransitions[order.status]?.length > 0 && (
                                <div>
                                  <h4
                                    className="font-semibold mb-3"
                                    style={{
                                      fontFamily: "'Cormorant Garamond', serif",
                                      color: '#C9A84C',
                                      fontSize: '1.125rem'
                                    }}
                                  >
                                    Changer le statut
                                  </h4>
                                  <div className="flex gap-2 flex-wrap">
                                    {allowedTransitions[order.status].map(newStatus => (
                                      <button
                                        key={newStatus}
                                        onClick={() => updateOrderStatus(order.id, newStatus)}
                                        disabled={updatingOrderId === order.id}
                                        className="px-4 py-2 rounded font-medium transition disabled:opacity-50"
                                        style={{
                                          backgroundColor: statusColors[newStatus].bg,
                                          color: statusColors[newStatus].text,
                                          border: `1px solid ${statusColors[newStatus].dot}`
                                        }}
                                      >
                                        {updatingOrderId === order.id ? (
                                          <Loader className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <>
                                            {statusIcons[newStatus]}
                                            <span className="ml-2">{statusLabels[newStatus]}</span>
                                          </>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Payment Info Section */}
                              {(order.fidepay_payment_id || order.fidepay_payment_url) && (
                                <div>
                                  <h4
                                    className="font-semibold mb-3"
                                    style={{
                                      fontFamily: "'Cormorant Garamond', serif",
                                      color: '#C9A84C',
                                      fontSize: '1.125rem'
                                    }}
                                  >
                                    Informations de paiement
                                  </h4>
                                  <div
                                    className="p-3 rounded space-y-2"
                                    style={{ backgroundColor: '#0A0A0A' }}
                                  >
                                    {order.fidepay_payment_id && (
                                      <p style={{ color: '#FFFFFF' }}>
                                        <span style={{ color: '#9A9A8A' }}>ID FIDEPAY :</span>{' '}
                                        <code className="text-sm" style={{ color: '#C9A84C' }}>
                                          {order.fidepay_payment_id}
                                        </code>
                                      </p>
                                    )}
                                    {order.fidepay_payment_url && (
                                      <p>
                                        <a
                                          href={order.fidepay_payment_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-3 py-2 rounded"
                                          style={{
                                            backgroundColor: '#C9A84C',
                                            color: '#0A0A0A',
                                            fontWeight: '600'
                                          }}
                                        >
                                          <Eye className="w-4 h-4" />
                                          Voir le paiement FIDEPAY
                                        </a>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  label,
  value,
  color
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div
      className="p-4 rounded-lg border"
      style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
    >
      <p style={{ color: '#9A9A8A', fontSize: '0.875rem' }}>{label}</p>
      <p
        className="text-3xl font-bold mt-2"
        style={{ color: color, fontFamily: "'Cormorant Garamond', serif" }}
      >
        {value}
      </p>
    </div>
  )
}
