import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Eye, Edit2, Trash2, CheckCircle, XCircle, User, Shield, Mail, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for users
    const mockUsers = [
      { id: '1', name: 'Fatou Diallo', email: 'fatou@example.com', role: 'admin', status: 'active', joined: '2024-01-15' },
      { id: '2', name: 'Moussa Traoré', email: 'moussa@example.com', role: 'partner', status: 'active', joined: '2024-02-10' },
      { id: '3', name: 'Awa Koné', email: 'awa@example.com', role: 'reader', status: 'active', joined: '2024-03-05' },
      { id: '4', name: 'Koffi Mensah', email: 'koffi@example.com', role: 'reader', status: 'inactive', joined: '2024-03-12' },
      { id: '5', name: 'Zainab Bello', email: 'zainab@example.com', role: 'partner', status: 'active', joined: '2024-03-20' },
    ];
    
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-dark">Utilisateurs</h1>
          <p className="text-gray-400 text-sm mt-1">Gérez les comptes, les rôles et les permissions.</p>
        </div>
        <button className="flex items-center px-8 py-3.5 bg-dark text-white rounded-2xl hover:bg-charcoal transition-all font-bold tracking-wide shadow-lg shadow-dark/10">
          <Plus size={20} className="mr-2 text-gold" />
          Nouvel utilisateur
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center space-x-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, email..." 
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
          <button className="flex items-center px-6 py-4 bg-gray-50 text-dark rounded-2xl hover:bg-cream transition-all text-sm font-bold border border-transparent hover:border-gold/20">
            <Filter size={18} className="mr-2 text-gold" />
            Filtres
          </button>
        </div>
        <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-2xl">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Actions:</span>
          <button className="p-2.5 bg-white text-gray-400 hover:text-gold rounded-xl shadow-sm transition-all" title="Activer"><CheckCircle size={18} /></button>
          <button className="p-2.5 bg-white text-gray-400 hover:text-gold rounded-xl shadow-sm transition-all" title="Désactiver"><XCircle size={18} /></button>
          <button className="p-2.5 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm transition-all" title="Supprimer"><Trash2 size={18} /></button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-[10px] uppercase tracking-widest font-bold text-gray-400">
            <tr>
              <th className="px-10 py-6 w-12">
                <input type="checkbox" className="rounded-md border-gray-200 text-gold focus:ring-gold w-4 h-4" />
              </th>
              <th className="px-10 py-6">Utilisateur</th>
              <th className="px-10 py-6">Rôle</th>
              <th className="px-10 py-6">Statut</th>
              <th className="px-10 py-6">Date d'inscription</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-10 py-20 text-center text-gold font-serif text-2xl">Chargement des utilisateurs...</td>
              </tr>
            ) : users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-10 py-5">
                  <input type="checkbox" className="rounded-md border-gray-200 text-gold focus:ring-gold w-4 h-4" />
                </td>
                <td className="px-10 py-5">
                  <div className="flex items-center space-x-5">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark group-hover:text-gold transition-colors">{user.name}</p>
                      <p className="text-[10px] text-gray-400 lowercase tracking-wider mt-1">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-5">
                  <div className="flex items-center space-x-2">
                    <Shield size={14} className={cn(
                      user.role === 'admin' ? "text-red-500" : 
                      user.role === 'partner' ? "text-gold" : "text-gray-400"
                    )} />
                    <span className="text-xs font-bold text-gray-500 capitalize">{user.role}</span>
                  </div>
                </td>
                <td className="px-10 py-5">
                  <span className={cn(
                    "text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider",
                    user.status === 'active' ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                  )}>
                    {user.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-10 py-5">
                  <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
                    <Calendar size={14} />
                    <span>{user.joined}</span>
                  </div>
                </td>
                <td className="px-10 py-5 text-right">
                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2.5 bg-white text-gray-400 hover:text-gold rounded-xl shadow-sm transition-all" title="Voir"><Eye size={18} /></button>
                    <button className="p-2.5 bg-white text-gray-400 hover:text-gold rounded-xl shadow-sm transition-all" title="Modifier"><Edit2 size={18} /></button>
                    <button className="p-2.5 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm transition-all" title="Supprimer"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-8 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-medium">Affichage de 1-10 sur 1,240 utilisateurs</p>
          <div className="flex space-x-2">
            <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-dark transition-colors">Précédent</button>
            <button className="w-10 h-10 flex items-center justify-center text-xs font-bold bg-dark text-gold rounded-xl shadow-lg shadow-dark/10">1</button>
            <button className="w-10 h-10 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-dark transition-colors">2</button>
            <button className="w-10 h-10 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-dark transition-colors">3</button>
            <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-dark transition-colors">Suivant</button>
          </div>
        </div>
      </div>
    </div>
  );
}
