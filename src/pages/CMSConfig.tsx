import React, { useState } from 'react';
import { Save, Globe, Palette, Layout, Settings, Info, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  AdminIconBadge,
  AdminSectionHeader,
  AdminSectionShell,
  adminGhostButtonClass,
  adminInputClass,
  adminPrimaryButtonClass,
  adminTextareaClass,
} from '../components/AdminPrimitives';

export default function CMSConfig() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#9A9A8A]">Paramètres transverses</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-[#0A0A0A]">Configuration CMS</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F675B]">
            Cadrez l'identite globale, les reglages de presentation et les fondamentaux de la plateforme AFRIKHER.
          </p>
        </div>
        <button 
          onClick={handleSave}
          className={`${adminPrimaryButtonClass} shrink-0`}
        >
          {saving ? (
            <span className="flex items-center"><div className="mr-2 h-4 w-4 rounded-full border-2 border-[#F5F0E8] border-t-transparent animate-spin" /> Enregistrement...</span>
          ) : (
            <span className="flex items-center"><Save size={18} className="mr-2" /> Enregistrer les modifications</span>
          )}
        </button>
      </div>

      <div className="flex gap-8">
        <div className="w-64 shrink-0 space-y-2">
          {[
            { id: 'general', label: 'Général', icon: Globe },
            { id: 'branding', label: 'Branding', icon: Palette },
            { id: 'layout', label: 'Mise en page', icon: Layout },
            { id: 'advanced', label: 'Avancé', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full rounded-2xl border px-5 py-4 text-left transition-all",
                activeTab === tab.id 
                  ? "border-[#0A0A0A] bg-[#0A0A0A] text-[#F5F0E8] shadow-sm" 
                  : "border-[#E5E0D8] bg-[#F8F6F2] text-[#6F675B] hover:border-[#C9A84C]/35 hover:text-[#0A0A0A]"
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={18} />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-8">
          {activeTab === 'general' && (
            <AdminSectionShell>
              <AdminSectionHeader
                eyebrow="Paramètres généraux"
                title="Cadre global du site"
                description="Renseignez le nom de la marque, les informations de contact et les éléments SEO qui structurent toute l'expérience publique."
              />

              <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Nom du site</label>
                    <input type="text" defaultValue="AFRIKHER" className={`${adminInputClass} rounded-2xl font-semibold`} />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Slogan</label>
                    <input type="text" defaultValue="L'excellence de la beauté africaine" className={`${adminInputClass} rounded-2xl`} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Email de contact</label>
                    <input type="email" defaultValue="contact@afrikher.com" className={`${adminInputClass} rounded-2xl`} />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Langue par défaut</label>
                    <select className={`${adminInputClass} rounded-2xl font-semibold`}>
                      <option>Français</option>
                      <option>English</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-8 pb-8">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Meta Description (SEO)</label>
                <textarea 
                  className={`${adminTextareaClass} h-32 rounded-2xl`}
                  defaultValue="AFRIKHER est la plateforme de référence pour la beauté et le bien-être africain premium. Découvrez nos articles, nos produits et nos partenaires."
                />
              </div>
            </AdminSectionShell>
          )}

          {activeTab === 'branding' && (
            <AdminSectionShell>
              <AdminSectionHeader
                eyebrow="Identité visuelle"
                title="Branding AFRIKHER"
                description="Orchestrez les signatures visuelles de la marque afin de préserver une image cohérente sur l'ensemble du site."
              />

              <div className="grid grid-cols-1 gap-12 p-8 md:grid-cols-2">
                <div className="space-y-6">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9A9A8A]">Logos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-[#E5E0D8] bg-white p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A0A0A] font-display text-2xl font-semibold text-[#F5F0E8]">A</div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6F675B]">Logo Sombre</span>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-[#E5E0D8] bg-[#F8F6F2] p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white font-display text-2xl font-semibold text-[#C9A84C]">A</div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9A9A8A]">Logo Clair</span>
                    </div>
                  </div>
                  <button className={`${adminGhostButtonClass} w-full justify-center`}>Modifier les logos</button>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9A9A8A]">Couleurs de marque</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Primaire (Or)', hex: '#C9A84C', class: 'bg-[#C9A84C]' },
                      { name: 'Sombre', hex: '#0A0A0A', class: 'bg-[#0A0A0A]' },
                      { name: 'Crème', hex: '#F5F0E8', class: 'bg-[#F5F0E8]' },
                      { name: 'Charbon', hex: '#2A2A2A', class: 'bg-[#2A2A2A]' },
                    ].map((color) => (
                      <div key={color.name} className="flex items-center justify-between rounded-2xl border border-[#EDE7DD] bg-[#FAF7F2] p-4">
                        <div className="flex items-center space-x-3">
                          <div className={cn("w-8 h-8 rounded-lg shadow-sm border border-black/5", color.class)} />
                          <span className="text-xs font-semibold text-[#0A0A0A]">{color.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#9A9A8A]">{color.hex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AdminSectionShell>
          )}

          <div className="flex items-start space-x-6 rounded-[2rem] border border-[#C9A84C]/20 bg-[#FBF7ED] p-8">
            <AdminIconBadge icon={Info} className="shrink-0" />
            <div>
              <h4 className="text-lg font-semibold text-[#0A0A0A]">Besoin d'aide ?</h4>
              <p className="mt-1 text-sm leading-relaxed text-[#6F675B]">
                Les modifications apportées ici affectent l'ensemble de la plateforme publique. Assurez-vous de prévisualiser vos changements avant de les enregistrer définitivement.
              </p>
              <button className="mt-4 text-sm font-semibold text-[#C9A84C] hover:underline">Consulter la documentation</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
