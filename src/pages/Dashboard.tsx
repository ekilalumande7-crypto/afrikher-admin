import { useEffect, useState } from 'react';
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

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  paid: { bg: 'bg-[#EFE6D0]', text: 'text-[#8A6E2F]', border: 'border-[#C9A84C]/25' },
  pending: { bg: 'bg-[#F5F0E8]', text: 'text-[#9A9A8A]', border: 'border-[#0A0A0A]/8' },
  shipped: { bg: 'bg-[#EEE7DB]', text: 'text-[#6F6656]', border: 'border-[#0A0A0A]/8' },
  delivered: { bg: 'bg-[#EFE6D0]', text: 'text-[#8A6E2F]', border: 'border-[#C9A84C]/25' },
  cancelled: { bg: 'bg-[#F7E3DE]', text: 'text-[#9C4C3A]', border: 'border-[#9C4C3A]/18' },
  published: { bg: 'bg-[#EFE6D0]', text: 'text-[#8A6E2F]', border: 'border-[#C9A84C]/25' },
  draft: { bg: 'bg-[#F5F0E8]', text: 'text-[#9A9A8A]', border: 'border-[#0A0A0A]/8' },
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

const MONTH_NAMES_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const FULL_MONTH_NAMES_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
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
        supabase.from('articles').select('id', { count: 'exact', head: true }),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('orders').select('id, total', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'reader'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['partner', 'pending_partner']),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'pending_partner'),
        supabase.from('orders').select('id, customer_email, total, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('articles').select('id, title, slug, status, created_at, categories(name)').order('created_at', { ascending: false }).limit(5),
      ]);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

      const allOrdersRes = await supabase
        .from('orders')
        .select('total, status, created_at')
        .gte('created_at', sixMonthsAgo);

      const allOrders = allOrdersRes.data || [];

      const revenueMonth = allOrders
        .filter((o: any) => o.status === 'paid' && o.created_at >= startOfMonth)
        .reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);

      const allPaidRes = await supabase.from('orders').select('total').eq('status', 'paid');
      const totalRev = (allPaidRes.data || []).reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);
      setTotalRevenue(totalRev);

      const monthlyRevData: { month: string; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const monthRev = allOrders
          .filter((o: any) => {
            const created = new Date(o.created_at);
            return (o.status === 'paid' || o.status === 'pending') && created >= monthStart && created < monthEnd;
          })
          .reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);
        monthlyRevData.push({
          month: MONTH_NAMES_FR[d.getMonth()],
          revenue: Math.round(monthRev * 100) / 100,
        });
      }
      setMonthlyData(monthlyRevData);

      const blogRes = await supabase.from('blog_posts').select('id', { count: 'exact', head: true });
      const totalArticlesCount = (articlesRes.count || 0) + (blogRes.count || 0);
      const publishedBlogRes = await supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published');
      const totalPublished = (publishedRes.count || 0) + (publishedBlogRes.count || 0);

      setStats({
        totalArticles: totalArticlesCount,
        publishedArticles: totalPublished,
        totalOrders: ordersRes.count || 0,
        revenueMonth,
        activeSubscribers: subscribersRes.count || 0,
        totalReaders: readersRes.count || 0,
        totalPartners: partnersRes.count || 0,
        pendingPartners: pendingPartnersRes.count || 0,
      });

      const orders = (recentOrdersRes.data || []).map((o: any) => ({
        ...o,
        customer_name: o.customer_email ? o.customer_email.split('@')[0] : 'Client',
      }));
      setRecentOrders(orders);

      const recentBlogRes = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const allArticles = [
        ...(recentArticlesRes.data || []).map((a: any) => ({
          ...a,
          category_name: a.categories?.name || 'Éditorial',
        })),
        ...(recentBlogRes.data || []).map((b: any) => ({
          ...b,
          category_name: 'Blog',
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentArticles(allArticles);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
          <p className="text-sm uppercase tracking-[0.2em] text-[#9A9A8A]">
            Chargement de l’administration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="border border-[#0A0A0A]/10 bg-white p-6 md:p-8">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#C9A84C]">
            Synthèse éditoriale
          </p>
          <h2 className="mt-3 max-w-2xl font-serif text-[2.2rem] leading-[0.95] tracking-[-0.03em] text-[#0A0A0A] md:text-[3rem]">
            Une lecture claire du magazine, des membres et des revenus.
          </h2>
          <p className="mt-5 max-w-2xl text-[0.96rem] leading-8 text-[#9A9A8A]">
            L’administration AFRIKHER doit rester sobre, précise et pilotable. Cette vue met en avant
            les signaux vraiment utiles pour la rédaction, la boutique et l’écosystème de marque.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <EditorialMetric
            label="Articles"
            value={stats?.totalArticles || 0}
            detail={`${stats?.publishedArticles || 0} publiés`}
            link="/admin/articles"
          />
          <EditorialMetric
            label="Commandes"
            value={stats?.totalOrders || 0}
            detail="Suivi boutique"
            link="/admin/boutique/commandes"
          />
          <EditorialMetric
            label="Lecteurs"
            value={stats?.totalReaders || 0}
            detail="Communauté inscrite"
            link="/admin/utilisateurs/lecteurs"
          />
          <EditorialMetric
            label="Partenaires"
            value={stats?.totalPartners || 0}
            detail={stats?.pendingPartners ? `${stats.pendingPartners} en attente` : 'Réseau stable'}
            link="/admin/utilisateurs/partenaires"
            accent={Boolean(stats?.pendingPartners)}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <SurfaceCard>
            <SectionLabel>Revenu du mois</SectionLabel>
            <p className="mt-3 font-serif text-[2.5rem] leading-none tracking-[-0.03em] text-[#0A0A0A]">
              {(stats?.revenueMonth || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </p>
            <p className="mt-3 text-sm leading-7 text-[#9A9A8A]">
              Encaissements confirmés sur {FULL_MONTH_NAMES_FR[new Date().getMonth()]} {new Date().getFullYear()}.
            </p>
          </SurfaceCard>

          <SurfaceCard dark>
            <SectionLabel dark>Total consolidé</SectionLabel>
            <p className="mt-3 font-serif text-[2.5rem] leading-none tracking-[-0.03em] text-[#F5F0E8]">
              {totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </p>
            <p className="mt-3 text-sm leading-7 text-[#F5F0E8]/58">
              {stats?.activeSubscribers || 0} abonnement{(stats?.activeSubscribers || 0) > 1 ? 's' : ''} actif
              {(stats?.activeSubscribers || 0) > 1 ? 's' : ''} soutiennent actuellement la marque.
            </p>
          </SurfaceCard>
        </div>

        <SurfaceCard>
          <div className="flex flex-col gap-3 border-b border-[#0A0A0A]/8 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel>Revenus</SectionLabel>
              <h3 className="mt-2 font-serif text-[1.7rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
                Six derniers mois
              </h3>
            </div>
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[#9A9A8A]">
              Lecture glissante des ventes
            </p>
          </div>

          <div className="mt-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barSize={34}>
                <CartesianGrid vertical={false} stroke="#E7DED0" strokeDasharray="2 6" />
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
                  tickFormatter={(value) => `${value}€`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(201,168,76,0.06)' }}
                  contentStyle={{
                    background: '#FBF8F2',
                    border: '1px solid rgba(10,10,10,0.08)',
                    borderRadius: 0,
                    boxShadow: 'none',
                    padding: '10px 12px',
                    color: '#0A0A0A',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`, 'Revenu']}
                />
                <Bar dataKey="revenue" fill="#C9A84C" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SurfaceCard>
          <CardHeader
            eyebrow="Éditorial"
            title="Publications récentes"
            link="/admin/articles"
            linkLabel="Voir l’ensemble"
          />

          {recentArticles.length === 0 ? (
            <EmptyBlock
              text="Aucun article n’a encore été publié ou préparé."
              actionLabel="Créer un article"
              actionTo="/admin/articles/new"
            />
          ) : (
            <div className="mt-6 divide-y divide-[#0A0A0A]/8">
              {recentArticles.map((article) => (
                <div key={article.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-[1.3rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
                      {article.title}
                    </p>
                    <p className="mt-2 text-sm text-[#9A9A8A]">
                      {article.category_name} ·{' '}
                      {new Date(article.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <StatusBadge status={article.status} />
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard>
          <CardHeader
            eyebrow="Boutique"
            title="Dernières commandes"
            link="/admin/boutique/commandes"
            linkLabel="Voir l’ensemble"
          />

          {recentOrders.length === 0 ? (
            <EmptyBlock text="Aucune commande n’a encore été enregistrée." />
          ) : (
            <div className="mt-6 divide-y divide-[#0A0A0A]/8">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-serif text-[1.25rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
                      {order.customer_name}
                    </p>
                    <p className="mt-2 text-sm text-[#9A9A8A]">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} />
                    <p className="font-serif text-[1.2rem] leading-none text-[#0A0A0A]">
                      {parseFloat(String(order.total)).toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      €
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </section>
    </div>
  );
}

function SurfaceCard({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={
        dark
          ? 'border border-[#C9A84C]/18 bg-[#0A0A0A] p-6 md:p-7'
          : 'border border-[#0A0A0A]/10 bg-white p-6 md:p-7'
      }
    >
      {children}
    </div>
  );
}

function SectionLabel({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <p
      className={
        dark
          ? 'text-[0.68rem] uppercase tracking-[0.26em] text-[#C9A84C]'
          : 'text-[0.68rem] uppercase tracking-[0.26em] text-[#9A9A8A]'
      }
    >
      {children}
    </p>
  );
}

function EditorialMetric({
  label,
  value,
  detail,
  link,
  accent = false,
}: {
  label: string;
  value: number;
  detail: string;
  link: string;
  accent?: boolean;
}) {
  return (
    <Link
      to={link}
      className="border border-[#0A0A0A]/10 bg-white p-5 transition-colors hover:border-[#C9A84C]/35"
    >
      <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
        {label}
      </p>
      <p className="mt-3 font-serif text-[2.3rem] leading-none tracking-[-0.03em] text-[#0A0A0A]">
        {value}
      </p>
      <div className="mt-4 border-t border-[#0A0A0A]/8 pt-4">
        <p className={accent ? 'text-sm leading-6 text-[#8A6E2F]' : 'text-sm leading-6 text-[#9A9A8A]'}>
          {detail}
        </p>
      </div>
    </Link>
  );
}

function CardHeader({
  eyebrow,
  title,
  link,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  link: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#0A0A0A]/8 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <SectionLabel>{eyebrow}</SectionLabel>
        <h3 className="mt-2 font-serif text-[1.7rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
          {title}
        </h3>
      </div>

      <Link
        to={link}
        className="text-[0.68rem] uppercase tracking-[0.22em] text-[#C9A84C] transition-opacity hover:opacity-75"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

function EmptyBlock({
  text,
  actionLabel,
  actionTo,
}: {
  text: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="py-12 text-center">
      <p className="mx-auto max-w-md text-sm leading-7 text-[#9A9A8A]">{text}</p>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="mt-5 inline-flex border-b border-[#C9A84C] pb-1 text-[0.68rem] uppercase tracking-[0.22em] text-[#C9A84C] transition-opacity hover:opacity-75"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] || {
    bg: 'bg-[#F5F0E8]',
    text: 'text-[#9A9A8A]',
    border: 'border-[#0A0A0A]/8',
  };
  const label = statusLabels[status] || status;

  return (
    <span
      className={`inline-flex border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.2em] ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {label}
    </span>
  );
}
