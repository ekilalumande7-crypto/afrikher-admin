import { useEffect, useState } from 'react';
import {
  FileText,
  ShoppingBag,
  Users,
  Handshake,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Eye,
  Package,
  CreditCard,
  UserPlus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  totalOrders: number;
  revenueMonth: number;
  activeSubscribers: number;
  totalReaders: number;
  totalPartners: number;
  pendingPartners: number;
}

interface RecentOrder {
  id: string;
  customer_email: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface RecentArticle {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  category_name?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
  shipped: { bg: 'bg-blue-50', text: 'text-blue-700' },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700' },
  published: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

const statusLabels: Record<string, string> = {
  paid: 'Payé',
  pending: 'En attente',
  shipped: 'Expédié',
  delivered: 'Livré',
  cancelled: 'Annulé',
  published: 'Publié',
  draft: 'Brouillon',
};

// Monthly revenue mock data (will be replaced when orders have real data)
const monthlyData = [
  { month: 'Oct', revenue: 1200 },
  { month: 'Nov', revenue: 1800 },
  { month: 'Déc', revenue: 2400 },
  { month: 'Jan', revenue: 1900 },
  { month: 'Fév', revenue: 2800 },
  { month: 'Mar', revenue: 3200 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch all stats in parallel from Supabase
      const [
        articlesRes,
        publishedRes,
        ordersRes,
        subscribersRes,
        readersRes,
        partnersRes,
        pendingPartnersRes,
        recentOrdersRes,
        recentArticlesRes,
      ] = await Promise.all([
        // Total articles
        supabase.from('articles').select('id', { count: 'exact', head: true }),
        // Published articles
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        // Total orders
        supabase.from('orders').select('id, total', { count: 'exact', head: true }),
        // Active subscribers
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        // Total readers
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'reader'),
        // Total partners
        supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['partner', 'pending_partner']),
        // Pending partners
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'pending_partner'),
        // Recent orders (last 5)
        supabase.from('orders').select('id, customer_email, total, status, created_at').order('created_at', { ascending: false }).limit(5),
        // Recent articles with category
        supabase.from('articles').select('id, title, slug, status, created_at, categories(name)').order('created_at', { ascending: false }).limit(5),
      ]);

      // Calculate revenue this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const revenueRes = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'paid')
        .gte('created_at', startOfMonth);

      const revenueMonth = (revenueRes.data || []).reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);

      setStats({
        totalArticles: articlesRes.count || 0,
        publishedArticles: publishedRes.count || 0,
        totalOrders: ordersRes.count || 0,
        revenueMonth,
        activeSubscribers: subscribersRes.count || 0,
        totalReaders: readersRes.count || 0,
        totalPartners: partnersRes.count || 0,
        pendingPartners: pendingPartnersRes.count || 0,
      });

      // Process recent orders
      const orders = (recentOrdersRes.data || []).map((o: any) => ({
        ...o,
        customer_name: o.customer_email ? o.customer_email.split('@')[0] : 'Client',
      }));
      setRecentOrders(orders);

      // Process recent articles
      const articles = (recentArticlesRes.data || []).map((a: any) => ({
        ...a,
        category_name: a.categories?.name || 'Non catégorisé',
      }));
      setRecentArticles(articles);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9A9A8A] text-sm font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Bienvenue
        </h1>
        <p className="text-[#9A9A8A] text-sm mt-1">
          Vue d'ensemble de votre plateforme AFRIKHER
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Articles */}
        <KPICard
          label="Articles"
          value={stats?.totalArticles || 0}
          subtitle={`${stats?.publishedArticles || 0} publiés`}
          icon={FileText}
          link="/admin/articles"
        />
        {/* Commandes */}
        <KPICard
          label="Commandes"
          value={stats?.totalOrders || 0}
          subtitle="Total commandes"
          icon={Package}
          link="/admin/boutique/commandes"
        />
        {/* Lecteurs */}
        <KPICard
          label="Lecteurs"
          value={stats?.totalReaders || 0}
          subtitle="Inscrits sur le site"
          icon={Users}
          link="/admin/utilisateurs/lecteurs"
        />
        {/* Partenaires */}
        <KPICard
          label="Partenaires"
          value={stats?.totalPartners || 0}
          subtitle={stats?.pendingPartners ? `${stats.pendingPartners} en attente` : 'Aucun en attente'}
          icon={Handshake}
          link="/admin/utilisateurs/partenaires"
          highlight={stats?.pendingPartners ? true : false}
        />
      </div>

      {/* Second Row: Revenue + Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Card + Subscribers */}
        <div className="space-y-5">
          {/* Revenue This Month */}
          <div className="bg-[#0A0A0A] rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#9A9A8A] text-xs font-medium uppercase tracking-wider">Revenu du mois</span>
              <CreditCard size={18} className="text-[#C9A84C]" />
            </div>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {(stats?.revenueMonth || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </p>
            <p className="text-[#9A9A8A] text-xs mt-2">Mars 2026</p>
          </div>

          {/* Subscribers */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#9A9A8A] text-xs font-medium uppercase tracking-wider">Abonnés actifs</span>
              <UserPlus size={18} className="text-[#C9A84C]" />
            </div>
            <p className="text-3xl font-bold text-[#0A0A0A]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {stats?.activeSubscribers || 0}
            </p>
            <p className="text-[#9A9A8A] text-xs mt-2">Abonnements magazine</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#0A0A0A]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Revenus
              </h2>
              <p className="text-[#9A9A8A] text-xs mt-0.5">6 derniers mois</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-sm bg-[#C9A84C]" />
              <span className="text-[#9A9A8A]">Revenus (€)</span>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9A9A8A' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9A9A8A' }}
                  tickFormatter={(v) => `${v}€`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    padding: '10px 14px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`, 'Revenu']}
                />
                <Bar
                  dataKey="revenue"
                  fill="#C9A84C"
                  radius={[6, 6, 0, 0]}
                  opacity={0.9}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Third Row: Recent Articles + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Articles */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#0A0A0A]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Articles récents
            </h2>
            <Link to="/admin/articles" className="text-[#C9A84C] text-xs font-semibold hover:underline">
              Voir tout
            </Link>
          </div>

          {recentArticles.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-[#9A9A8A] text-sm">Aucun article pour le moment</p>
              <Link to="/admin/articles/new" className="text-[#C9A84C] text-xs font-semibold mt-2 inline-block hover:underline">
                Créer un article
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentArticles.map((article) => (
                <div key={article.id} className="flex items-center justify-between py-2 group">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-semibold text-[#0A0A0A] truncate group-hover:text-[#C9A84C] transition-colors">
                      {article.title}
                    </p>
                    <p className="text-xs text-[#9A9A8A] mt-0.5">
                      {article.category_name} · {new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <StatusBadge status={article.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#0A0A0A]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Dernières commandes
            </h2>
            <Link to="/admin/boutique/commandes" className="text-[#C9A84C] text-xs font-semibold hover:underline">
              Voir tout
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <Package size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-[#9A9A8A] text-sm">Aucune commande pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-left text-[10px] font-semibold text-[#9A9A8A] uppercase tracking-wider">Client</th>
                    <th className="pb-3 text-left text-[10px] font-semibold text-[#9A9A8A] uppercase tracking-wider">Statut</th>
                    <th className="pb-3 text-left text-[10px] font-semibold text-[#9A9A8A] uppercase tracking-wider">Date</th>
                    <th className="pb-3 text-right text-[10px] font-semibold text-[#9A9A8A] uppercase tracking-wider">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3">
                        <p className="text-sm font-medium text-[#0A0A0A]">{order.customer_name}</p>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 text-xs text-[#9A9A8A]">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-3 text-right text-sm font-semibold text-[#0A0A0A]">
                        {parseFloat(String(order.total)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function KPICard({
  label, value, subtitle, icon: Icon, link, highlight
}: {
  label: string; value: number; subtitle: string; icon: React.ElementType; link: string; highlight?: boolean
}) {
  return (
    <Link to={link} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#C9A84C]/30 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#9A9A8A] text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center group-hover:bg-[#C9A84C] transition-colors">
          <Icon size={16} className="text-[#C9A84C] group-hover:text-white transition-colors" />
        </div>
      </div>
      <p className="text-3xl font-bold text-[#0A0A0A]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        {value}
      </p>
      <p className={`text-xs mt-1 ${highlight ? 'text-[#C9A84C] font-semibold' : 'text-[#9A9A8A]'}`}>
        {subtitle}
      </p>
      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center text-[10px] font-semibold text-[#9A9A8A] uppercase tracking-wider group-hover:text-[#C9A84C] transition-colors">
        <span>Voir détails</span>
        <ArrowUpRight size={12} className="ml-1" />
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  const label = statusLabels[status] || status;
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  );
}
