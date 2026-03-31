import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import ArticlesList from './pages/ArticlesList';
import ArticleEditor from './pages/ArticleEditor';
import ProductsList from './pages/ProductsList';
import ProductEditor from './pages/ProductEditor';
import UsersList from './pages/UsersList';
import CMSConfig from './pages/CMSConfig';

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          
          {/* Éditorial */}
          <Route path="articles" element={<ArticlesList />} />
          <Route path="articles/new" element={<ArticleEditor />} />
          <Route path="articles/:id" element={<ArticleEditor />} />
          <Route path="categories" element={<Placeholder title="Gestion des Catégories" />} />
          
          {/* Boutique */}
          <Route path="boutique/produits" element={<ProductsList />} />
          <Route path="boutique/produits/new" element={<ProductEditor />} />
          <Route path="boutique/produits/:id" element={<ProductEditor />} />
          <Route path="boutique/commandes" element={<Placeholder title="Gestion des Commandes" />} />
          
          {/* Utilisateurs */}
          <Route path="utilisateurs/lecteurs" element={<UsersList />} />
          <Route path="utilisateurs/partenaires" element={<UsersList />} />
          <Route path="utilisateurs/abonnements" element={<Placeholder title="Gestion des Abonnements" />} />
          
          {/* CMS */}
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
  );
}
