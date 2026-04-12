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
  conditions: "Conditions d'utilisation & Mentions l\u00e9gales",
  confidentialite: "Politique de confidentialit\u00e9",
  cookies: "Politique de cookies",
};

const DEFAULT_CONDITIONS = `Derni\u00e8re mise \u00e0 jour : Avril 2026

L'acc\u00e8s et l'utilisation du magazine digital AFRIKHER Magazine impliquent l'acceptation pleine et enti\u00e8re des pr\u00e9sentes conditions.

1. \u00c9diteur

Le magazine AFRIKHER Magazine est \u00e9dit\u00e9 par :
Lamb&Lion Corporate
20, avenue Eben-Ezer
Jama\u00efque / Kitambo
Kinshasa \u2013 R\u00e9publique D\u00e9mocratique du Congo
R\u00e9sidence secondaire : Waterloo \u2013 Belgique
Repr\u00e9sent\u00e9e par : Hadassa H\u00e9l\u00e8ne EKILA-LUMANDE, Fondatrice & R\u00e9dactrice en Cheffe

2. Objet

AFRIKHER Magazine est un magazine digital panafricain premium d\u00e9di\u00e9 au business, au leadership et \u00e0 l'entrepreneuriat f\u00e9minin.
Les pr\u00e9sentes conditions ont pour objet de d\u00e9finir les modalit\u00e9s d'acc\u00e8s, d'utilisation et d'exploitation des contenus propos\u00e9s.

3. Acc\u00e8s au service

L'acc\u00e8s au magazine est strictement personnel, non cessible et r\u00e9serv\u00e9 \u00e0 l'utilisateur ayant proc\u00e9d\u00e9 \u00e0 son acquisition.
Toute utilisation est limit\u00e9e \u00e0 un cadre priv\u00e9, excluant tout usage commercial ou collectif.

4. Propri\u00e9t\u00e9 intellectuelle

L'ensemble des \u00e9l\u00e9ments constituant AFRIKHER Magazine (textes, visuels, photographies, vid\u00e9os, interviews, design, identit\u00e9 graphique, logo) est prot\u00e9g\u00e9 par les l\u00e9gislations nationales et internationales relatives \u00e0 la propri\u00e9t\u00e9 intellectuelle.
Toute reproduction, repr\u00e9sentation, diffusion ou exploitation, totale ou partielle, sans autorisation \u00e9crite pr\u00e9alable est strictement interdite.

5. Interdictions d'usage

Il est formellement interdit :
\u2022 De revendre, partager ou redistribuer le magazine, sous quelque forme que ce soit
\u2022 De reproduire ou exploiter les contenus \u00e0 des fins commerciales, concurrentielles ou m\u00e9diatiques
\u2022 D'utiliser les contenus d'une mani\u00e8re portant atteinte \u00e0 AFRIKHER Magazine, \u00e0 ses partenaires ou aux personnes pr\u00e9sent\u00e9es
\u2022 De d\u00e9tourner les informations \u00e0 des fins diffamatoires, nuisibles ou contraires \u00e0 l'\u00e9thique

6. Utilisation des contenus

Les contenus sont propos\u00e9s \u00e0 des fins \u00e9ditoriales, informatives et inspirantes.
Toute citation ou utilisation publique doit faire l'objet d'une autorisation \u00e9crite pr\u00e9alable.

7. Protection de l'image et des personnes

Les images, interviews et contenus mettant en lumi\u00e8re les entrepreneures sont strictement prot\u00e9g\u00e9s.
Toute r\u00e9utilisation non autoris\u00e9e est susceptible d'engager la responsabilit\u00e9 civile et p\u00e9nale de l'utilisateur.

8. Donn\u00e9es personnelles & Technologies

AFRIKHER Magazine s'appuie sur des solutions technologiques reconnues afin d'assurer la s\u00e9curit\u00e9 et la confidentialit\u00e9 des donn\u00e9es.
\u2022 Base de donn\u00e9es : Supabase (Europe)
\u2022 Authentification : Firebase
\u2022 Emailing : Brevo
\u2022 D\u00e9veloppement : Technovolut
\u2022 H\u00e9bergement : Hostinger & Vercel
\u2022 Traitement d'images : captation r\u00e9elle et optimisation via intelligence artificielle (Congo AI)

Les donn\u00e9es collect\u00e9es sont utilis\u00e9es exclusivement dans le cadre des services propos\u00e9s et conform\u00e9ment aux r\u00e9glementations applicables.

9. Paiement

Les transactions sont s\u00e9curis\u00e9es via FIDEPAY, solution de paiement propuls\u00e9e par Stripe.
Les donn\u00e9es bancaires ne sont pas conserv\u00e9es par AFRIKHER Magazine.

10. Responsabilit\u00e9

AFRIKHER Magazine s'engage \u00e0 fournir des contenus fiables et qualitatifs.
Toutefois, l'utilisation des informations rel\u00e8ve de la responsabilit\u00e9 exclusive de l'utilisateur.

11. Sanctions

Toute violation des pr\u00e9sentes conditions pourra entra\u00eener :
\u2022 La suspension ou suppression de l'acc\u00e8s
\u2022 Des poursuites judiciaires
\u2022 Une demande de r\u00e9paration du pr\u00e9judice subi

12. \u00c9volution des conditions

AFRIKHER Magazine se r\u00e9serve le droit de modifier les pr\u00e9sentes conditions \u00e0 tout moment.

13. Droit applicable

Les pr\u00e9sentes conditions sont r\u00e9gies par les lois applicables.
Tout litige sera soumis aux juridictions comp\u00e9tentes.

Mentions l\u00e9gales compl\u00e9mentaires

H\u00e9bergement : Le site AFRIKHER Magazine est h\u00e9berg\u00e9 par Hostinger & Vercel.
Propri\u00e9t\u00e9 du site : Le site internet et le magazine AFRIKHER sont la propri\u00e9t\u00e9 exclusive de Lamb&Lion Corporate.
Contact : hadassa.ekilalumande@afrikher.com

Engagement AFRIKHER Magazine
AFRIKHER Magazine s'inscrit dans une d\u00e9marche d'excellence, de respect et de valorisation du leadership f\u00e9minin africain. Chaque contenu est produit avec exigence et doit \u00eatre utilis\u00e9 avec responsabilit\u00e9.`;

const DEFAULT_PRIVACY = `Derni\u00e8re mise \u00e0 jour : Avril 2026

AFRIKHER Magazine, \u00e9dit\u00e9 par Lamb&Lion Corporate, s'engage \u00e0 prot\u00e9ger la vie priv\u00e9e de ses utilisateurs. La pr\u00e9sente politique d\u00e9crit comment nous collectons, utilisons et prot\u00e9geons vos donn\u00e9es personnelles.

1. Responsable du traitement

Lamb&Lion Corporate
20, avenue Eben-Ezer, Jama\u00efque / Kitambo
Kinshasa \u2013 R\u00e9publique D\u00e9mocratique du Congo
Contact : hadassa.ekilalumande@afrikher.com

2. Donn\u00e9es collect\u00e9es

Nous collectons les donn\u00e9es suivantes :
\u2022 Donn\u00e9es d'identification : nom, pr\u00e9nom, adresse email
\u2022 Donn\u00e9es de connexion : adresse IP, type de navigateur, pages visit\u00e9es
\u2022 Donn\u00e9es de paiement : trait\u00e9es exclusivement par FIDEPAY (propuls\u00e9 par Stripe) \u2014 nous ne conservons aucune donn\u00e9e bancaire
\u2022 Donn\u00e9es de profil : photo, adresse de livraison, pr\u00e9f\u00e9rences newsletter

3. Finalit\u00e9s du traitement

Vos donn\u00e9es sont utilis\u00e9es pour :
\u2022 La gestion de votre compte et de vos abonnements
\u2022 Le traitement de vos commandes et paiements
\u2022 L'envoi de newsletters et communications \u00e9ditoriales (avec votre consentement)
\u2022 L'am\u00e9lioration de nos services et de l'exp\u00e9rience utilisateur
\u2022 Le respect de nos obligations l\u00e9gales

4. Base l\u00e9gale

Le traitement de vos donn\u00e9es repose sur :
\u2022 Votre consentement (newsletter, cookies non essentiels)
\u2022 L'ex\u00e9cution du contrat (abonnement, commandes)
\u2022 Notre int\u00e9r\u00eat l\u00e9gitime (am\u00e9lioration des services, s\u00e9curit\u00e9)

5. Sous-traitants et partenaires techniques

\u2022 Supabase (Europe) \u2014 Base de donn\u00e9es et authentification
\u2022 Firebase (Google) \u2014 Notifications en temps r\u00e9el
\u2022 Brevo \u2014 Envoi d'emails transactionnels et newsletters
\u2022 FIDEPAY / Stripe \u2014 Traitement s\u00e9curis\u00e9 des paiements
\u2022 Vercel \u2014 H\u00e9bergement du site web
\u2022 Technovolut \u2014 D\u00e9veloppement et maintenance technique

6. Dur\u00e9e de conservation

\u2022 Pendant la dur\u00e9e de votre inscription pour les donn\u00e9es de compte
\u2022 3 ans apr\u00e8s votre derni\u00e8re activit\u00e9 pour les donn\u00e9es de navigation
\u2022 Conform\u00e9ment aux obligations l\u00e9gales pour les donn\u00e9es de facturation

7. Vos droits

Vous disposez des droits suivants :
\u2022 Droit d'acc\u00e8s \u00e0 vos donn\u00e9es personnelles
\u2022 Droit de rectification des donn\u00e9es inexactes
\u2022 Droit \u00e0 l'effacement de vos donn\u00e9es
\u2022 Droit \u00e0 la limitation du traitement
\u2022 Droit \u00e0 la portabilit\u00e9 de vos donn\u00e9es
\u2022 Droit d'opposition au traitement
\u2022 Droit de retirer votre consentement \u00e0 tout moment

Pour exercer ces droits : hadassa.ekilalumande@afrikher.com

8. S\u00e9curit\u00e9

Nous mettons en \u0153uvre des mesures techniques et organisationnelles appropri\u00e9es pour prot\u00e9ger vos donn\u00e9es contre tout acc\u00e8s non autoris\u00e9, perte ou alt\u00e9ration.

9. Transferts internationaux

Certaines donn\u00e9es peuvent \u00eatre trait\u00e9es en dehors de votre pays de r\u00e9sidence, notamment via nos prestataires techniques. Ces transferts sont encadr\u00e9s par des garanties appropri\u00e9es.

10. Modifications

Nous nous r\u00e9servons le droit de modifier cette politique \u00e0 tout moment. Toute modification sera publi\u00e9e sur cette page.

11. Contact

Pour toute question : hadassa.ekilalumande@afrikher.com`;

const DEFAULT_COOKIES = `Derni\u00e8re mise \u00e0 jour : Avril 2026

Le site AFRIKHER Magazine utilise des cookies et technologies similaires pour assurer son bon fonctionnement et am\u00e9liorer votre exp\u00e9rience de navigation.

1. Qu'est-ce qu'un cookie ?

Un cookie est un petit fichier texte d\u00e9pos\u00e9 sur votre appareil (ordinateur, tablette, t\u00e9l\u00e9phone) lors de la visite d'un site web. Il permet au site de m\u00e9moriser certaines informations sur votre visite.

2. Cookies utilis\u00e9s

Cookies strictement n\u00e9cessaires :
\u2022 Authentification Supabase \u2014 Gestion de votre session de connexion
\u2022 S\u00e9curit\u00e9 \u2014 Protection contre les acc\u00e8s non autoris\u00e9s

Cookies fonctionnels :
\u2022 Pr\u00e9f\u00e9rences utilisateur \u2014 Langue, th\u00e8me, param\u00e8tres d'affichage
\u2022 Panier d'achat \u2014 M\u00e9morisation de vos articles s\u00e9lectionn\u00e9s

Cookies tiers :
\u2022 Firebase (Google) \u2014 Notifications en temps r\u00e9el
\u2022 Vercel Analytics \u2014 Statistiques anonymis\u00e9es de fr\u00e9quentation
\u2022 Stripe / FIDEPAY \u2014 S\u00e9curisation des paiements

3. Dur\u00e9e de conservation

\u2022 Cookies de session : supprim\u00e9s \u00e0 la fermeture du navigateur
\u2022 Cookies persistants : conserv\u00e9s entre 30 jours et 13 mois maximum

4. Gestion des cookies

Vous pouvez configurer votre navigateur pour accepter ou refuser les cookies :
\u2022 Chrome : Param\u00e8tres \u2192 Confidentialit\u00e9 et s\u00e9curit\u00e9 \u2192 Cookies
\u2022 Firefox : Param\u00e8tres \u2192 Vie priv\u00e9e et s\u00e9curit\u00e9 \u2192 Cookies
\u2022 Safari : Pr\u00e9f\u00e9rences \u2192 Confidentialit\u00e9 \u2192 G\u00e9rer les donn\u00e9es de sites
\u2022 Edge : Param\u00e8tres \u2192 Confidentialit\u00e9 \u2192 Cookies

5. Consentement

En poursuivant votre navigation, vous acceptez l'utilisation des cookies strictement n\u00e9cessaires. Pour les autres cat\u00e9gories, votre consentement vous sera demand\u00e9.

6. Modifications

Cette politique peut \u00eatre mise \u00e0 jour \u00e0 tout moment.

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
      if (trimmed.includes('\n\u2022 ') || trimmed.startsWith('\u2022 ')) {
        const lines = trimmed.split('\n');
        const intro = lines[0].startsWith('\u2022') ? '' : `<p>${lines[0]}</p>`;
        const items = lines
          .filter(l => l.startsWith('\u2022 '))
          .map(l => `<li>${l.replace('\u2022 ', '')}</li>`)
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
              Pages l\u00e9gales
            </span>
          </div>
          <h2 className="font-display text-[1.6rem] text-[#1a1a1a] leading-tight">
            Mentions l\u00e9gales & Confidentialit\u00e9
          </h2>
          <p className="text-[0.8rem] text-[#1a1a1a]/50 font-body mt-1 max-w-md">
            G\u00e9rez le contenu des pages juridiques du site. \u00c9crivez en texte simple, la mise en forme HTML est g\u00e9n\u00e9r\u00e9e automatiquement.
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
          description="Modifiez le titre et le contenu de cette page. \u00c9crivez en texte simple \u2014 les titres num\u00e9rot\u00e9s, les listes (\u2022) et les paragraphes seront mis en forme automatiquement."
        />

        <AdminFieldRow label="Titre de la page" help="Titre affich\u00e9 en haut de la page.">
          <input
            type="text"
            value={titles[tab]}
            onChange={(e) => setTitles(prev => ({ ...prev, [tab]: e.target.value }))}
            className="w-full px-4 py-3 bg-white border border-[#e8e4dc] text-[#1a1a1a] text-[0.85rem] font-body focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
            placeholder={DEFAULT_TITLES[tab]}
          />
        </AdminFieldRow>

        <AdminFieldRow label="Contenu" help="\u00c9crivez en texte simple. Les titres num\u00e9rot\u00e9s (1. Titre) deviennent des titres, les \u2022 deviennent des listes, et les paragraphes sont s\u00e9par\u00e9s par des lignes vides.">
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
            <strong className="text-[#1a1a1a]/70">Format :</strong> \u00c9crivez en texte normal.
            Les titres comme <code className="bg-white/50 px-1 py-0.5 text-[0.7rem]">1. Mon titre</code> sont format\u00e9s automatiquement.
            Utilisez <code className="bg-white/50 px-1 py-0.5 text-[0.7rem]">\u2022</code> pour les listes \u00e0 puces.
            S\u00e9parez les paragraphes par une ligne vide.
          </p>
        </div>
      </AdminSectionShell>
    </div>
  );
}
