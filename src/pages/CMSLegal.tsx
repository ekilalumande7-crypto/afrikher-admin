import { useEffect, useState, useCallback } from 'react';
import {
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
  FileText,
  Shield,
  Cookie,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AdminAlert,
  AdminFieldRow,
  AdminIconBadge,
  AdminSectionHeader,
  AdminSectionShell,
  adminGhostButtonClass,
  adminPrimaryButtonClass,
  adminTextareaClass,
} from '../components/AdminPrimitives';

type TabKey = 'conditions' | 'confidentialite' | 'cookies';

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: 'conditions', label: 'Conditions', icon: FileText },
  { key: 'confidentialite', label: 'Confidentialit\u00e9', icon: Shield },
  { key: 'cookies', label: 'Cookies', icon: Cookie },
];

const PAGE_URLS: Record<TabKey, string> = {
  conditions: 'https://afrikher-client.vercel.app/conditions-utilisation',
  confidentialite: 'https://afrikher-client.vercel.app/confidentialite',
  cookies: 'https://afrikher-client.vercel.app/cookies',
};

const KEYS: Record<TabKey, { title: string; content: string }> = {
  conditions: { title: 'legal_conditions_title', content: 'legal_conditions_content' },
  confidentialite: { title: 'legal_privacy_title', content: 'legal_privacy_content' },
  cookies: { title: 'legal_cookies_title', content: 'legal_cookies_content' },
};

const DEFAULT_TITLES: Record<TabKey, string> = {
  conditions: "Conditions d\u2019utilisation & Mentions l\u00e9gales",
  confidentialite: "Politique de confidentialit\u00e9",
  cookies: "Politique de cookies",
};

export default function CMSLegal() {
  const [tab, setTab] = useState<TabKey>('conditions');
  const [titles, setTitles] = useState<Record<TabKey, string>>({ ...DEFAULT_TITLES });
  const [contents, setContents] = useState<Record<TabKey, string>>({
    conditions: '',
    confidentialite: '',
    cookies: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('site_config')
      .select('key, value')
      .like('key', 'legal_%');

    if (err) {
      setError('Erreur lors du chargement');
      setLoading(false);
      return;
    }

    if (data) {
      const newTitles = { ...DEFAULT_TITLES };
      const newContents = { conditions: '', confidentialite: '', cookies: '' };

      data.forEach((row: { key: string; value: string }) => {
        if (row.key === 'legal_conditions_title' && row.value) newTitles.conditions = row.value;
        if (row.key === 'legal_conditions_content') newContents.conditions = row.value || '';
        if (row.key === 'legal_privacy_title' && row.value) newTitles.confidentialite = row.value;
        if (row.key === 'legal_privacy_content') newContents.confidentialite = row.value || '';
        if (row.key === 'legal_cookies_title' && row.value) newTitles.cookies = row.value;
        if (row.key === 'legal_cookies_content') newContents.cookies = row.value || '';
      });

      setTitles(newTitles);
      setContents(newContents);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const updates = [
      { key: KEYS[tab].title, value: titles[tab] },
      { key: KEYS[tab].content, value: contents[tab] },
    ];

    for (const u of updates) {
      const { error: err } = await supabase
        .from('site_config')
        .upsert({ key: u.key, value: u.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (err) {
        setError(`Erreur: ${err.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw size={20} className="animate-spin text-[#C9A84C]/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <AdminIconBadge icon={FileText} />
            <span className="text-[0.55rem] text-[#C9A84C]/50 tracking-[0.2em] uppercase font-body">
              Pages l\u00e9gales
            </span>
          </div>
          <h2 className="font-display text-[1.6rem] text-[#1a1a1a] leading-tight">
            Mentions l\u00e9gales & Confidentialit\u00e9
          </h2>
          <p className="text-[0.8rem] text-[#1a1a1a]/50 font-body mt-1 max-w-md">
            G\u00e9rez les pages juridiques du site. Le contenu HTML remplac\u00e9 ici se substitue au texte par d\u00e9faut.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={PAGE_URLS[tab]}
            target="_blank"
            rel="noopener noreferrer"
            className={adminGhostButtonClass}
          >
            <ExternalLink size={16} />
            Voir la page
          </a>
          <button onClick={handleSave} disabled={saving} className={adminPrimaryButtonClass}>
            {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Sauvegarde...' : saved ? 'Sauvegard\u00e9 !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error && <AdminAlert type="error" icon={AlertCircle}>{error}</AdminAlert>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#e8e4dc]">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-[0.7rem] font-body tracking-[0.08em] uppercase transition-all duration-300 border-b-2 ${
                tab === t.key
                  ? 'border-[#C9A84C] text-[#1a1a1a] font-medium'
                  : 'border-transparent text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content editor */}
      <AdminSectionShell>
        <AdminSectionHeader
          title={TABS.find(t => t.key === tab)?.label || ''}
          description="Modifiez le titre et le contenu HTML de cette page. Laissez le contenu vide pour utiliser le texte par d\u00e9faut."
        />

        <AdminFieldRow label="Titre de la page" help="Titre affich\u00e9 en haut de la page l\u00e9gale.">
          <input
            type="text"
            value={titles[tab]}
            onChange={(e) => setTitles(prev => ({ ...prev, [tab]: e.target.value }))}
            className="w-full px-4 py-3 bg-white border border-[#e8e4dc] text-[#1a1a1a] text-[0.85rem] font-body focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
            placeholder={DEFAULT_TITLES[tab]}
          />
        </AdminFieldRow>

        <AdminFieldRow label="Contenu HTML" help="Contenu de la page en HTML. Laissez vide pour garder le texte par d\u00e9faut g\u00e9n\u00e9r\u00e9 automatiquement.">
          <textarea
            value={contents[tab]}
            onChange={(e) => setContents(prev => ({ ...prev, [tab]: e.target.value }))}
            rows={20}
            className={adminTextareaClass}
            placeholder="Laissez vide pour utiliser le contenu par d\u00e9faut. Sinon, \u00e9crivez du HTML : <h2>Titre</h2><p>Paragraphe</p>..."
          />
        </AdminFieldRow>

        <div className="mt-4 p-4 bg-[#C9A84C]/5 border border-[#C9A84C]/15">
          <p className="text-[0.75rem] text-[#1a1a1a]/50 font-body">
            <strong className="text-[#1a1a1a]/70">Astuce :</strong> Utilisez les balises HTML pour structurer le contenu.
            Par exemple : <code className="bg-white/50 px-1 py-0.5 text-[0.7rem]">&lt;h2&gt;</code> pour les titres,
            <code className="bg-white/50 px-1 py-0.5 text-[0.7rem]">&lt;p&gt;</code> pour les paragraphes,
            <code className="bg-white/50 px-1 py-0.5 text-[0.7rem]">&lt;ul&gt;&lt;li&gt;</code> pour les listes.
          </p>
        </div>
      </AdminSectionShell>
    </div>
  );
}
