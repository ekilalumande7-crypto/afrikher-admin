import { useEffect, useState } from 'react';
import {
  Save,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Camera,
  BookOpen,
  ExternalLink,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SiteConfig {
  key: string;
  value: string;
}

interface ChapterItem {
  id: string;
  titre: string;
  description: string;
  image: string;
  link: string;
  ordre: number;
}

interface VideoItem {
  id: string;
  titre: string;
  url: string;
  description: string;
  thumbnail: string;
}

interface PhotoItem {
  id: string;
  url: string;
  alt: string;
  titre: string;
}

type ActiveTab = 'editorial' | 'chapitres' | 'galerie' | 'videos';

export default function CMSRubriques() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('editorial');
  const [error, setError] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('key, value')
        .like('key', 'rubriques_%');

      if (error) throw error;

      const configMap: Record<string, string> = {};
      data?.forEach((item: SiteConfig) => {
        configMap[item.key] = item.value || '';
      });

      setConfig(configMap);
      const parseIssues: string[] = [];

      try {
        const parsedChapters = configMap.rubriques_chapitres
          ? JSON.parse(configMap.rubriques_chapitres)
          : [];
        setChapters(Array.isArray(parsedChapters) ? parsedChapters : []);
        if (configMap.rubriques_chapitres && !Array.isArray(parsedChapters)) {
          parseIssues.push('`rubriques_chapitres` doit contenir un tableau JSON valide.');
        }
      } catch {
        setChapters([]);
        if (configMap.rubriques_chapitres) {
          parseIssues.push('Le JSON de `rubriques_chapitres` est invalide.');
        }
      }

      try {
        const parsedPhotos = configMap.rubriques_galerie
          ? JSON.parse(configMap.rubriques_galerie)
          : [];
        setPhotos(Array.isArray(parsedPhotos) ? parsedPhotos : []);
        if (configMap.rubriques_galerie && !Array.isArray(parsedPhotos)) {
          parseIssues.push('`rubriques_galerie` doit contenir un tableau JSON valide.');
        }
      } catch {
        setPhotos([]);
        if (configMap.rubriques_galerie) {
          parseIssues.push('Le JSON de `rubriques_galerie` est invalide.');
        }
      }

      try {
        const parsedVideos = configMap.rubriques_videos
          ? JSON.parse(configMap.rubriques_videos)
          : [];
        setVideos(Array.isArray(parsedVideos) ? parsedVideos : []);
        if (configMap.rubriques_videos && !Array.isArray(parsedVideos)) {
          parseIssues.push('`rubriques_videos` doit contenir un tableau JSON valide.');
        }
      } catch {
        setVideos([]);
        if (configMap.rubriques_videos) {
          parseIssues.push('Le JSON de `rubriques_videos` est invalide.');
        }
      }
      setJsonError(parseIssues.join(' '));
    } catch (err) {
      console.error('Error loading CMS Rubriques:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  async function saveAll() {
    setSaving(true);
    setError('');

    try {
      const updates = [
        { key: 'rubriques_titre', value: config.rubriques_titre || '' },
        { key: 'rubriques_soustitre', value: config.rubriques_soustitre || '' },
        { key: 'rubriques_badge', value: config.rubriques_badge || '' },
        { key: 'rubriques_editorial_titre', value: config.rubriques_editorial_titre || '' },
        { key: 'rubriques_editorial_texte', value: config.rubriques_editorial_texte || '' },
        { key: 'rubriques_hero_image', value: config.rubriques_hero_image || '' },
        { key: 'rubriques_chapitres', value: JSON.stringify(chapters) },
        { key: 'rubriques_galerie', value: JSON.stringify(photos) },
        { key: 'rubriques_videos', value: JSON.stringify(videos) },
      ];

      for (const item of updates) {
        const { error } = await supabase.from('site_config').upsert(
          {
            key: item.key,
            value: item.value,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'key',
          }
        );

        if (error) throw error;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving CMS Rubriques:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file: File, folder = 'rubriques', customName?: string): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder}/${customName || Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('afrikher-public')
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('afrikher-public')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async function handleHeroImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const url = await uploadImage(file, 'rubriques', `hero-${Date.now()}`);
      updateConfig('rubriques_hero_image', url);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'upload de l’image");
    } finally {
      setUploadingImage(false);
    }
  }

  function addChapter() {
    const newChapter: ChapterItem = {
      id: `chap-${Date.now()}`,
      titre: '',
      description: '',
      image: '',
      link: '',
      ordre: chapters.length + 1,
    };
    setChapters((prev) => [...prev, newChapter]);
  }

  function updateChapter(id: string, field: keyof ChapterItem, value: string | number) {
    setChapters((prev) => prev.map((ch) => (ch.id === id ? { ...ch, [field]: value } : ch)));
    setSaved(false);
  }

  function removeChapter(id: string) {
    setChapters((prev) => prev.filter((ch) => ch.id !== id));
    setSaved(false);
  }

  function moveChapter(index: number, direction: 'up' | 'down') {
    const newChapters = [...chapters];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    [newChapters[index], newChapters[targetIndex]] = [newChapters[targetIndex], newChapters[index]];
    setChapters(newChapters.map((ch, idx) => ({ ...ch, ordre: idx + 1 })));
    setSaved(false);
  }

  async function handleChapterImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    chapterId: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const url = await uploadImage(file, 'rubriques/chapitres', `${chapterId}-${Date.now()}`);
      updateChapter(chapterId, 'image', url);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'upload");
    } finally {
      setUploadingImage(false);
    }
  }

  function addPhoto() {
    const newPhoto: PhotoItem = {
      id: `photo-${Date.now()}`,
      url: '',
      alt: '',
      titre: '',
    };
    setPhotos((prev) => [...prev, newPhoto]);
  }

  function updatePhoto(id: string, field: keyof PhotoItem, value: string) {
    setPhotos((prev) => prev.map((photo) => (photo.id === id ? { ...photo, [field]: value } : photo)));
    setSaved(false);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
    setSaved(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, photoId: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const url = await uploadImage(file, 'gallery', `photo-${Date.now()}`);
      updatePhoto(photoId, 'url', url);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'upload");
    } finally {
      setUploadingImage(false);
    }
  }

  function addVideo() {
    const newVideo: VideoItem = {
      id: `video-${Date.now()}`,
      titre: '',
      url: '',
      description: '',
      thumbnail: '',
    };
    setVideos((prev) => [...prev, newVideo]);
  }

  function updateVideo(id: string, field: keyof VideoItem, value: string) {
    setVideos((prev) => prev.map((video) => (video.id === id ? { ...video, [field]: value } : video)));
    setSaved(false);
  }

  function removeVideo(id: string) {
    setVideos((prev) => prev.filter((video) => video.id !== id));
    setSaved(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-[#9A9A8A]" />
      </div>
    );
  }

  const tabs = [
    { key: 'editorial', label: 'Éditorial', icon: FileText, count: null },
    { key: 'chapitres', label: 'Chapitres', icon: BookOpen, count: chapters.length },
    { key: 'galerie', label: 'Galerie', icon: Camera, count: photos.length },
    { key: 'videos', label: 'Vidéos', icon: Video, count: videos.length },
  ];

  const inputClass =
    'h-12 w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#9A9A8A] focus:border-[#C9A84C]';
  const textareaClass =
    'w-full border border-[#0A0A0A]/10 bg-[#FBF8F2] px-4 py-3 text-sm leading-7 text-[#0A0A0A] outline-none transition-colors placeholder:text-[#9A9A8A] focus:border-[#C9A84C] resize-none';
  const labelClass = 'mb-2 block text-[0.62rem] uppercase tracking-[0.2em] text-[#9A9A8A]';

  return (
    <div className="space-y-8">
      <div className="border border-[#0A0A0A]/10 bg-white p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#C9A84C]">
              CMS rubriques
            </p>
            <h1 className="mt-2 font-serif text-[2.5rem] leading-[0.94] tracking-[-0.03em] text-[#0A0A0A] md:text-[3.2rem]">
              Rubriques
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9A9A8A]">
              Pilotez le récit, les chapitres, la galerie et les vidéos de la page Rubriques dans
              une interface plus éditoriale et plus calme.
            </p>
          </div>

          <button
            onClick={saveAll}
            disabled={saving}
            className="inline-flex h-12 items-center justify-center gap-3 border border-[#0A0A0A] bg-[#0A0A0A] px-6 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#F5F0E8] transition-colors hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A0A0A] disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Enregistrement...' : saved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>

        {error ? <Notice tone="error" message={error} /> : null}
        {jsonError ? <Notice tone="error" message={jsonError} /> : null}
        {saved ? <Notice tone="success" message="Modifications sauvegardées avec succès." /> : null}
      </div>

      <div className="border border-[#0A0A0A]/10 bg-white p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ActiveTab)}
                className={`inline-flex items-center gap-2 border px-5 py-3 whitespace-nowrap text-[0.68rem] uppercase tracking-[0.2em] transition-colors ${
                  isActive
                    ? 'border-[#C9A84C] bg-[#EFE6D0] text-[#8A6E2F]'
                    : 'border-[#0A0A0A]/10 bg-white text-[#9A9A8A] hover:border-[#C9A84C]/30 hover:text-[#0A0A0A]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== null ? (
                  <span
                    className={`border px-2 py-0.5 text-[0.56rem] ${
                      isActive
                        ? 'border-[#C9A84C]/30 bg-white/55 text-[#8A6E2F]'
                        : 'border-[#0A0A0A]/8 bg-[#FBF8F2] text-[#9A9A8A]'
                    }`}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'editorial' && (
        <div className="space-y-6">
          <SectionCard
            eyebrow="Hero"
            title="Présentation de la page"
            description="Les éléments principaux qui ouvrent la page Rubriques."
          >
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Badge de section</label>
                  <input
                    type="text"
                    value={config.rubriques_badge || ''}
                    onChange={(e) => updateConfig('rubriques_badge', e.target.value)}
                    placeholder="EXPLORER NOS RUBRIQUES"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Titre principal</label>
                  <input
                    type="text"
                    value={config.rubriques_titre || ''}
                    onChange={(e) => updateConfig('rubriques_titre', e.target.value)}
                    placeholder="Les Rubriques"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Sous-titre</label>
                  <textarea
                    value={config.rubriques_soustitre || ''}
                    onChange={(e) => updateConfig('rubriques_soustitre', e.target.value)}
                    rows={4}
                    placeholder="Un espace éditorial dédié à..."
                    className={textareaClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Image hero</label>
                <div className="space-y-4">
                  {config.rubriques_hero_image ? (
                    <div className="aspect-[4/3] overflow-hidden border border-[#0A0A0A]/10 bg-[#FBF8F2]">
                      <img
                        src={config.rubriques_hero_image}
                        alt="Hero Rubriques"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-[#0A0A0A]/15 bg-[#FBF8F2]">
                      <div className="text-center">
                        <ImageIcon className="mx-auto mb-2 h-10 w-10 text-[#9A9A8A]" />
                        <p className="text-sm text-[#9A9A8A]">Aucune image</p>
                      </div>
                    </div>
                  )}

                  <label className="inline-flex h-11 items-center justify-center gap-3 border border-[#0A0A0A]/10 bg-white px-5 text-[0.68rem] uppercase tracking-[0.22em] text-[#0A0A0A] transition-colors hover:border-[#C9A84C]/35 hover:bg-[#FBF8F2] cursor-pointer">
                    {uploadingImage ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploadingImage ? 'Import...' : 'Uploader une image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleHeroImageUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Éditorial"
            title="Texte de cadrage"
            description="Le texte qui donne l’angle et le sens de la page Rubriques."
          >
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Titre éditorial</label>
                <input
                  type="text"
                  value={config.rubriques_editorial_titre || ''}
                  onChange={(e) => updateConfig('rubriques_editorial_titre', e.target.value)}
                  placeholder="Un regard éditorial sur..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Texte éditorial</label>
                <textarea
                  value={config.rubriques_editorial_texte || ''}
                  onChange={(e) => updateConfig('rubriques_editorial_texte', e.target.value)}
                  rows={6}
                  placeholder="Décrivez la vision éditoriale de cette page..."
                  className={textareaClass}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === 'chapitres' && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="Structure"
            title="Chapitres"
            description="Les blocs éditoriaux ou rubriques affichés sur la page."
            actionLabel="Ajouter un chapitre"
            onAction={addChapter}
          />

          {chapters.length === 0 ? (
            <EmptyPanel
              icon={BookOpen}
              title="Aucun chapitre pour le moment."
              description="Ajoutez votre premier chapitre pour structurer visuellement la page Rubriques."
            />
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="border border-[#0A0A0A]/10 bg-white p-6">
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-[#9A9A8A]" />
                      <div className="inline-flex h-8 w-8 items-center justify-center border border-[#C9A84C]/25 bg-[#EFE6D0] text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#8A6E2F]">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-serif text-[1.5rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
                          {chapter.titre || `Chapitre ${index + 1}`}
                        </h3>
                        <p className="mt-2 text-sm text-[#9A9A8A]">
                          Bloc éditorial ordonné dans la narration.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveChapter(index, 'up')}
                        disabled={index === 0}
                        className="inline-flex h-10 w-10 items-center justify-center border border-[#0A0A0A]/10 text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveChapter(index, 'down')}
                        disabled={index === chapters.length - 1}
                        className="inline-flex h-10 w-10 items-center justify-center border border-[#0A0A0A]/10 text-[#9A9A8A] transition-colors hover:border-[#C9A84C]/30 hover:text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeChapter(chapter.id)}
                        className="inline-flex h-10 items-center justify-center gap-2 border border-[#9C4C3A]/12 px-3 text-[0.64rem] uppercase tracking-[0.2em] text-[#9C4C3A] transition-colors hover:bg-[#F7E3DE]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                      <div>
                        <label className={labelClass}>Titre</label>
                        <input
                          type="text"
                          value={chapter.titre}
                          onChange={(e) => updateChapter(chapter.id, 'titre', e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                          value={chapter.description}
                          onChange={(e) => updateChapter(chapter.id, 'description', e.target.value)}
                          rows={4}
                          className={textareaClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Lien</label>
                        <input
                          type="text"
                          value={chapter.link}
                          onChange={(e) => updateChapter(chapter.id, 'link', e.target.value)}
                          placeholder="/rubrique/beauty"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Image</label>
                      <div className="space-y-3">
                        {chapter.image ? (
                          <div className="aspect-square overflow-hidden border border-[#0A0A0A]/10 bg-[#FBF8F2]">
                            <img src={chapter.image} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex aspect-square items-center justify-center border border-dashed border-[#0A0A0A]/15 bg-[#FBF8F2]">
                            <ImageIcon className="h-8 w-8 text-[#9A9A8A]" />
                          </div>
                        )}

                        <label className="inline-flex h-11 items-center justify-center gap-3 border border-[#0A0A0A]/10 bg-white px-5 text-[0.68rem] uppercase tracking-[0.22em] text-[#0A0A0A] transition-colors hover:border-[#C9A84C]/35 hover:bg-[#FBF8F2] cursor-pointer">
                          <Upload className="h-4 w-4" />
                          <span>Changer</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleChapterImageUpload(e, chapter.id)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'galerie' && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="Visuels"
            title="Galerie"
            description="Photos éditoriales affichées dans la section galerie."
            actionLabel="Ajouter une photo"
            onAction={addPhoto}
          />

          {photos.length === 0 ? (
            <EmptyPanel
              icon={Camera}
              title="Aucune photo dans la galerie."
              description="Ajoutez des visuels pour enrichir la narration et la respiration graphique de la page."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {photos.map((photo) => (
                <div key={photo.id} className="border border-[#0A0A0A]/10 bg-white overflow-hidden">
                  <div className="group relative aspect-[4/3] bg-[#FBF8F2]">
                    {photo.url ? (
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-[#9A9A8A]" />
                      </div>
                    )}

                    <label className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity cursor-pointer group-hover:opacity-100">
                      <div className="border border-white/20 bg-white px-4 py-2 text-[0.68rem] uppercase tracking-[0.2em] text-[#0A0A0A]">
                        Changer l’image
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, photo.id)}
                      />
                    </label>

                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center bg-white text-[#9C4C3A]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <label className={labelClass}>Titre</label>
                      <input
                        type="text"
                        value={photo.titre}
                        onChange={(e) => updatePhoto(photo.id, 'titre', e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Texte alternatif</label>
                      <input
                        type="text"
                        value={photo.alt}
                        onChange={(e) => updatePhoto(photo.id, 'alt', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="Formats"
            title="Vidéos"
            description="Ajoutez des vidéos YouTube ou Vimeo pour enrichir la page."
            actionLabel="Ajouter une vidéo"
            onAction={addVideo}
          />

          {videos.length === 0 ? (
            <EmptyPanel
              icon={Video}
              title="Aucune vidéo pour le moment."
              description="Ajoutez des vidéos pour renforcer l’angle éditorial et le rythme visuel de la page."
            />
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="border border-[#0A0A0A]/10 bg-white p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className={labelClass}>Titre</label>
                        <input
                          type="text"
                          value={video.titre}
                          onChange={(e) => updateVideo(video.id, 'titre', e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>URL vidéo</label>
                        <input
                          type="url"
                          value={video.url}
                          onChange={(e) => updateVideo(video.id, 'url', e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                          value={video.description}
                          onChange={(e) => updateVideo(video.id, 'description', e.target.value)}
                          rows={3}
                          className={textareaClass}
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 justify-end">
                      <button
                        onClick={() => removeVideo(video.id)}
                        className="inline-flex h-10 items-center justify-center gap-2 border border-[#9C4C3A]/12 px-3 text-[0.64rem] uppercase tracking-[0.2em] text-[#9C4C3A] transition-colors hover:bg-[#F7E3DE]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {video.url ? (
                    <div className="mt-5">
                      {video.url.includes('youtube.com') || video.url.includes('youtu.be') ? (
                        <div className="aspect-video max-w-md overflow-hidden border border-[#0A0A0A]/10 bg-[#FBF8F2]">
                          <iframe
                            src={`https://www.youtube.com/embed/${extractYouTubeId(video.url)}`}
                            title={video.titre}
                            className="h-full w-full"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.22em] text-[#C9A84C] hover:opacity-75"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ouvrir la vidéo
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#0A0A0A]/10 bg-white p-8">
      <div className="border-b border-[#0A0A0A]/8 pb-5">
        <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#C9A84C]">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-[1.9rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#9A9A8A]">{description}</p>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#C9A84C]">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-[1.9rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9A9A8A]">{description}</p>
      </div>

      <button
        onClick={onAction}
        className="inline-flex h-12 items-center justify-center gap-3 border border-[#0A0A0A] bg-[#0A0A0A] px-6 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#F5F0E8] transition-colors hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A0A0A]"
      >
        <Plus className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-[#0A0A0A]/10 bg-white px-8 py-14 text-center">
      <Icon className="mx-auto mb-4 h-10 w-10 text-[#9A9A8A]" />
      <p className="font-serif text-[1.8rem] leading-none tracking-[-0.02em] text-[#0A0A0A]">
        {title}
      </p>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#9A9A8A]">{description}</p>
    </div>
  );
}

function Notice({
  tone,
  message,
}: {
  tone: 'success' | 'error';
  message: string;
}) {
  const styles =
    tone === 'success'
      ? 'border-[#C9A84C]/25 bg-[#EFE6D0] text-[#8A6E2F]'
      : 'border-[#9C4C3A]/18 bg-[#F7E3DE] text-[#9C4C3A]';

  return (
    <div className={`mt-6 flex items-center gap-3 border px-5 py-4 text-sm ${styles}`}>
      {tone === 'success' ? (
        <Check className="h-5 w-5 shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
}
