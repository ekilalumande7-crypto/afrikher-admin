import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Search,
  X,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  Loader,
  MoreVertical
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

const statusColors: Record<string, { badge: string; text: string; dot: string }> = {
  pending: { badge: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  paid: { badge: '#DCFCE7', text: '#166534', dot: '#22C55E' },
  shipped: { badge: '#E0F2FE', text: '#0C4A6E', dot: '#0EA5E9' },
  delivered: { badge: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  cancelled: { badge: '#FEE2E2', text: '#7F1D1D', dot: '#EF4444' }
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
  paid: <CheckCircle className="w-4 h-4" />,
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    let result = orders

    if (filterStatus !== 'all') {
      result = result.filter(order => order.status === filterStatus)
    }

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

      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus as any } : order
      )
      setOrders(updatedOrders)

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus as any
        })
      }
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">Commandes</h1>
          <p className="text-gray-600">Gérez et suivez toutes les commandes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Total" value={stats.total} color="#6B7280" />
          <StatCard label="En attente" value={stats.pending} color="#F59E0B" />
          <StatCard label="Payées" value={stats.paid} color="#16A34A" />
          <StatCard label="Expédiées" value={stats.shipped} color="#0EA5E9" />
          <StatCard label="Livrées" value={stats.delivered} color="#10B981" />
          <StatCard label="Annulées" value={stats.cancelled} color="#EF4444" />
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par email ou ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <Loader className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg text-gray-600">Aucune commande trouvée</p>
          </div>
        ) : (
          /* Orders Table */
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Montant</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, idx) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">
                        {order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getCustomerName(order)}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {order.customer_email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: statusColors[order.status].badge,
                            color: statusColors[order.status].text
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: statusColors[order.status].dot }}
                          />
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(orderId, newStatus) => {
            updateOrderStatus(orderId, newStatus)
          }}
          updatingOrderId={updatingOrderId}
          formatPrice={formatPrice}
          formatDate={formatDate}
          statusLabels={statusLabels}
          statusColors={statusColors}
          statusIcons={statusIcons}
          allowedTransitions={allowedTransitions}
        />
      )}
    </div>
  )
}

interface OrderDetailModalProps {
  order: Order
  onClose: () => void
  onStatusChange: (orderId: string, newStatus: string) => void
  updatingOrderId: string | null
  formatPrice: (price: number) => string
  formatDate: (date: string) => string
  statusLabels: Record<string, string>
  statusColors: Record<string, { badge: string; text: string; dot: string }>
  statusIcons: Record<string, React.ReactNode>
  allowedTransitions: Record<string, string[]>
}

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
  updatingOrderId,
  formatPrice,
  formatDate,
  statusLabels,
  statusColors,
  statusIcons,
  allowedTransitions
}: OrderDetailModalProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Commande {order.id.slice(0, 8)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(order.created_at)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-6 space-y-8">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Client</h3>
              <div className="space-y-2">
                <p className="text-gray-900 font-medium">
                  {order.shipping_address?.full_name || order.customer_email.split('@')[0]}
                </p>
                <p className="text-gray-600 text-sm">{order.customer_email}</p>
                {order.shipping_address?.phone && (
                  <p className="text-gray-600 text-sm">{order.shipping_address.phone}</p>
                )}
              </div>
            </div>

            {/* Current Status */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Statut actuel</h3>
              <span
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: statusColors[order.status].badge,
                  color: statusColors[order.status].text
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: statusColors[order.status].dot }}
                />
                {statusLabels[order.status]}
              </span>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Articles ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600 mt-1">Quantité : {item.qty}</p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-4">
                      {formatPrice(item.price * item.qty)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100 flex justify-between items-center">
                <p className="font-semibold text-gray-900">Total</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(order.total)}</p>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shipping_address && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Adresse de livraison
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-2 text-sm">
                  {order.shipping_address.full_name && (
                    <p>
                      <span className="text-gray-600">Nom :</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {order.shipping_address.full_name}
                      </span>
                    </p>
                  )}
                  {order.shipping_address.address && (
                    <p>
                      <span className="text-gray-600">Adresse :</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {order.shipping_address.address}
                      </span>
                    </p>
                  )}
                  {order.shipping_address.postal_code && (
                    <p>
                      <span className="text-gray-600">Code postal :</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {order.shipping_address.postal_code}
                      </span>
                    </p>
                  )}
                  {order.shipping_address.city && (
                    <p>
                      <span className="text-gray-600">Ville :</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {order.shipping_address.city}
                      </span>
                    </p>
                  )}
                  {order.shipping_address.country && (
                    <p>
                      <span className="text-gray-600">Pays :</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {order.shipping_address.country}
                      </span>
                    </p>
                  )}
                  {order.shipping_address.notes && (
                    <p>
                      <span className="text-gray-600">Notes :</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {order.shipping_address.notes}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Status Update Actions */}
            {allowedTransitions[order.status]?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Modifier le statut</h3>
                <div className="grid grid-cols-2 gap-3">
                  {allowedTransitions[order.status].map(newStatus => (
                    <button
                      key={newStatus}
                      onClick={() => onStatusChange(order.id, newStatus)}
                      disabled={updatingOrderId === order.id}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: statusColors[newStatus].badge,
                        color: statusColors[newStatus].text,
                        border: `1.5px solid ${statusColors[newStatus].dot}`
                      }}
                    >
                      {updatingOrderId === order.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {statusIcons[newStatus]}
                          <span>{statusLabels[newStatus]}</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Info */}
            {(order.fidepay_payment_id || order.fidepay_payment_url) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Paiement</h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                  {order.fidepay_payment_id && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">ID FIDEPAY</p>
                      <code className="text-sm font-mono text-gray-900 break-all">
                        {order.fidepay_payment_id}
                      </code>
                    </div>
                  )}
                  {order.fidepay_payment_url && (
                    <a
                      href={order.fidepay_payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Voir le paiement FIDEPAY
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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
    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
      <p className="text-sm text-gray-600 font-medium">{label}</p>
      <p className="text-3xl font-bold mt-2" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
