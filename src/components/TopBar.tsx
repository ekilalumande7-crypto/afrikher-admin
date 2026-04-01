import React from 'react';
import { Bell, Search, Plus, MoreVertical } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  admin: 'Tableau de bord',
  articles: 'Contenus',
  categories: 'Catégories',
  galerie: 'Galerie',
  produits: 'Produits',
  commandes: 'Commandes',
  lecteurs: 'Lecteurs',
  partenaires: 'Partenaires',
  abonnements: 'Abonnements',
  config: 'Configuration',
  design: 'Design & Thème',
  newsletter: 'Newsletter',
  publicites: 'Publicités',
  paiements: 'Paiements',
  notifications: 'Notifications',
  accueil: 'Accueil',
  magazine: 'Magazine',
  rubriques: 'Les Rubriques',
  'qui-sommes-nous': 'Qui sommes-nous',
  abonnement: 'Abonnement',
  contact: 'Contact',
};

export default function TopBar() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const lastSegment = pathnames[pathnames.length - 1] || 'admin';
  const pageTitle = pageTitles[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <h2 className="text-lg font-semibold text-slate-900">{pageTitle}</h2>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all w-56"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* New Article Button */}
        <Link
          to="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nouvel Article</span>
        </Link>

        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50">
          <MoreVertical size={18} />
        </button>
      </div>
    </header>
  );
}
