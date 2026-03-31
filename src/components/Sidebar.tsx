import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Tags, 
  ShoppingBag, 
  ShoppingCart, 
  Users, 
  Handshake, 
  CreditCard, 
  Settings, 
  Palette, 
  Mail, 
  Megaphone, 
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  User,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const menuGroups = [
  {
    title: "Général",
    items: [
      { name: "Tableau de bord", path: "/admin", icon: LayoutDashboard },
    ]
  },
  {
    title: "Éditorial",
    items: [
      { name: "Articles", path: "/admin/articles", icon: FileText },
      { name: "Catégories", path: "/admin/categories", icon: Tags },
    ]
  },
  {
    title: "Boutique",
    items: [
      { name: "Produits", path: "/admin/boutique/produits", icon: ShoppingBag },
      { name: "Commandes", path: "/admin/boutique/commandes", icon: ShoppingCart },
    ]
  },
  {
    title: "Utilisateurs",
    items: [
      { name: "Lecteurs", path: "/admin/utilisateurs/lecteurs", icon: Users },
      { name: "Partenaires", path: "/admin/utilisateurs/partenaires", icon: Handshake },
      { name: "Abonnements", path: "/admin/utilisateurs/abonnements", icon: CreditCard },
    ]
  },
  {
    title: "Contenu du site (CMS)",
    items: [
      { name: "Configuration", path: "/admin/cms/config", icon: Settings },
      { name: "Design & Thème", path: "/admin/cms/design", icon: Palette },
    ]
  },
  {
    title: "Marketing",
    items: [
      { name: "Newsletter", path: "/admin/marketing/newsletter", icon: Mail },
      { name: "Publicités", path: "/admin/marketing/publicites", icon: Megaphone },
    ]
  },
  {
    title: "Paramètres",
    items: [
      { name: "Notifications", path: "/admin/parametres/notifications", icon: Bell },
    ]
  }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className={cn(
      "h-screen bg-dark text-white flex flex-col transition-all duration-300 border-r border-charcoal sticky top-0 z-20",
      collapsed ? "w-20" : "w-72"
    )}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-dark font-serif text-xl font-bold">
            A
          </div>
          {!collapsed && <span className="text-xl font-serif font-bold text-white tracking-tight">AFRIKHER</span>}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-charcoal rounded-lg transition-colors text-gray-500"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-6">
            {!collapsed && (
              <h3 className="px-8 text-[11px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3">
                {group.title}
              </h3>
            )}
            <ul>
              {group.items.map((item) => (
                <li key={item.path} className="relative">
                  <NavLink
                    to={item.path}
                    end={item.path === '/admin'}
                    className={({ isActive }) => cn(
                      "flex items-center px-8 py-3 text-sm transition-all group mb-1",
                      isActive 
                        ? "text-gold bg-gold/5 font-bold" 
                        : "text-gray-400 hover:text-white hover:bg-charcoal/30"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold rounded-r-full shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                        )}
                        <item.icon size={20} className={cn("shrink-0", isActive ? "text-gold" : "text-gray-500 group-hover:text-gray-300")} />
                        {!collapsed && <span className="ml-3 font-medium">{item.name}</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-charcoal">
        <div className="bg-charcoal/30 p-3 rounded-2xl flex items-center space-x-3 border border-charcoal/50">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold overflow-hidden">
            <User size={20} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email || 'Administrateur'}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-charcoal rounded-lg text-gray-500 hover:text-red-400 transition-colors"
              title="Se déconnecter"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
