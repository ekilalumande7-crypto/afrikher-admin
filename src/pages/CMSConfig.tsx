import React, { useState } from 'react';
import { Save, Globe, Palette, Layout, Settings, Info, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CMSConfig() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-sans font-bold text-slate-900">Configuration CMS</h1>
          <p className="text-gray-400 text-sm mt-1">Configurez les paramètres globaux de votre plateforme AFRIKHER.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center px-8 py-3.5 bg-white text-slate-900 rounded-2xl hover:bg-slate-100 transition-all font-bold tracking-wide shadow-lg shadow-slate-200"
        >
          {saving ? (
            <span className="flex items-center"><div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin mr-2" /> Enregistrement...</span>
          ) : (
            <span className="flex items-center"><Save size={20} className="mr-2 text-green-600" /> Enregistrer les modifications</span>
          )}
        </button>
      </div>

      <div className="flex space-x-8">
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
                "w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm",
                activeTab === tab.id 
                  ? "bg-white text-green-600 shadow-lg shadow-slate-200" 
                  : "text-gray-400 hover:text-slate-900 hover:bg-white"
              )}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-8">
          {activeTab === 'general' && (
            <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-8">
              <div className="border-b border-gray-50 pb-6">
                <h3 className="text-xl font-sans font-bold text-slate-900">Paramètres Généraux</h3>
                <p className="text-sm text-gray-400 mt-1">Informations de base sur le site et SEO.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Nom du site</label>
                    <input type="text" defaultValue="AFRIKHER" className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Slogan</label>
                    <input type="text" defaultValue="L'excellence de la beauté africaine" className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Email de contact</label>
                    <input type="email" defaultValue="contact@afrikher.com" className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Langue par défaut</label>
                    <select className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-500/20">
                      <option>Français</option>
                      <option>English</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Meta Description (SEO)</label>
                <textarea 
                  className="w-full h-32 p-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
                  defaultValue="AFRIKHER est la plateforme de référence pour la beauté et le bien-être africain premium. Découvrez nos articles, nos produits et nos partenaires."
                />
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-8">
              <div className="border-b border-gray-50 pb-6">
                <h3 className="text-xl font-sans font-bold text-slate-900">Identité Visuelle</h3>
                <p className="text-sm text-gray-400 mt-1">Gérez vos logos, couleurs et typographies.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Logos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white rounded-2xl flex flex-col items-center justify-center space-y-3 border border-slate-200">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-slate-900 font-sans text-2xl font-bold">A</div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Logo Sombre</span>
                    </div>
                    <div className="p-6 bg-cream rounded-2xl flex flex-col items-center justify-center space-y-3 border border-gray-100">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-green-600 font-sans text-2xl font-bold">A</div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logo Clair</span>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-gray-50 text-slate-900 rounded-xl text-xs font-bold hover:bg-cream transition-all border border-gray-100">Modifier les logos</button>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Couleurs de Marque</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Primaire (Or)', hex: '#C9A84C', class: 'bg-[#C9A84C]' },
                      { name: 'Sombre', hex: '#0A0A0A', class: 'bg-[#0A0A0A]' },
                      { name: 'Crème', hex: '#F5F0E8', class: 'bg-[#F5F0E8]' },
                      { name: 'Charbon', hex: '#2A2A2A', class: 'bg-[#2A2A2A]' },
                    ].map((color) => (
                      <div key={color.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className={cn("w-8 h-8 rounded-lg shadow-sm border border-black/5", color.class)} />
                          <span className="text-xs font-bold text-slate-900">{color.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">{color.hex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-green-50 p-8 rounded-[32px] border border-gold/10 flex items-start space-x-6">
            <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-slate-900 shrink-0">
              <Info size={24} />
            </div>
            <div>
              <h4 className="text-lg font-sans font-bold text-slate-900">Besoin d'aide ?</h4>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Les modifications apportées ici affectent l'ensemble de la plateforme publique. Assurez-vous de prévisualiser vos changements avant de les enregistrer définitivement.
              </p>
              <button className="mt-4 text-green-600 font-bold text-sm hover:underline">Consulter la documentation</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
