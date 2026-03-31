import React, { useState, useEffect } from 'react';
import { Search, Shield, Calendar, RefreshCw, UserPlus, Check, X, Ban, Pause, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
  company_name?: string;
  sector?: string;
}

interface UsersListProps {
  pageType: 'readers' | 'partners';
}

export default function UsersList({ pageType }: UsersListProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', password: 'Afrikher2026!', company_name: '', sector: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isReadersPage = pageType === 'readers';
  const pageTitle = isReadersPage ? 'Lecteurs' : 'Partenaires';
  const pageDescription = isReadersPage
    ? 'Utilisateurs inscrits sur le site public.'
    : 'Partenaires inscrits sur le portail partenaire.';

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, role, is_blocked, created_at');

      if (isReadersPage) {
        query = query.eq('role', 'reader');
      } else {
        query = query.in('role', ['partner', 'pending_partner', 'rejected_partner']);
      }

      const { data: profiles, error: profilesError } = await query
        .order('created_at', { ascending: false });

      if (profilesError) throw new Error(profilesError.message);

      const usersWithEmail: UserProfile[] = (profiles || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: '',
        role: p.role || 'reader',
        is_blocked: p.is_blocked || false,
        created_at: p.created_at,
      }));

      // Try to get partner details
      if (!isReadersPage) {
        try {
          const ids = usersWithEmail.map(u => u.id);
          const { data: partnerDetails } = await supabase
            .from('partners')
            .select('id, company_name, sector')
            .in('id', ids);
          if (partnerDetails) {
            const partnerMap = new Map(partnerDetails.map((p: any) => [p.id, p]));
            usersWithEmail.forEach(u => {
              const pd = partnerMap.get(u.id);
              if (pd) {
                u.company_name = pd.company_name;
                u.sector = pd.sector;
              }
            });
          }
        } catch {}
      }

      // Get emails from API
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${apiBase}/admin/users`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.users) {
            const emailMap = new Map(data.users.map((u: any) => [u.id, u.email]));
            usersWithEmail.forEach(u => {
              if (emailMap.has(u.id)) u.email = emailMap.get(u.id) as string;
            });
          }
        }
      } catch {}

      setUsers(usersWithEmail);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [pageType]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && user.role === 'partner' && !user.is_blocked;
    if (statusFilter === 'pending') return matchesSearch && user.role === 'pending_partner';
    if (statusFilter === 'blocked') return matchesSearch && user.is_blocked;
    if (statusFilter === 'rejected') return matchesSearch && user.role === 'rejected_partner';
    return matchesSearch;
  });

  const handleAddPartner = async () => {
    if (!addForm.full_name || !addForm.email) {
      setAddError('Nom et email requis');
      return;
    }
    setAddLoading(true);
    setAddError('');

    try {
      // Create user via Supabase Auth admin API through the Next.js API
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/admin/partners/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la creation');
      }

      setShowAddModal(false);
      setAddForm({ full_name: '', email: '', password: 'Afrikher2026!', company_name: '', sector: '' });
      fetchUsers();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const validatePartner = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'partner' })
        .eq('id', userId);
      if (!error) {
        // Also update partners table
        await supabase.from('partners').upsert({
          id: userId,
          status: 'active',
          validated_at: new Date().toISOString(),
        });
        // Create notification
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Candidature approuvee',
          body: 'Felicitations ! Votre candidature partenaire AFRIKHER a ete validee. Vous avez maintenant acces a votre espace partenaire.',
          type: 'validation',
        });
        fetchUsers();
      }
    } catch {} finally { setActionLoading(null); }
  };

  const rejectPartner = async (userId: string) => {
    const reason = prompt('Raison du refus (optionnel):') || '';
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'rejected_partner' })
        .eq('id', userId);
      if (!error) {
        await supabase.from('partners').upsert({
          id: userId,
          status: 'rejected',
          rejection_reason: reason,
        });
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Candidature refusee',
          body: reason ? `Votre candidature a ete refusee. Raison : ${reason}` : 'Votre candidature partenaire AFRIKHER a ete refusee.',
          type: 'rejection',
        });
        fetchUsers();
      }
    } catch {} finally { setActionLoading(null); }
  };

  const toggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !currentlyBlocked })
        .eq('id', userId);
      if (!error) {
        if (!currentlyBlocked) {
          await supabase.from('partners').update({ status: 'blocked' }).eq('id', userId);
        } else {
          await supabase.from('partners').update({ status: 'active' }).eq('id', userId);
        }
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: !currentlyBlocked } : u));
      }
    } catch {} finally { setActionLoading(null); }
  };

  const getRoleBadge = (role: string, isBlocked: boolean) => {
    if (isBlocked) return { label: 'Bloque', className: 'bg-red-50 text-red-600' };
    switch (role) {
      case 'partner': return { label: 'Actif', className: 'bg-green-50 text-green-600' };
      case 'pending_partner': return { label: 'En attente', className: 'bg-orange-50 text-orange-500' };
      case 'rejected_partner': return { label: 'Refuse', className: 'bg-red-50 text-red-500' };
      default: return { label: role, className: 'bg-gray-50 text-gray-500' };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-dark">{pageTitle}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {users.length} {pageTitle.toLowerCase()} — {pageDescription}
          </p>
        </div>
        <div className="flex gap-3">
          {!isReadersPage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-6 py-3 bg-gold text-dark rounded-2xl hover:bg-gold/90 transition-all font-bold tracking-wide shadow-lg shadow-gold/10"
            >
              <UserPlus size={18} className="mr-2" />
              Ajouter
            </button>
          )}
          <button
            onClick={fetchUsers}
            className="flex items-center px-6 py-3 bg-dark text-white rounded-2xl hover:bg-charcoal transition-all font-bold tracking-wide shadow-lg shadow-dark/10"
          >
            <RefreshCw size={18} className="mr-2 text-gold" />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center space-x-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
          {!isReadersPage && (
            <div className="flex items-center space-x-2">
              {[
                { key: 'all', label: 'Tous', count: users.length },
                { key: 'active', label: 'Actifs', count: users.filter(u => u.role === 'partner' && !u.is_blocked).length },
                { key: 'pending', label: 'En attente', count: users.filter(u => u.role === 'pending_partner').length },
                { key: 'blocked', label: 'Bloques', count: users.filter(u => u.is_blocked).length },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg font-bold transition-all",
                    statusFilter === f.key
                      ? "bg-gold/20 text-gold"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  )}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-[10px] uppercase tracking-widest font-bold text-gray-400">
            <tr>
              <th className="px-8 py-6 w-12">
                <input type="checkbox" className="rounded-md border-gray-200 text-gold focus:ring-gold w-4 h-4" />
              </th>
              <th className="px-6 py-6">Utilisateur</th>
              {!isReadersPage && <th className="px-6 py-6">Entreprise</th>}
              <th className="px-6 py-6">Statut</th>
              <th className="px-6 py-6">Date</th>
              <th className="px-6 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={isReadersPage ? 5 : 6} className="px-10 py-20 text-center">
                  <div className="w-10 h-10 border-4 border-gold border-t-transparent animate-spin rounded-full mx-auto" />
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={isReadersPage ? 5 : 6} className="px-10 py-20 text-center text-gray-400">
                  {searchQuery ? 'Aucun resultat.' : `Aucun ${isReadersPage ? 'lecteur' : 'partenaire'}.`}
                </td>
              </tr>
            ) : filteredUsers.map((user) => {
              const badge = getRoleBadge(user.role, user.is_blocked);
              const isActionLoading = actionLoading === user.id;
              return (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <input type="checkbox" className="rounded-md border-gray-200 text-gold focus:ring-gold w-4 h-4" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">
                        {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-dark">{user.full_name || 'Sans nom'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{user.email || user.id.slice(0, 12)}</p>
                      </div>
                    </div>
                  </td>
                  {!isReadersPage && (
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-sm text-dark">{user.company_name || '—'}</p>
                        {user.sector && <p className="text-[10px] text-gray-400">{user.sector}</p>}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-5">
                    <span className={cn("text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider", badge.className)}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-gray-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {isActionLoading ? (
                        <div className="w-5 h-5 border-2 border-gold border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <>
                          {user.role === 'pending_partner' && (
                            <>
                              <button
                                onClick={() => validatePartner(user.id)}
                                className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all"
                                title="Valider"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => rejectPartner(user.id)}
                                className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                                title="Refuser"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => toggleBlock(user.id, user.is_blocked)}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              user.is_blocked
                                ? "bg-green-50 text-green-600 hover:bg-green-100"
                                : "bg-red-50 text-red-500 hover:bg-red-100"
                            )}
                            title={user.is_blocked ? 'Debloquer' : 'Bloquer'}
                          >
                            {user.is_blocked ? <Play size={16} /> : <Ban size={16} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {filteredUsers.length} affiche{filteredUsers.length !== 1 ? 's' : ''}
            {searchQuery || statusFilter !== 'all' ? ` (sur ${users.length} total)` : ''}
          </p>
        </div>
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-serif font-bold mb-6">Ajouter un partenaire</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Nom complet *</label>
                <input
                  type="text"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                  placeholder="Prenom Nom"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email *</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Mot de passe par defaut</label>
                <input
                  type="text"
                  value={addForm.password}
                  onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Le partenaire pourra modifier son mot de passe.</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Entreprise</label>
                <input
                  type="text"
                  value={addForm.company_name}
                  onChange={(e) => setAddForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Secteur</label>
                <select
                  value={addForm.sector}
                  onChange={(e) => setAddForm(f => ({ ...f, sector: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                >
                  <option value="">Selectionner un secteur</option>
                  <option value="FinTech">FinTech</option>
                  <option value="Mode">Mode & Beaute</option>
                  <option value="AgriTech">AgriTech</option>
                  <option value="Media">Media & Communication</option>
                  <option value="Education">Education</option>
                  <option value="Sante">Sante</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              {addError && <p className="text-red-500 text-xs">{addError}</p>}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddPartner}
                  disabled={addLoading}
                  className="flex-1 py-3 bg-dark text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-charcoal transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Creer
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
