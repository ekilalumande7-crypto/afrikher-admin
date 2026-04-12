import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const menuGroups = [
  {
    title: 'Général',
    items: [{ name: 'Tableau de bord', path: '/admin' }],
  },
  {
    title: 'Pages du site',
    items: [
      { name: 'Accueil', path: '/admin/cms/accueil' },
      { name: 'Magazine', path: '/admin/cms/magazine' },
      { name: 'Les Rubriques', path: '/admin/cms/rubriques' },
      { name: 'Qui sommes-nous', path: '/admin/cms/qui-sommes-nous' },
      { name: 'Abonnement', path: '/admin/cms/abonnement' },
      { name: 'Contact', path: '/admin/cms/contact' },
      { name: 'Partenaires', path: '/admin/cms/partenaires' },
      { name: 'Mentions l\u00e9gales', path: '/admin/cms/legal' },
    ],
  },
  {
    title: '\u00c9ditorial',
    items: [
      { name: 'Contenus', path: '/admin/articles' },
      { name: 'Catégories', path: '/admin/categories' },
      { name: 'Galerie', path: '/admin/galerie' },
    ],
  },
  {
    title: 'Boutique',
    items: [
      { name: 'Produits', path: '/admin/boutique/produits' },
      { name: 'Commandes', path: '/admin/boutique/commandes' },
    ],
  },
  {
    title: 'Utilisateurs',
    items: [
      { name: 'Lecteurs', path: '/admin/utilisateurs/lecteurs' },
      { name: 'Gestion Partenaires', path: '/admin/utilisateurs/partenaires' },
      { name: 'Gestion Abonnés', path: '/admin/utilisateurs/abonnements' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { name: 'Newsletter', path: '/admin/marketing/newsletter' },
      { name: 'Publicités', path: '/admin/marketing/publicites' },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { name: 'Configuration', path: '/admin/cms/config' },
      { name: 'Paiements', path: '/admin/parametres/paiements' },
      { name: 'Notifications', path: '/admin/parametres/notifications' },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = user?.full_name || 'Administration';
  const displayEmail = user?.email || 'backoffice@afrikher.com';

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/45 transition-opacity md:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[18.5rem] flex-col bg-[#0A0A0A] text-[#F5F0E8] transition-transform duration-300 md:sticky md:top-0 md:z-20 md:h-screen md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="border-b border-white/10 px-6 pb-6 pt-7">
          <div className="flex items-start justify-between gap-4 md:block">
            <div>
              <NavLink
                to="/admin"
                end
                onClick={onClose}
                className="inline-block font-serif text-[1.9rem] tracking-[0.24em] text-[#C9A84C]"
              >
                AFRIKHER
              </NavLink>
              <p className="mt-4 text-[0.65rem] uppercase tracking-[0.28em] text-[#9A9A8A]">
                Back-office éditorial
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-[0.65rem] uppercase tracking-[0.22em] text-[#9A9A8A] transition-colors hover:text-[#C9A84C] md:hidden"
            >
              Fermer
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-6">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-8 last:mb-0">
              <p className="mb-3 text-[0.62rem] uppercase tracking-[0.28em] text-[#9A9A8A]">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'block border-l border-transparent py-2 pl-3 text-[0.92rem] transition-colors',
                        isActive
                          ? 'border-[#C9A84C] text-[#C9A84C]'
                          : 'text-[#F5F0E8]/72 hover:text-[#C9A84C]'
                      )
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-6 py-6">
          <div className="border border-[#C9A84C]/16 px-4 py-4">
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#9A9A8A]">
              Session
            </p>
            <p className="mt-3 font-serif text-[1.2rem] leading-none text-[#F5F0E8]">
              {displayName}
            </p>
            <p className="mt-2 text-sm text-[#F5F0E8]/56">{displayEmail}</p>

            <button
              onClick={handleLogout}
              className="mt-5 text-[0.68rem] uppercase tracking-[0.22em] text-[#C9A84C] transition-opacity hover:opacity-75"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
