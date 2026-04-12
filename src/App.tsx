import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/AdminLogin';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ArticlesList = lazy(() => import('./pages/ArticlesList'));
const ArticleEditor = lazy(() => import('./pages/ArticleEditor'));
const CategoriesList = lazy(() => import('./pages/CategoriesList'));
const GalleryList = lazy(() => import('./pages/GalleryList'));
const ProductsList = lazy(() => import('./pages/ProductsList'));
const ProductEditor = lazy(() => import('./pages/ProductEditor'));
const OrdersList = lazy(() => import('./pages/OrdersList'));
const UsersList = lazy(() => import('./pages/UsersList'));
const CMSConfig = lazy(() => import('./pages/CMSConfig'));
const CMSAccueil = lazy(() => import('./pages/CMSAccueil'));
const CMSMagazine = lazy(() => import('./pages/CMSMagazine'));
const CMSRubriques = lazy(() => import('./pages/CMSRubriques'));
const CMSQuiSommesNous = lazy(() => import('./pages/CMSQuiSommesNous'));
const CMSAbonnement = lazy(() => import('./pages/CMSAbonnement'));
const CMSContact = lazy(() => import('./pages/CMSContact'));
const CMSPartenaires = lazy(() => import('./pages/CMSPartenaires'));
const CMSLegal = lazy(() => import('./pages/CMSLegal'));
const SettingsPaiements = lazy(() => import('./pages/SettingsPaiements'));

// Placeholder for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="bg-white p-20 rounded-[32px] border border-gray-50 shadow-sm text-center flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
    <div className="w-24 h-24 bg-cream rounded-full flex items-center justify-center text-gold">
      <Settings size={48} className="animate-spin-slow" />
    </div>
    <div>
      <h2 className="text-3xl font-serif font-bold text-dark mb-3">{title}</h2>
      <p className="text-gray-400 max-w-md mx-auto">Cette section est en cours de développement. Nous travaillons dur pour vous offrir la meilleure expérience possible.</p>
    </div>
    <Link to="/admin" className="px-8 py-3 bg-dark text-white rounded-2xl font-bold text-sm hover:bg-charcoal transition-all shadow-lg shadow-dark/10">
      Retour au tableau de bord
    </Link>
  </div>
);

function RouteLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-[#C9A84C] border-t-transparent" />
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#9A9A8A]">Chargement de l’espace admin</p>
      </div>
    </div>
  );
}

function withRouteSuspense(node: React.ReactNode) {
  return <Suspense fallback={<RouteLoader />}>{node}</Suspense>;
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C9A84C] border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/" element={<Navigate to="/admin" replace />} />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={withRouteSuspense(<Dashboard />)} />

            {/* Éditorial */}
            <Route path="articles" element={withRouteSuspense(<ArticlesList />)} />
            <Route path="articles/new" element={withRouteSuspense(<ArticleEditor />)} />
            <Route path="articles/:id" element={withRouteSuspense(<ArticleEditor />)} />
            <Route path="categories" element={withRouteSuspense(<CategoriesList />)} />
            <Route path="galerie" element={withRouteSuspense(<GalleryList />)} />
            {/* Blog fusionné dans Articles (onglets Éditorial / Blog) */}

            {/* Boutique */}
            <Route path="boutique/produits" element={withRouteSuspense(<ProductsList />)} />
            <Route path="boutique/produits/new" element={withRouteSuspense(<ProductEditor />)} />
            <Route path="boutique/produits/:id" element={withRouteSuspense(<ProductEditor />)} />
            <Route path="boutique/commandes" element={withRouteSuspense(<OrdersList />)} />

            {/* Utilisateurs */}
            <Route path="utilisateurs/lecteurs" element={withRouteSuspense(<UsersList pageType="readers" />)} />
            <Route path="utilisateurs/partenaires" element={withRouteSuspense(<UsersList pageType="partners" />)} />
            <Route path="utilisateurs/abonnements" element={<Placeholder title="Gestion des Abonnements" />} />

            {/* Pages du site (CMS) */}
            <Route path="cms/accueil" element={withRouteSuspense(<CMSAccueil />)} />
            <Route path="cms/magazine" element={withRouteSuspense(<CMSMagazine />)} />
            <Route path="cms/rubriques" element={withRouteSuspense(<CMSRubriques />)} />
            <Route path="cms/qui-sommes-nous" element={withRouteSuspense(<CMSQuiSommesNous />)} />
            <Route path="cms/abonnement" element={withRouteSuspense(<CMSAbonnement />)} />
            <Route path="cms/contact" element={withRouteSuspense(<CMSContact />)} />
            <Route path="cms/partenaires" element={withRouteSuspense(<CMSPartenaires />)} />
            <Route path="cms/legal" element={withRouteSuspense(<CMSLegal />)} />

            {/* CMS & Design */}
            <Route path="cms/config" element={withRouteSuspense(<CMSConfig />)} />
            <Route path="cms/design" element={<Placeholder title="Design & Thème" />} />

            {/* Marketing */}
            <Route path="marketing/newsletter" element={<Placeholder title="Newsletter Marketing" />} />
            <Route path="marketing/publicites" element={<Placeholder title="Gestion des Publicités" />} />

            {/* Paramètres */}
            <Route path="parametres/paiements" element={withRouteSuspense(<SettingsPaiements />)} />
            <Route path="parametres/notifications" element={<Placeholder title="Paramètres de Notifications" />} />
          </Route>

          <Route path="*" element={<div className="h-screen flex items-center justify-center font-serif text-4xl text-gold">404 - Page non trouvée</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
