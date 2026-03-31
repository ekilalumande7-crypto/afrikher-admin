import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  ShoppingBag, 
  Users, 
  Handshake, 
  ArrowRight,
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreHorizontal,
  Calendar,
  ShoppingCart,
  CreditCard,
  User
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(res => res.json()),
      fetch('/api/admin/articles').then(res => res.json()),
      // Mocking orders fetch since it's not in server.ts yet
      Promise.resolve([
        { id: 'ORD-001', customer: 'Fatou Diallo', amount: 125.50, status: 'Payé', date: '2024-03-24' },
        { id: 'ORD-002', customer: 'Moussa Traoré', amount: 89.00, status: 'En attente', date: '2024-03-25' },
        { id: 'ORD-003', customer: 'Awa Koné', amount: 210.00, status: 'Livré', date: '2024-03-23' },
      ])
    ]).then(([statsData, articlesData, ordersData]) => {
      setStats(statsData);
      setArticles(articlesData);
      setOrders(ordersData);
    });
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-full text-gold font-serif text-2xl animate-pulse">Chargement de l'univers AFRIKHER...</div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-dark tracking-tight">Tableau de Bord</h1>
          <p className="text-gray-400 mt-2 font-medium">Bienvenue dans votre espace de gestion premium AFRIKHER.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/articles/new" className="flex items-center px-6 py-3 bg-dark text-white rounded-2xl font-bold text-sm hover:bg-charcoal transition-all shadow-xl shadow-dark/10 group">
            <Plus size={18} className="mr-2 text-gold group-hover:rotate-90 transition-transform duration-300" />
            Nouvel Article
          </Link>
          <Link to="/admin/boutique/produits/new" className="flex items-center px-6 py-3 bg-white text-dark border border-gray-100 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">
            <ShoppingBag size={18} className="mr-2 text-gold" />
            Nouveau Produit
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatsCard title="Articles" value={stats.totalArticles} trend={12} icon={FileText} />
        <StatsCard title="Commandes" value={stats.totalOrders} trend={8} icon={ShoppingCart} />
        <StatsCard title="Revenu (Mois)" value={`${stats.revenueThisMonth}€`} trend={15} icon={CreditCard} />
        <StatsCard title="Abonnés" value={stats.activeSubscribers} trend={5} icon={Users} />
        <StatsCard title="Nouveaux Users" value={stats.newUsersThisWeek} trend={20} icon={User} />
        <StatsCard title="Partenaires" value={stats.pendingPartners} trend={-2} icon={Handshake} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-serif font-bold text-dark">Performance des Revenus</h2>
              <p className="text-sm text-gray-400 mt-1 font-medium">Aperçu des 6 derniers mois</p>
            </div>
            <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-2xl">
              {['6M', '1Y', 'All'].map(t => (
                <button key={t} className={cn(
                  "px-4 py-2 text-[11px] font-bold rounded-xl transition-all",
                  t === '6M' ? "bg-white text-dark shadow-sm" : "text-gray-400 hover:text-dark"
                )}>{t}</button>
              ))}
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueHistory}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#999', fontWeight: 600 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#999', fontWeight: 600 }} 
                  tickFormatter={(value) => `${value}€`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }}
                  itemStyle={{ color: '#C9A84C', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#C9A84C" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Articles */}
        <div className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-serif font-bold text-dark">Articles Récents</h2>
            <Link to="/admin/articles" className="text-[11px] font-bold uppercase tracking-widest text-gold hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="space-y-8">
            {articles.slice(0, 5).map((article, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 rounded-2xl bg-cream overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <img src={article.cover_image || "https://picsum.photos/seed/article/100/100"} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark line-clamp-1 group-hover:text-gold transition-colors">{article.title}</p>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">{article.category} • {new Date(article.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  article.status === 'published' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                )}>
                  {article.status === 'published' ? 'Publié' : 'Brouillon'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-serif font-bold text-dark">Dernières Commandes</h2>
          <Link to="/admin/boutique/commandes" className="flex items-center text-[11px] font-bold uppercase tracking-widest text-gold hover:underline">
            Toutes les commandes <ArrowRight size={14} className="ml-2" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-50">
                <th className="pb-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Commande</th>
                <th className="pb-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Client</th>
                <th className="pb-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="pb-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Montant</th>
                <th className="pb-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order, i) => (
                <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-6 font-bold text-sm text-dark">{order.id}</td>
                  <td className="py-6 text-sm text-gray-600 font-medium">{order.customer}</td>
                  <td className="py-6 text-sm text-gray-400">{order.date}</td>
                  <td className="py-6 font-bold text-sm text-dark">{order.amount}€</td>
                  <td className="py-6 text-right">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block",
                      order.status === 'Payé' ? "bg-emerald-50 text-emerald-600" : 
                      order.status === 'En attente' ? "bg-orange-50 text-orange-600" : 
                      "bg-blue-50 text-blue-600"
                    )}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
