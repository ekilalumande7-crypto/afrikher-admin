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
  { key: 'confidentialite', label: 'Confidentialité', icon: Shield },
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
  conditions: "Conditions d'utilisation & Mentions légales",
  confidentialite: "Politique de confidentialité",
  cookies: "Politique de cookies",
};

const DEFAULT_CONDITIONS = `Dernière mise à jour : Avril 2026

L'accès et l'utilisation du magazine digital AFRIKHER Magazine impliquent l'acceptation pleine et entière des présentes conditions.

1. Éditeur

Le magazine AFRIKHER Magazine est édité par :
Lamb&Lion Corporate
20, avenue Eben-Ezer
Jamaïque / Kitambo
Kinshasa – République Démocratique du Congo
Résidence secondaire : Waterloo – Belgique
Représentée par : Hadassa Hélène EKILA-LUMANDE, Fondatrice & Rédactrice en Cheffe

2. Objet

AFRIKHER Magazine est un magazine digital panafricain premium dédié au business, au leadership et à l'entrepreneuriat féminin.
Les présentes conditions ont pour objet de définir les modalités d'accès, d'utilisation et d'exploitation des contenus proposés.

3. Accès au service

L'accès au magazine est strictement personnel, non cessible et réservé à l'utilisateur ayant procédé à son acquisition.
Toute utilisation est limitée à un cadre privé, excluant tout usage commercial ou collectif.

4. Propriété intellectuelle

L'ensemble des éléments constituant AFRIKHER Magazine (textes, visuels, photographies, vidéos, interviews, design, identité graphique, logo) est protégé par les législations nationales et internationales relatives à la propriété intellectuelle.
Toute reproduction, représentation, diffusion ou exploitation, totale ou partielle, sans autorisation écrite préalable est strictement interdite.

5. Interdictions d'usage

Il est formellement interdit :
• De revendre, partager ou redistribuer le magazine, sous quelque forme que ce soit
• De reproduire ou exploiter les contenus à des fins commerciales, concurrentielles ou médiatiques
• D'utiliser les contenus d'une manière portant atteinte à AFRIKHER Magazine, à ses partenaires ou aux personnes présentées
• De détourner les informations à des fins diffamatoires, nuisibles ou contraires à l'éthique

6. Utilisation des contenus

Les contenus sont proposés à des fins éditoriales, informatives et inspirantes.
Toute citation ou utilisation publique doit faire l'objet d'une autorisation écrite préalable.

7. Protection de l'image et des personnes

Les images, interviews et contenus mettant en lumière les entrepreneures sont strictement protégés.
Toute réutilisation non autorisée est susceptible d'engager la responsabilité civile et pénale de l'utilisateur.

8. Données personnelles & Technologies

AFRIKHER Magazine s'appuie sur des solutions technologiques reconnues afin d'assurer la sécurité et la confidentialité des données.
• Base de données : Supabase (Europe)
• Authentification : Firebase
• Emailing : Brevo
• Développement : Technovolut
• Hébergement : Hostinger & Vercel
• Traitement d'images : captation réelle et optimisation via intelligence artificielle (Congo AI)

Les données collectées sont utilisées exclusivement dans le cadre des services proposés et conformément aux réglementations applicables.

9. Paiement

Les transactions sont sécurisées via FIDEPAY, solution de paiement propulsée par Stripe.
Les données bancaires ne sont pas conservées par AFRIKHER Magazine.

10. Responsabilité

AFRIKHER Magazine s'engage à fournir des contenus fiables et qualitatifs.
Toutefois, l'utilisation des informations relève de la responsabilité exclusive de l'utilisateur.

11. Sanctions

Toute violation des présentes conditions pourra entraîner :
• La suspension ou suppression de l'accès
• Des poursuites judiciaires
• Une demande de réparation du préjudice subi

12. Évolution des conditions

AFRIKHER Magazine se réserve le droit de modifier les présentes conditions à tout moment.

13. Droit applicable

Les présentes conditions sont régies par les lois applicables.
Tout litige sera soumis aux juridictions compétentes.

Mentions légales complémentaires

Hébergement : Le site AFRIKHER Magazine est hébergé par Hostinger & Vercel.
Propriété du site : Le site internet et le magazine AFRIKHER sont la propriété exclusive de Lamb&Lion Corporate.
Contact : hadassa.ekilalumande@afrikher.com

Engagement AFRIKHER Magazine
AFRIKHER Magazine s'inscrit dans une démarche d'excellence, de respect et de valorisation du leadership féminin africain. Chaque contenu est produit avec exigence et doit être utilisé avec responsabilité.`;

const DEFAULT_PRIVACY = `Dernière mise à jour : Avril 2026

AFRIKHER Magazine, édité par Lamb&Lion Corporate, s'engage à protéger la vie privée de ses utilisateurs. La présente politique décrit comment nous collectons, utilisons et protégeons vos données personnelles.

1. Responsable du traitement

Lamb&Lion Corporate
20, avenue Eben-Ezer, Jamaïque / Kitambo
Kinshasa – République Démocratique du Congo
Contact : hadassa.ekilalumande@afrikher.com

2. Données collectées

Nous collectons les données suivantes :
• Données d'identification : nom, prénom, adresse email
• Données de connexion : adresse IP, type de navigateur, pages visitées
• Données de paiement : traitées exclusivement par FIDEPAY (propulsé par Stripe) — nous ne conservons aucune donnée bancaire
• Données de profil : photo, adresse de livraison, préférences newsletter

3. Finalités du traitement

Vos données sont utilisées pour :
• La gestion de votre compte et de vos abonnements
• Le traitement de vos commandes et paiements
• L'envoi de newsletters et communications éditoriales (avec votre consentement)
• L'amélioration de nos services et de l'expérience utilisateur
• Le respect de nos obligations légales

4. Base légale

Le traitement de vos données repose sur :
• Votre consentement (newsletter, cookies non essentiels)
• L'exécution du contrat (abonnement, commandes)
• Notre intérêt légitime (amélioration des services, sécurité)

5. Sous-traitants et partenaires techniques

• Supabase (Europe) — Base de données et authentification
• Firebase (Google) — Notifications en temps réel
• Brevo — Envoi d'emails transactionnels et newsletters
• FIDEPAY / Stripe — Traitement sécurisé des paiements
• Vercel — Hébergement du site web
• Technovolut — Développement et maintenance technique

6. Durée de conservation

• Pendant la durée de votre inscription pour les données de compte
• 3 ans après votre dernière activité pour les données de navigation
• Conformément aux obligations légales pour les données de facturation

7. Vos droits

Vous disposez des droits suivants :
• Droit d'accès à vos données personnelles
• Droit de rectification des données inexactes
• Droit à l'effacement de vos données
• Droit à la limitation du traitement
• Droit à la portabilité de vos données
• Droit d'opposition au traitement
• Droit de retirer votre consentement à tout moment

Pour exercer ces droits : hadassa.ekilalumande@afrikher.com

8. Sécurité

Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou altération.

9. Transferts internationaux

Certaines données peuvent être traitées en dehors de votre pays de résidence, notamment via nos prestataires techniques. Ces transferts sont encadrés par des garanties appropriées.

10. Modifications

Nous nous réservons le droit de modifier cette politique à tout moment. Toute modification sera publiée sur cette page.

11. Contact

Pour toute question : hadassa.ekilalumande@afrikher.com`;

const DEFAULT_COOKIES = `Dernière mise à jour : Avril 2026

Le site AFRIKHER Magazine utilise des cookies et technologies similaires pour assurer son bon fonctionnement et améliorer votre expérience de navigation.

1. Qu'est-ce qu'un cookie ?

Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette, téléphone) lors de la visite d'un site web. Il permet au site de mémoriser certaines informations sur votre visite.

2. Cookies utilisés

Cookies strictement nécessaires :
• Authentification Supabase — Gestion de votre session de connexion
• Sécurité — Protection contre les accès non autorisés

Cookies fonctionnels :
• Préférences utilisateur — Langue, thème, paramètres d'affichage
• Panier d'achat — Mémorisation de vos articles sélectionnés

Cookies tiers :
• Firebase (Google) — Notifications en temps réel
• Vercel Analytics — Statistiques anonymisées de fréquentation
• Stripe / FIDEPAY — Sécurisation des paiements

3. Durée de conservation

• Cookies de session : supprimés à la fermeture du navigateur
• Cookies persistants : conservés entre 30 jours et 13 mois maximum

4. Gestion des cookies

Vous pouvez configurer votre navigateur pour accepter ou refuser les cookies :
• Chrome : Paramètres → Confidentialité et sécurité → Cookies
• Firefox : Paramètres → Vie privée et sécurité → Cookies
• Safari : Préférences → Confidentialité → Gérer les données de sites
• Edge : Paramètres → Confidentialité → Cookies

5. Consentement

En poursuivant votre navigation, vous acceptez l'utilisation des cookies strictement nécessaires. Pour les autres catégories, votre consentement vous sera demandé.

6. Modifications

Cette politique peut être mise à jour à tout moment.

7. Contact

Pour toute question : hadassa.ekilalumande@afrikher.com`;

const DEFAULT_CONTENTS: Record<TabKey, string> = {
  conditions: DEFAULT_CONDITIONS,
  confidentialite: DEFAULT_PRIVACY,
  cookies: DEFAULT_COOKIES,
};

// Convert plain text to HTML for the client pages
function textToHtml(text: string): string {
  return text
    .split('\n\n')
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      // Numbered titles like "1. Éditeur" or "Mentions légales"
      if (/^\d+\.\s/.test(trimmed) && !trimmed.includes('\n')) {
        return `<h2>${trimmed}</h2>`;
      }
      // Lines starting with bullets
      if (trimmed.includes('\n• ') || trimmed.startsWith('• ')) {
        const lines = trimmed.split('\n');
        const intro = lines[0].startsWith('•') ? '' : `<p>${lines[0]}</p>`;
        const items = lines
          .filter(l => l.startsWith('• '))
          .map(l => `<li>${l.replace('• ', '')}</li>`)
          .join('');
        return `${intro}<ul>${items}</ul>`;
      }
      // Section titles without numbers
      if (trimmed.length < 80 && !trimmed.includes('.') && !trimmed.startsWith('Pour ') && !trimmed.startsWith('Les ') && !trimmed.startsWith('Nous ')) {
        return `<h2>${trimmed}</h2>`;
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

export default function CMSLegal() {
  const [tab, setTab] = useState<TabKey>('conditions');
  const [titles, setTitles] = useState<Record<TabKey, string>>({ ...DEFAULT_TITLES });
  const [contents, setContents] = useState<Record<TabKey, string>>({ ...DEFAULT_CONTENTS });
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
      const newContents = { ...DEFAULT_CONTENTS };

      data.forEach((row: { key: string; value: string }) => {
        if (row.key === 'legal_conditions_title' && row.value) newTitles.conditions = row.value;
        if (row.key === 'legal_conditions_content' && row.value) newContents.conditions = row.value;
        if (row.key === 'legal_privacy_title' && row.value) newTitles.confidentialite = row.value;
        if (row.key === 'legal_privacy_content' && row.value) newContents.confidentialite = row.value;
        if (row.key === 'legal_cookies_title' && row.value) newTitles.cookies = row.value;
        if (row.key === 'legal_cookies_content' && row.value) newContents.cookies = row.value;
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

    // Convert text to HTML before saving
    const htmlContent = textToHtml(contents[tab]);

    const updates = [
      { key: KEYS[tab].title, value: titles[tab] },
      { key: KEYS[tab].content, value: htmlContent },
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

  const lineCount = contents[tab].split('\n').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <AdminIconBadge icon={FileText} />
            <span className="text-[0.55rem] text-[#C9A84C]/50 tracking-[0.2em] uppercase font-body">
              Pages légales
            </span>
          </div>
          <h2 className="font-display text-[1.6rem] text-[#1a1a1a] leading-tight">
            Mentions légales & Confidentialité
          </h2>
          <p className="text-[0.8rem] text-[#1a1a1a]/50 font-body mt-1 max-w-md">
            Gérez le contenu des pages juridiques du site. Écrivez en texte simple, la mise en forme HTML est générée automatiquement.
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
            {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Enregistrer'}
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
          description="Modifiez le titre et le contenu de cette page. Écrivez en texte simple — les titres numérotés, les listes (•) et les paragraphes seront mis en forme automatiquement."
        />

        <AdminFieldRow label="Titre de la page" help="Titre affiché en haut de la page.">
          <input
            type="text"
            value={titles[tab]}
            onChange={(e) => setTitles(prev => ({ ...prev, [tab]: e.target.value }))}
            className="w-full px-4 py-3 bg-white border border-[#e8e4dc] text-[#1a1a1a] text-[0.85rem] font-body focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
            placeholder={DEFAULT_TITLES[tab]}
          />
        </AdminFieldRow>

        <AdminFieldRow label="Contenu" help="Écrivez en texte simple. Les titres numérotés (1. Titre) deviennent des titres, les • deviennent des listes, et les paragraphes sont séparés par des lignes vides.">
          <textarea
            value={contents[tab]}
            onChange={(e) => setContents(prev => ({ ...prev, [tab]: e.target.value }))}
            rows={Math.min(Math.max(lineCount + 5, 25), 50)}
            className={`${adminTextareaClass} !font-mono !text-[0.8rem] !leading-relaxed`}
            placeholder="Contenu de la page..."
          />
        </AdminFieldRow>

        <div className="mt-4 p-4 bg-[#C9A84C]/5 border border-[#C9A84C]/15">
          <p className="text-[0.75rem] text-[#1a1a1a]/50 font-body">
            <strong className="text-[#1a1a1a]/70">Format :</strong> Écrivez en texte normal.
            Les titres comme <code className="bg-white/50 px-1 py-0.5 text-[0.7rem]">1. Mon titre</code> sont formatés automatiquement.
            Utilisez <code className="bg-white/50 px-1 py-0.5 text-[0.7rem]">•</code> pour les listes à puces.
            Séparez les paragraphes par une ligne vide.
          </p>
        </div>
      </AdminSectionShell>
    </div>
  );
}
