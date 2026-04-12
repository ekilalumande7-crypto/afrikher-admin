import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const pageMeta: Record<
  string,
  { title: string; subtitle: string; actionLabel?: string; actionTo?: string; hideHeader?: boolean }
> = {
  admin: {
    title: 'Tableau de bord',
    subtitle: "Vue d'ensemble de la rédaction, de la boutique et de l'écosystème AFRIKHER.",
    actionLabel: 'Nouvel article',
    actionTo: '/admin/articles/new',
  },
  articles: {
    title: 'Contenus',
    subtitle: 'Pilotez les publications, les brouillons et la cadence éditoriale.',
    actionLabel: 'Nouvel article',
    actionTo: '/admin/articles/new',
  },
  categories: {
    title: 'Catégories',
    subtitle: 'Structurez les univers éditoriaux avec une hiérarchie claire.',
  },
  galerie: {
    title: 'Galerie',
    subtitle: 'Centralisez les visuels qui portent l’image de la marque.',
  },
  produits: {
    title: 'Produits',
    subtitle: 'Orchestrez les références boutique et leur mise en valeur.',
  },
  commandes: {
    title: 'Commandes',
    subtitle: 'Suivez les achats, paiements et livraisons avec précision.',
  },
  lecteurs: {
    title: 'Lecteurs',
    subtitle: 'Gardez une lecture claire de votre communauté et de ses accès.',
  },
  partenaires: {
    title: 'Partenaires',
    subtitle: "Développez l'écosystème AFRIKHER avec cohérence et exigence.",
  },
  abonnements: {
    title: 'Abonnements',
    subtitle: 'Supervisez les membres actifs et le revenu récurrent.',
  },
  config: {
    title: 'Configuration',
    subtitle: "Affinez les paramètres qui soutiennent l'identité du site.",
  },
  newsletter: {
    title: 'Newsletter',
    subtitle: 'Préparez des prises de parole soignées et régulières.',
  },
  paiements: {
    title: 'Paiements',
    subtitle: 'Sécurisez les flux transactionnels et les intégrations.',
    hideHeader: true,
  },
  email: {
    title: 'Emails',
    subtitle: 'Configurez Brevo pour les emails transactionnels et les newsletters.',
    hideHeader: true,
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Gérez les alertes et messages utiles au back-office.',
  },
  accueil: {
    title: 'Accueil',
    subtitle: "Pilotez la première impression éditoriale de l'univers AFRIKHER.",
  },
  magazine: {
    title: 'Magazine',
    subtitle: 'Orchestrez les éléments majeurs de la section magazine.',
    hideHeader: true,
  },
  rubriques: {
    title: 'Les Rubriques',
    subtitle: 'Cadrez les rubriques dans une narration cohérente.',
  },
  'qui-sommes-nous': {
    title: 'Qui sommes-nous',
    subtitle: "Alignez la page institutionnelle avec la promesse de marque.",
  },
  abonnement: {
    title: 'Abonnement',
    subtitle: "Affinez l'offre premium et sa mise en scène.",
  },
  contact: {
    title: 'Contact',
    subtitle: 'Structurez les prises de contact et les signaux de confiance.',
  },
};

interface TopBarProps {
  onOpenMenu: () => void;
}

export default function TopBar({ onOpenMenu }: TopBarProps) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);
  const lastSegment = pathnames[pathnames.length - 1] || 'admin';
  const meta = pageMeta[lastSegment] || {
    title: lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1),
    subtitle: "Section d'administration AFRIKHER.",
  };

  if (meta.hideHeader) {
    return (
      <header className="sticky top-0 z-10 border-b border-[#0A0A0A]/10 bg-[#F5F0E8]/95 backdrop-blur md:hidden">
        <div className="px-5 py-4">
          <button
            onClick={onOpenMenu}
            className="inline-block text-[0.65rem] uppercase tracking-[0.22em] text-[#9A9A8A] transition-colors hover:text-[#C9A84C]"
          >
            Navigation
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 border-b border-[#0A0A0A]/10 bg-[#F5F0E8]/95 backdrop-blur">
      <div className="flex flex-col gap-4 px-5 py-5 md:px-8 lg:flex-row lg:items-end lg:justify-between xl:px-10">
        <div className="min-w-0">
          <button
            onClick={onOpenMenu}
            className="mb-3 inline-block text-[0.65rem] uppercase tracking-[0.22em] text-[#9A9A8A] transition-colors hover:text-[#C9A84C] md:hidden"
          >
            Navigation
          </button>

          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-[#C9A84C]">
            Administration
          </p>
          <h1 className="mt-2 font-serif text-[2rem] leading-none tracking-[-0.03em] text-[#0A0A0A] md:text-[2.6rem]">
            {meta.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9A9A8A] md:text-[0.96rem]">
            {meta.subtitle}
          </p>
        </div>

        {meta.actionLabel && meta.actionTo ? (
          <Link
            to={meta.actionTo}
            className="inline-flex items-center justify-center border border-[#0A0A0A] bg-[#0A0A0A] px-6 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#F5F0E8] transition-colors hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
          >
            {meta.actionLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
