import React from 'react';
import { Bell, Search, User, ChevronRight, MessageSquare, Share2, MoreVertical, Plus } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export default function TopBar() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const pageTitle = pathnames[pathnames.length - 1] || 'Dashboard';

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-serif font-bold text-dark capitalize tracking-tight">{pageTitle}</h2>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative hidden md:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all w-64"
          />
        </div>

        <div className="flex items-center space-x-2 border-x border-gray-100 px-6">
          <button className="p-2 text-gray-400 hover:text-gold transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-gold rounded-full border-2 border-white" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/admin/articles/new" className="flex items-center px-5 py-2.5 text-xs font-bold text-white bg-dark rounded-xl hover:bg-charcoal transition-all shadow-lg shadow-dark/10">
            <Plus size={16} className="mr-2 text-gold" />
            Nouvel Article
          </Link>
          <button className="p-2.5 text-gray-300 hover:text-dark transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
