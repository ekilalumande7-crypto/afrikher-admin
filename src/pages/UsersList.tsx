import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit2, Trash2, CheckCircle, XCircle, Shield, Calendar, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
}

export default function UsersList() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch profiles from Supabase
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_blocked, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw new Error(profilesError.message);
      }

      // Fetch auth users list via admin API if available
      // For now, use profiles table which has all we need
      // We'll get emails from auth.users via a server-side API call
      const usersWithEmail: UserProfile[] = (profiles || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: '', // Will be populated below
        role: p.role || 'reader',
        is_blocked: p.is_blocked || false,
        created_at: p.created_at,
      }));

      // Try to get emails via the client API
      // Since anon key can't list auth.users, we fetch from the Next.js API
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${apiBase}/admin/users`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.users) {
            // Merge emails from auth users
            const emailMap = new Map(data.users.map((u: any) => [u.id, u.email]));
            usersWithEmail.forEach(u => {
              if (emailMap.has(u.id)) {
                u.email = emailMap.get(u.id) as string;
              }
            });
          }
        }
      } catch {
        // If the API endpoint doesn't exist yet, that's fine
        // We'll still show the profiles without emails
      }

      setUsers(usersWithEmail);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
      // Fallback: try direct profiles query
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) {
        setUsers(data.map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          email: '',
          role: p.role || 'reader',
          is_blocked: p.is_blocked || false,
          created_at: p.created_at,
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentlyBlocked })
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: !currentlyBlocked } : u));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-dark">Utilisateurs</h1>
          <p className="text-gray-400 text-sm mt-1">
            {users.length} utilisateur{users.length !== 1 ? 's' : ''} inscrit{users.length !== 1 ? 's' : ''} — données en temps réel depuis Supabase.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center px-6 py-3 bg-dark text-white rounded-2xl hover:bg-charcoal transition-all font-bold tracking-wide shadow-lg shadow-dark/10"
        >
          <RefreshCw size={18} className="mr-2 text-gold" />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center space-x-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-6 py-4 bg-gray-50 text-dark rounded-2xl text-sm font-bold border border-transparent hover:border-gold/20 outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="all">Tous les rôles</option>
            <option value="reader">Lecteurs</option>
            <option value="admin">Admins</option>
            <option value="partner">Partenaires</option>
            <option value="pending_partner">En attente</option>
          </select>
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
                <td colSpan={6} className="px-10 py-20 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-10 h-10 border-4 border-gold border-t-transparent animate-spin rounded-full" />
                    <span className="text-gold font-serif text-lg">Chargement des utilisateurs...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-10 py-20 text-center text-gray-400">
                  {searchQuery || roleFilter !== 'all' ? 'Aucun utilisateur ne correspond aux critères.' : 'Aucun utilisateur inscrit.'}
                </td>
              </tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-10 py-5">
                  <input type="checkbox" className="rounded-md border-gray-200 text-gold focus:ring-gold w-4 h-4" />
                </td>
                <td className="px-10 py-5">
                  <div className="flex items-center space-x-5">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-bold">
                      {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark group-hover:text-gold transition-colors">
                        {user.full_name || 'Sans nom'}
                      </p>
                      <p className="text-[10px] text-gray-400 lowercase tracking-wider mt-1">
                        {user.email || user.id.slice(0, 8) + '...'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-5">
                  <div className="flex items-center space-x-2">
                    <Shield size={14} className={cn(
                      user.role === 'admin' ? "text-red-500" :
                      user.role === 'partner' ? "text-gold" :
                      user.role === 'pending_partner' ? "text-orange-400" : "text-gray-400"
                    )} />
                    <span className="text-xs font-bold text-gray-500 capitalize">
                      {user.role === 'pending_partner' ? 'En attente' : user.role}
                    </span>
                  </div>
                </td>
                <td className="px-10 py-5">
                  <span className={cn(
                    "text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider",
                    user.is_blocked ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                  )}>
                    {user.is_blocked ? 'Bloqué' : 'Actif'}
                  </span>
                </td>
                <td className="px-10 py-5">
                  <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
                    <Calendar size={14} />
                    <span>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                </td>
                <td className="px-10 py-5 text-right">
                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleBlock(user.id, user.is_blocked)}
                      className={cn(
                        "p-2.5 bg-white rounded-xl shadow-sm transition-all text-sm font-bold px-4",
                        user.is_blocked
                          ? "text-green-600 hover:bg-green-50"
                          : "text-red-500 hover:bg-red-50"
                      )}
                      title={user.is_blocked ? 'Débloquer' : 'Bloquer'}
                    >
                      {user.is_blocked ? 'Débloquer' : 'Bloquer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-8 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-medium">
            {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} affiché{filteredUsers.length !== 1 ? 's' : ''}
            {(searchQuery || roleFilter !== 'all') ? ` (sur ${users.length} total)` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
