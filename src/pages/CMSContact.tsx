import { useEffect, useState, useCallback } from 'react';
import { Save, RefreshCw, Check, AlertCircle, Mail, MapPin, Phone, Globe, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SiteConfigMap {
  [key: string]: string;
}

// FieldRow defined OUTSIDE component to prevent focus loss
function FieldRow({ label, description, children }: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-6 border-b border-gray-100">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">{label}</h4>
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export default function CMSContact() {
  const [config, setConfig] = useState<SiteConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('site_config')
        .select('key, value')
        .or('key.like.contact_%,key.like.social_%');
      if (fetchError) throw fetchError;
      const map: SiteConfigMap = {};
      data?.forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value || '';
      });
      setConfig(map);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = useCallback((key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updates = Object.entries(config).map(([key, value]) => ({
        key,
        value: value || '',
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error: upsertError } = await supabase
          .from('site_config')
          .upsert(update, { onConflict: 'key' });
        if (upsertError) throw upsertError;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Page Contact</h1>
          <p className="text-gray-400 mt-1">
            G\u00e9rez les informations de contact affich\u00e9es sur le site et dans le footer.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadConfig}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Sauvegarde...' : saved ? 'Sauvegard\u00e9 !' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-sm">
          <Check size={18} />
          Modifications sauvegard\u00e9es avec succ\u00e8s ! Les changements sont visibles sur le site.
        </div>
      )}

      {/* Email */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Mail size={20} className="text-blue-500" />
          </div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Email & T\u00e9l\u00e9phone</h2>
        </div>

        <FieldRow label="Email de contact" description="Affich\u00e9 sur la page contact et dans le footer.">
          <input
            type="email"
            value={config.contact_email || ''}
            onChange={(e) => updateConfig('contact_email', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="contact@afrikher.com"
          />
        </FieldRow>

        <FieldRow label="T\u00e9l\u00e9phone" description="Num\u00e9ro affich\u00e9 sur la page contact. Laisser vide pour 'Sur rendez-vous'.">
          <input
            type="text"
            value={config.contact_phone || ''}
            onChange={(e) => updateConfig('contact_phone', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+32 xxx xxx xxx"
          />
        </FieldRow>

        <FieldRow label="Lien WhatsApp" description="Lien vers le groupe ou le chat WhatsApp.">
          <input
            type="url"
            value={config.contact_whatsapp || ''}
            onChange={(e) => updateConfig('contact_whatsapp', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://chat.whatsapp.com/..."
          />
        </FieldRow>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <MapPin size={20} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Adresses</h2>
        </div>

        <FieldRow label="Adresse 1" description="Premi\u00e8re adresse affich\u00e9e (ex: si\u00e8ge principal).">
          <input
            type="text"
            value={config.contact_address_1 || ''}
            onChange={(e) => updateConfig('contact_address_1', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Waterloo, Belgique"
          />
        </FieldRow>

        <FieldRow label="Adresse 2" description="Deuxi\u00e8me adresse (optionnelle).">
          <input
            type="text"
            value={config.contact_address_2 || ''}
            onChange={(e) => updateConfig('contact_address_2', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Abidjan, C\u00f4te d'Ivoire"
          />
        </FieldRow>

        <FieldRow label="Adresse 3" description="Troisi\u00e8me adresse (optionnelle).">
          <input
            type="text"
            value={config.contact_address_3 || ''}
            onChange={(e) => updateConfig('contact_address_3', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Paris, France"
          />
        </FieldRow>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <Globe size={20} className="text-purple-500" />
          </div>
          <h2 className="text-xl font-serif font-bold text-gray-900">R\u00e9seaux sociaux</h2>
        </div>

        <FieldRow label="Instagram" description="URL de la page Instagram.">
          <input
            type="url"
            value={config.social_instagram || ''}
            onChange={(e) => updateConfig('social_instagram', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://instagram.com/afrikher"
          />
        </FieldRow>

        <FieldRow label="Facebook" description="URL de la page Facebook.">
          <input
            type="url"
            value={config.social_facebook || ''}
            onChange={(e) => updateConfig('social_facebook', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://facebook.com/afrikher"
          />
        </FieldRow>

        <FieldRow label="LinkedIn" description="URL de la page LinkedIn.">
          <input
            type="url"
            value={config.social_linkedin || ''}
            onChange={(e) => updateConfig('social_linkedin', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://linkedin.com/company/afrikher"
          />
        </FieldRow>

        <FieldRow label="Site web" description="URL du site principal (si diff\u00e9rent).">
          <input
            type="url"
            value={config.contact_website || ''}
            onChange={(e) => updateConfig('contact_website', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://afrikher.com"
          />
        </FieldRow>
      </div>

      {/* Contact Page Texts */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <MessageCircle size={20} className="text-green-500" />
          </div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Textes de la page Contact</h2>
        </div>

        <FieldRow label="Titre de la page" description="Titre principal affich\u00e9 en haut de la page contact.">
          <input
            type="text"
            value={config.contact_page_title || ''}
            onChange={(e) => updateConfig('contact_page_title', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Contact"
          />
        </FieldRow>

        <FieldRow label="Sous-titre" description="Texte en italique sous le titre.">
          <input
            type="text"
            value={config.contact_page_subtitle || ''}
            onChange={(e) => updateConfig('contact_page_subtitle', e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Une question, une collaboration ? Nous sommes \u00e0 votre \u00e9coute."
          />
        </FieldRow>

        <FieldRow label="Texte d'introduction" description="Paragraphe de pr\u00e9sentation \u00e0 c\u00f4t\u00e9 du formulaire.">
          <textarea
            value={config.contact_intro_text || ''}
            onChange={(e) => updateConfig('contact_intro_text', e.target.value)}
            rows={4}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="AFRIKHER est toujours ouvert aux \u00e9changes, collaborations et nouvelles perspectives..."
          />
        </FieldRow>
      </div>
    </div>
  );
}
