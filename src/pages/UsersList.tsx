import React, { useState, useEffect } from 'react';
import { Search, Shield, Calendar, RefreshCw, UserPlus, Check, X, Ban, Pause, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import {
  AdminAlert,
  AdminIconBadge,
  adminGhostButtonClass,
  adminInputClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from '../components/AdminPrimitives';

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
      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session expirée. Reconnectez-vous.');
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/admin/partners/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
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
    if (isBlocked) return { label: 'Bloque', className: 'border-[#7C2D2D]/18 bg-[#FBF1F0] text-[#7C2D2D]' };
    switch (role) {
      case 'partner': return { label: 'Actif', className: 'border-[#C9A84C]/30 bg-[#FBF7ED] text-[#6D5622]' };
      case 'pending_partner': return { label: 'En attente', className: 'border-[#D9D1C2] bg-[#F5F3EF] text-[#6F675B]' };
      case 'rejected_partner': return { label: 'Refuse', className: 'border-[#7C2D2D]/18 bg-[#FBF1F0] text-[#7C2D2D]' };
      default: return { label: role, className: 'border-[#E5E0D8] bg-[#F8F6F2] text-[#6F675B]' };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#9A9A8A]">
            {isReadersPage ? 'Audience & comptes' : 'Réseau & profils'}
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-[#0A0A0A]">{pageTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6F675B]">
            {users.length} {pageTitle.toLowerCase()} — {pageDescription}
          </p>
        </div>
        <div className="flex gap-3">
          {!isReadersPage && (
            <button
              onClick={() => setShowAddModal(true)}
              className={adminPrimaryButtonClass}
            >
              <UserPlus size={18} className="mr-2" />
              Ajouter
            </button>
          )}
          <button
            onClick={fetchUsers}
            className={adminGhostButtonClass}
          >
            <RefreshCw size={18} className="mr-2" />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <AdminAlert tone="error">
          <p className="text-sm">{error}</p>
        </AdminAlert>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-[#E9E2D6] bg-white p-6 shadow-sm">
        <div className="flex items-center space-x-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9A9A8A]" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${adminInputClass} rounded-2xl py-4 pl-14`}
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
                    "rounded-2xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all",
                    statusFilter === f.key
                      ? "border border-[#C9A84C]/30 bg-[#FBF7ED] text-[#6D5622]"
                      : "border border-[#E5E0D8] bg-[#F8F6F2] text-[#6F675B] hover:border-[#D6CCBC]"
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
      <div className="overflow-hidden rounded-[2rem] border border-[#E9E2D6] bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#FBF8F2] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">
            <tr>
              <th className="px-8 py-6 w-12">
                <input type="checkbox" className="h-4 w-4 rounded-md border-[#D9D1C2] text-[#C9A84C]" />
              </th>
              <th className="px-6 py-6">Utilisateur</th>
              {!isReadersPage && <th className="px-6 py-6">Entreprise</th>}
              <th className="px-6 py-6">Statut</th>
              <th className="px-6 py-6">Date</th>
              <th className="px-6 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1ECE4]">
            {loading ? (
              <tr>
                <td colSpan={isReadersPage ? 5 : 6} className="px-10 py-20 text-center">
                  <div className="w-10 h-10 border-4 border-gold border-t-transparent animate-spin rounded-full mx-auto" />
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={isReadersPage ? 5 : 6} className="px-10 py-20 text-center text-[#6F675B]">
                  {searchQuery ? 'Aucun resultat.' : `Aucun ${isReadersPage ? 'lecteur' : 'partenaire'}.`}
                </td>
              </tr>
            ) : filteredUsers.map((user) => {
              const badge = getRoleBadge(user.role, user.is_blocked);
              const isActionLoading = actionLoading === user.id;
              return (
                <tr key={user.id} className="group transition-colors hover:bg-[#FBF8F2]">
                  <td className="px-8 py-5">
                    <input type="checkbox" className="h-4 w-4 rounded-md border-[#D9D1C2] text-[#C9A84C]" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C9A84C]/25 bg-[#FBF7ED] font-semibold text-sm text-[#6D5622]">
                        {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-display text-xl font-semibold text-[#0A0A0A]">{user.full_name || 'Sans nom'}</p>
                        <p className="mt-0.5 text-[11px] text-[#9A9A8A]">{user.email || user.id.slice(0, 12)}</p>
                      </div>
                    </div>
                  </td>
                  {!isReadersPage && (
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-sm text-[#0A0A0A]">{user.company_name || '—'}</p>
                        {user.sector && <p className="text-[10px] uppercase tracking-[0.18em] text-[#9A9A8A]">{user.sector}</p>}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-5">
                    <span className={cn("rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]", badge.className)}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-[#9A9A8A]">
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
                                className="rounded-2xl border border-[#C9A84C]/30 bg-[#FBF7ED] p-2 text-[#6D5622] transition-all hover:bg-[#F7EED9]"
                                title="Valider"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => rejectPartner(user.id)}
                                className="rounded-2xl border border-[#7C2D2D]/18 bg-[#FBF1F0] p-2 text-[#7C2D2D] transition-all hover:bg-[#F7E6E4]"
                                title="Refuser"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => toggleBlock(user.id, user.is_blocked)}
                            className={cn(
                              "rounded-2xl border p-2 transition-all",
                              user.is_blocked
                                ? "border-[#C9A84C]/30 bg-[#FBF7ED] text-[#6D5622] hover:bg-[#F7EED9]"
                                : "border-[#7C2D2D]/18 bg-[#FBF1F0] text-[#7C2D2D] hover:bg-[#F7E6E4]"
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
        <div className="flex items-center justify-between border-t border-[#F1ECE4] bg-[#FBF8F2] p-6">
          <p className="text-xs text-[#9A9A8A]">
            {filteredUsers.length} affiche{filteredUsers.length !== 1 ? 's' : ''}
            {searchQuery || statusFilter !== 'all' ? ` (sur ${users.length} total)` : ''}
          </p>
        </div>
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md rounded-[2rem] border border-[#E9E2D6] bg-white p-8 shadow-2xl">
            <h2 className="mb-6 font-display text-3xl font-semibold text-[#0A0A0A]">Ajouter un partenaire</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Nom complet *</label>
                <input
                  type="text"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                  className={`${adminInputClass} rounded-2xl`}
                  placeholder="Prenom Nom"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Email *</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                  className={`${adminInputClass} rounded-2xl`}
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Mot de passe par defaut</label>
                <input
                  type="text"
                  value={addForm.password}
                  onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))}
                  className={`${adminInputClass} rounded-2xl`}
                />
                <p className="mt-1 text-[10px] text-[#9A9A8A]">Le partenaire pourra modifier son mot de passe.</p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Entreprise</label>
                <input
                  type="text"
                  value={addForm.company_name}
                  onChange={(e) => setAddForm(f => ({ ...f, company_name: e.target.value }))}
                  className={`${adminInputClass} rounded-2xl`}
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[#9A9A8A]">Secteur</label>
                <select
                  value={addForm.sector}
                  onChange={(e) => setAddForm(f => ({ ...f, sector: e.target.value }))}
                  className={`${adminInputClass} rounded-2xl`}
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

              {addError && <p className="text-xs text-[#7C2D2D]">{addError}</p>}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddPartner}
                  disabled={addLoading}
                  className={`${adminPrimaryButtonClass} flex-1 justify-center py-3 disabled:opacity-50`}
                >
                  {addLoading ? (
                    <div className="h-4 w-4 rounded-full border-2 border-[#F5F0E8] border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Creer
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`${adminSecondaryButtonClass} px-6 py-3`}
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
