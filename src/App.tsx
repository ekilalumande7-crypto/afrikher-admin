import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import ArticlesList from './pages/ArticlesList';
import ArticleEditor from './pages/ArticleEditor';
import ProductsList from './pages/ProductsList';
import ProductEditor from './pages/ProductEditor';
import UsersList from './pages/UsersList';
import CMSConfig from './pages/CMSConfig';
import CMSAccueil from './pages/CMSAccueil';
import CMSMagazine from './pages/CMSMagazine';
import CMSRubriques from './pages/CMSRubriques';
import CMSQuiSommesNous from './pages/CMSQuiSommesNous';

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
            <Route index element={<Dashboard />} />

            {/* Éditorial */}
            <Route path="articles" element={<ArticlesList />} />
            <Route path="articles/new" element={<ArticleEditor />} />
            <Route path="articles/:id" element={<ArticleEditor />} />
            <Route path="categories" element={<Placeholder title="Gestion des Catégories" />} />
            <Route path="galerie" element={<Placeholder title="Galerie Photos" />} />
            <Route path="blog" element={<Placeholder title="Gestion du Blog" />} />

            {/* Boutique */}
            <Route path="boutique/produits" element={<ProductsList />} />
            <Route path="boutique/produits/new" element={<ProductEditor />} />
            <Route path="boutique/produits/:id" element={<ProductEditor />} />
            <Route path="boutique/commandes" element={<Placeholder title="Gestion des Commandes" />} />

            {/* Utilisateurs */}
            <Route path="utilisateurs/lecteurs" element={<UsersList pageType="readers" />} />
            <Route path="utilisateurs/partenaires" element={<UsersList pageType="partners" />} />
            <Route path="utilisateurs/abonnements" element={<Placeholder title="Gestion des Abonnements" />} />

            {/* Pages du site (CMS) */}
            <Route path="cms/accueil" element={<CMSAccueil />} />
            <Route path="cms/magazine" element={<CMSMagazine />} />
            <Route path="cms/rubriques" element={<CMSRubriques />} />
            <Route path="cms/qui-sommes-nous" element={<CMSQuiSommesNous />} />
            <Route path="cms/abonnement" element={<Placeholder title="Page Abonnement" />} />
            <Route path="cms/contact" element={<Placeholder title="Page Contact" />} />
            <Route path="cms/partenaires" element={<Placeholder title="Page Partenaires" />} />

            {/* CMS & Design */}
            <Route path="cms/config" element={<CMSConfig />} />
            <Route path="cms/design" element={<Placeholder title="Design & Thème" />} />

            {/* Marketing */}
            <Route path="marketing/newsletter" element={<Placeholder title="Newsletter Marketing" />} />
            <Route path="marketing/publicites" element={<Placeholder title="Gestion des Publicités" />} />

            {/* Paramètres */}
            <Route path="parametres/notifications" element={<Placeholder title="Paramètres de Notifications" />} />
          </Route>

          <Route path="*" element={<div className="h-screen flex items-center justify-center font-serif text-4xl text-gold">404 - Page non trouvée</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
