import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Layout, 
  Image as ImageIcon, 
  Type as LucideType, 
  Download, 
  Copy,
  Eye,
  Instagram,
  Facebook,
  Linkedin,
  Video,
  Search,
  Sparkles,
  User,
  Palette,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Grid,
  Globe,
  List as ListIcon,
  RefreshCw,
  ArrowRight,
  X,
  Home,
  MapPin,
  Phone,
  Clock,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Property, Agent, Branding, PostConfig, Amenity, Template, ScheduledPost } from '../types';
import { postGenerator } from '../services/postGenerator';
import TemplatePreview from './TemplatePreview';
import TemplateLibrary from './TemplateLibrary';
import PageHeader from './PageHeader';
import StudioPreview from './StudioPreview';
import { exportFlyer, type FlyerFormat, type FlyerRatio } from '../services/flyerExport';

interface Props {
  properties: Property[];
  agents: Agent[];
  branding: Branding;
  amenities: Amenity[];
  onComplete: () => void;
}

const PLATFORMS = [
  { id: '1:1', name: 'Square', icon: <Grid className="w-4 h-4" />, desc: '1080x1080 (FB Video, LI Post)' },
  { id: '4:5', name: 'Portrait', icon: <ListIcon className="w-4 h-4" />, desc: '1080x1350 (IG Post)' },
  { id: '9:16', name: 'Vertical', icon: <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center text-[8px] font-bold">9:16</div>, desc: '1080x1920 (Stories, Reels, Shorts)' },
  { id: '1.91:1', name: 'Landscape', icon: <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center text-[8px] font-bold">1.9:1</div>, desc: '1200x630 (FB Post)' },
  { id: '16:9', name: 'Widescreen', icon: <Video className="w-4 h-4" />, desc: '1920x1080 (YouTube Video)' },
];

const STYLES = ['Modern', 'Luxury', 'Minimal', 'Bold', 'Editorial', 'Just Sold', 'Price Badge', 'Editorial Banner'] as const;

const FORMAT_OPTIONS = [
  { platform: 'Facebook', label: 'Post', dimensions: '1200 x 630 px', ratio: '1.91:1', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg', type: 'image' },
  { platform: 'Facebook', label: 'Story', dimensions: '1080 x 1920 px', ratio: '9:16', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg', type: 'image' },
  { platform: 'Facebook', label: 'Video', dimensions: '1080 x 1080 px', ratio: '1:1', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg', type: 'video' },
  { platform: 'Instagram', label: 'Story', dimensions: '1080 x 1920 px', ratio: '9:16', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg', type: 'image' },
  { platform: 'Instagram', label: 'Reel', dimensions: '1080 x 1920 px', ratio: '9:16', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg', type: 'video' },
  { platform: 'Instagram', label: 'Post (4:5)', dimensions: '1080 x 1350 px', ratio: '4:5', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg', type: 'image' },
  { platform: 'LinkedIn', label: 'Post', dimensions: '1200 x 1200 px', ratio: '1:1', icon: 'https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg', type: 'image' },
  { platform: 'LinkedIn', label: 'Video', dimensions: '1080 x 1920 px', ratio: '9:16', icon: 'https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg', type: 'video' },
  { platform: 'TikTok', label: 'Video', dimensions: '1080 x 1920 px', ratio: '9:16', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg', type: 'video' },
  { platform: 'TikTok', label: 'Story', dimensions: '1080 x 1920 px', ratio: '9:16', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg', type: 'image' },
  { platform: 'YouTube', label: 'Video', dimensions: '1920 x 1080 px', ratio: '16:9', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg', type: 'video' },
  { platform: 'YouTube', label: 'Shorts', dimensions: '1080 x 1920 px', ratio: '9:16', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg', type: 'video' },
];

export default function PostBuilder({ properties, agents, branding, amenities, onComplete }: Props) {
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<typeof FORMAT_OPTIONS[0] | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [scheduleConfig, setScheduleConfig] = useState<{
    mode: 'now' | 'later';
    date: string;
    time: string;
  }>({
    mode: 'now',
    date: new Date().toISOString().split('T')[0],
    time: '10:30'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [studioMessage, setStudioMessage] = useState('');
  const [isExportingFlyer, setIsExportingFlyer] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');

  useEffect(() => {
    fetch('/api/templates', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(setTemplates);
  }, [token]);

  const [config, setConfig] = useState<PostConfig>({
    brandingId: branding?.id || 0,
    propertyId: 0,
    agentId: 0,
    templateId: 1, // Default to first template
    selectedAmenities: [],
    selectedFacts: {
      price: true,
      beds: true,
      baths: true,
      parking: true,
      size: true,
      location: true
    },
    selectedImages: [],
    layoutStyle: 'Modern',
    selectedPlatforms: ['1:1'],
    activePreviewPlatform: '1:1',
    contactToggles: {
      whatsapp: true,
      cell: true,
      email: true,
      photo: true
    }
  });

  const selectedProperty = properties.find(p => p.id === config.propertyId);
  const selectedAgent = agents.find(a => a.id === config.agentId);
  const selectedTemplate = templates.find(t => t.id === config.templateId);

  const handlePropertySelect = async (id: number) => {
    setIsLoadingProperty(true);
    try {
      const res = await fetch(`/api/properties/${id}/full`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      setConfig(prev => ({
        ...prev,
        propertyId: id,
        selectedImages: data.defaults.defaultSelectedImages.slice(0, 3), // Load hero + 2 supporting
        selectedAmenities: data.defaults.defaultAmenitiesToShow,
        headlineOverride: data.defaults.defaultHeadline,
        captionOverride: data.defaults.defaultCaption,
        subheadlineOverride: `${data.location_area}, ${data.location_city}`,
        badge: data.listing_type === 'sale' ? 'FOR SALE' : 'TO LET'
      }));

      // Generate AI draft now that we have both property and platform
      if (selectedFormat) {
        await generateAIDraft(id, selectedFormat.platform);
      }

      setStep(2); // Move to Post Type (Template) Selection
    } catch (error) {
      console.error("Error loading property details:", error);
    } finally {
      setIsLoadingProperty(false);
    }
  };

  const generateAIDraft = async (propertyId: number, platform: string) => {
    setIsGenerating(true);
    try {
      const property = properties.find(p => p.id === propertyId);
      if (!property) throw new Error("Property not found");

      const agent = agents.find(a => a.id === config.agentId) || agents[0];
      if (!agent) throw new Error("Agent not found");

      const generatedData = await postGenerator.generate(property, agent, platform, token || "");
      
      setConfig(prev => ({
        ...prev,
        headlineOverride: generatedData.headline,
        ctaOverride: generatedData.cta,
        selectedAmenities: property.amenities?.slice(0, 5).map(a => a.name) || [],
        agentId: agent.id,
        captionOverride: `${generatedData.caption}\n\n${generatedData.hashtags.join(' ')}`
      }));
    } catch (error) {
      console.error("Error generating AI draft:", error);
      // Fallback if AI fails
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        const fallbackCaption = `Check out this amazing ${property.listing_type === 'sale' ? 'home for sale' : 'rental'} in ${property.location_area}! 🏠✨\n\nPrice: R ${property.price.toLocaleString()}\nBedrooms: ${property.bedrooms}\nBathrooms: ${property.bathrooms}\n\nDon't miss out! Contact us today.`;
        setConfig(prev => ({
          ...prev,
          headlineOverride: property.title,
          selectedAmenities: property.amenities?.slice(0, 5).map(a => a.name) || [],
          captionOverride: fallbackCaption
        }));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormatSelect = async (format: typeof FORMAT_OPTIONS[0]) => {
    setSelectedFormat(format);
    setConfig(prev => ({
      ...prev,
      selectedPlatforms: [format.ratio as any],
      activePreviewPlatform: format.ratio as any
    }));
    
    setStep(1); // Move to Property Selection
  };

  const handleSchedulePost = async () => {
    if (scheduleConfig.mode === 'later') {
      if (!scheduleConfig.date) {
        alert('Please select a date');
        return;
      }
      if (!scheduleConfig.time) {
        alert('Please select a time');
        return;
      }
      
      const selectedDateTime = new Date(`${scheduleConfig.date}T${scheduleConfig.time}`);
      if (selectedDateTime < new Date()) {
        alert('Cannot schedule posts in the past');
        return;
      }
    }

    if (scheduleConfig.mode !== 'later') {
      setStudioMessage('Automatic publishing is not connected. Export your content for manual publishing.');
      setStep(8);
      return;
    }
    setIsScheduling(true);
    setStudioMessage('');
    try {
      const scheduledPost: ScheduledPost = {
        propertyId: config.propertyId,
        agentId: config.agentId,
        platforms: [selectedFormat?.platform || 'Unknown'],
        caption: config.captionOverride || '',
        imageURL: config.selectedImages[0],
        videoURL: config.videoUrl,
        status: 'scheduled',
        date: scheduleConfig.date,
        time: scheduleConfig.time,
        createdAt: new Date().toISOString(),
        propertyTitle: selectedProperty?.title
      };

      const res = await fetch('/api/scheduled_posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scheduledPost)
      });

      if (!res.ok) throw new Error('Failed to save planned post');
      setStudioMessage('Added to your marketing schedule. This does not publish to social media.');
      onComplete();
      setStep(8);
    } catch (error) {
      console.error("Error scheduling post:", error);
      setStudioMessage('Scheduling failed. You may still export your content manually.');
      setStep(8);
    } finally {
      setIsScheduling(false);
    }
  };

  const exportPost = (format: 'txt' | 'json') => {
    if (!selectedProperty) {
      setStudioMessage('Choose a property before exporting.');
      return;
    }
    const payload = {
      property: selectedProperty.title,
      location: `${selectedProperty.location_area}, ${selectedProperty.location_city}`,
      price: selectedProperty.price,
      agent: selectedAgent?.full_name || '',
      platform: selectedFormat?.platform || '',
      caption: config.captionOverride || '',
      headline: config.headlineOverride || selectedProperty.title,
      cta: config.ctaOverride || '',
      media: config.selectedImages
    };
    const text = [payload.headline, payload.caption, payload.cta].filter(Boolean).join('\n\n');
    const blob = new Blob([format === 'json' ? JSON.stringify(payload, null, 2) : text], {
      type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `proppost-${selectedProperty.id}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStudioMessage('Export prepared. Check your browser downloads.');
  };

  const handleFlyerExport = async (format: FlyerFormat) => {
    if (!selectedProperty) {
      setStudioMessage('Select a property before exporting artwork.');
      return;
    }
    const node = document.getElementById('flyer-export-canvas');
    if (!node) {
      setStudioMessage('The flyer preview is unavailable.');
      return;
    }
    setIsExportingFlyer(true);
    setStudioMessage('');
    try {
      const result = await exportFlyer(node, config.activePreviewPlatform as FlyerRatio, format, `proppost-${selectedProperty.id}-${config.activePreviewPlatform.replace(/[^a-zA-Z0-9]/g, '-')}`);
      setStudioMessage(`Exported ${result.name} at ${result.width} × ${result.height} pixels.`);
    } catch (error) {
      setStudioMessage(error instanceof Error ? error.message : 'Flyer export failed. Please retry.');
    } finally {
      setIsExportingFlyer(false);
    }
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(config.captionOverride || '');
      setStudioMessage('Caption copied.');
    } catch {
      setStudioMessage('Unable to copy. Use the text download instead.');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0: // Platform & Format Selection
        return (
          <div className="space-y-8 py-4">
            {!selectedPlatform ? (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-serif italic">Choose your platform</h2>
                  <p className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.2em]">Select a destination for your creative</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { name: 'Instagram', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg', color: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]', desc: 'Stories, Reels & Posts' },
                    { name: 'Facebook', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg', color: 'bg-[#1877F2]', desc: 'Ads & Feed Content' },
                    { name: 'LinkedIn', icon: 'https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg', color: 'bg-[#0A66C2]', desc: 'Professional Updates' },
                    { name: 'TikTok', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg', color: 'bg-black', invert: true, desc: 'Short-form Video' },
                    { name: 'YouTube', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg', color: 'bg-[#FF0000]', desc: 'Videos & Shorts' },
                  ].map(p => (
                    <button
                      key={p.name}
                      onClick={() => setSelectedPlatform(p.name)}
                      className={`group relative overflow-hidden rounded-3xl p-6 text-left transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] border border-gray-100 ${selectedPlatform === p.name ? 'ring-4 ring-brand-teal/20 border-brand-teal bg-brand-teal/5' : 'bg-white'}`}
                    >
                      <div className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-5 ${p.color}`}></div>
                      <div className={`mb-4 inline-flex p-3 rounded-xl text-white shadow-lg transform group-hover:scale-110 group-hover:-rotate-3 transition-all ${p.color}`}>
                        <img src={p.icon} className={`w-6 h-6 object-contain ${p.invert ? 'invert' : ''}`} alt={p.name} />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                        <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest leading-tight">{p.desc}</p>
                      </div>
                      <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center">
                          <ArrowRight size={12} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => {
                        setSelectedPlatform(null);
                        setSelectedFormat(null);
                      }}
                      className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-black hover:text-white rounded-full transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <div>
                      <h2 className="text-3xl font-serif italic">{selectedPlatform} Formats</h2>
                      <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Choose the optimal dimensions</p>
                    </div>
                  </div>
                  
                  {/* Current Platform Badge */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                    <img 
                      src={
                        selectedPlatform === 'Instagram' ? 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg' :
                        selectedPlatform === 'Facebook' ? 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg' :
                        selectedPlatform === 'LinkedIn' ? 'https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg' :
                        selectedPlatform === 'TikTok' ? 'https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg' :
                        'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg'
                      } 
                      className={`w-5 h-5 object-contain ${selectedPlatform === 'TikTok' ? 'invert' : ''}`} 
                      alt="" 
                    />
                    <span className="text-xs font-bold">{selectedPlatform}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {FORMAT_OPTIONS.filter(f => f.platform === selectedPlatform).map(f => (
                    <button
                      key={f.label}
                      onClick={() => handleFormatSelect(f)}
                      disabled={isGenerating}
                      className="w-full p-6 bg-white border-2 border-gray-100 rounded-[1.5rem] flex items-center justify-between hover:border-brand-teal hover:shadow-xl transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-brand-teal/10 transition-colors">
                          <img src={f.icon} className={`w-6 h-6 object-contain ${f.platform === 'TikTok' ? 'invert' : ''}`} alt="" />
                        </div>
                        <div className="text-left">
                          <div className="text-lg font-bold group-hover:text-brand-teal transition-colors">{f.label}</div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{f.dimensions}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                            <span className="text-[10px] font-mono text-brand-teal font-bold">{f.ratio} Ratio</span>
                            {f.type === 'video' && (
                              <span className="px-2 py-0.5 bg-brand-teal/10 text-brand-teal text-[8px] font-mono rounded uppercase">Video</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-brand-teal group-hover:border-brand-teal group-hover:text-white transition-all">
                        {isGenerating && selectedFormat?.label === f.label ? (
                          <RefreshCw className="animate-spin" size={18} />
                        ) : (
                          <ArrowRight size={18} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 1: // Property Selection
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif italic">Select a Property</h2>
              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.2em]">Choose the listing you want to promote</p>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search by title, area or city..." 
                value={propertySearch}
                onChange={e => setPropertySearch(e.target.value)}
                className="w-full pl-12 pr-4 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-base outline-none focus:ring-4 focus:ring-brand-teal/10 focus:border-brand-teal focus:bg-white transition-all" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {properties
                .filter(p => 
                  (p.title?.toLowerCase() || '').includes(propertySearch.toLowerCase()) ||
                  (p.location_city?.toLowerCase() || '').includes(propertySearch.toLowerCase()) ||
                  (p.location_area?.toLowerCase() || '').includes(propertySearch.toLowerCase())
                )
                .map(p => (
                <button 
                  key={p.id}
                  onClick={() => handlePropertySelect(p.id)}
                  disabled={isLoadingProperty}
                  className={`group relative p-5 text-left border-2 rounded-2xl transition-all flex flex-col gap-4 ${
                    config.propertyId === p.id 
                      ? 'border-brand-teal bg-brand-teal/5 shadow-lg shadow-brand-teal/10' 
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-brand-teal/10 group-hover:text-brand-teal transition-colors">
                      <Home size={24} />
                    </div>
                    {config.propertyId === p.id && (
                      <div className="bg-brand-teal text-white p-1 rounded-full">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg leading-tight mb-1">{p.title}</div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                      <MapPin size={10} /> {p.location_area}, {p.location_city}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand-teal">R {p.price.toLocaleString()}</span>
                    <span className="text-[9px] font-mono text-gray-300 uppercase">{p.listing_type}</span>
                  </div>
                  {isLoadingProperty && config.propertyId === p.id && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                      <RefreshCw className="animate-spin text-brand-teal" size={24} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      case 2: // Post Type (Template)
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Selected Template</label>
                <button 
                  onClick={() => setIsLibraryOpen(true)}
                  className="text-[10px] font-mono text-brand-teal hover:underline flex items-center gap-1"
                >
                  Browse Library <ArrowRight size={12} />
                </button>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                  <img src={selectedTemplate?.thumbnail_url} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{selectedTemplate?.name || 'Loading...'}</div>
                  <div className="text-[10px] text-gray-400 capitalize">{selectedTemplate?.style_theme} • {selectedTemplate?.category.replace('_', ' ')}</div>
                </div>
                <button 
                  onClick={() => setIsLibraryOpen(true)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:border-brand-teal transition-all"
                >
                  Change
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Select Platforms</label>
                <span className="text-[10px] font-mono text-gray-400 italic">Click icon to set as Active Preview</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {PLATFORMS.map(p => {
                  const isSelected = config.selectedPlatforms.includes(p.id as any);
                  const isActive = config.activePreviewPlatform === p.id;
                  const isSupported = selectedTemplate?.supported_formats.includes(p.id as any);

                  return (
                    <div 
                      key={p.id}
                      className={`p-4 border rounded-xl flex items-center gap-4 transition-all relative ${isSelected ? 'border-brand-teal bg-brand-teal/5' : 'border-gray-200 bg-white hover:border-gray-300'} ${!isSupported ? 'opacity-50 grayscale' : ''}`}
                    >
                      <button 
                        onClick={() => {
                          const current = config.selectedPlatforms;
                          const next = current.includes(p.id as any) 
                            ? current.filter(id => id !== p.id) 
                            : [...current, p.id as any];
                          
                          if (next.length > 0) {
                            setConfig({
                              ...config, 
                              selectedPlatforms: next,
                              activePreviewPlatform: next.includes(config.activePreviewPlatform) ? config.activePreviewPlatform : next[0]
                            });
                          }
                        }}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-teal border-brand-teal text-white' : 'border-gray-300 hover:border-brand-teal'}`}
                      >
                        {isSelected && <CheckCircle2 size={12} />}
                      </button>

                      <button 
                        onClick={() => {
                          if (!isSelected) {
                            setConfig({
                              ...config,
                              selectedPlatforms: [...config.selectedPlatforms, p.id as any],
                              activePreviewPlatform: p.id as any
                            });
                          } else {
                            setConfig({...config, activePreviewPlatform: p.id as any});
                          }
                        }}
                        className={`p-2 rounded-lg transition-all ${isActive ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20' : 'bg-gray-50 text-gray-400 hover:text-brand-teal'}`}
                        title="Set as Active Preview"
                      >
                        {p.icon}
                      </button>

                      <div className="flex-1">
                        <div className="text-sm font-bold flex items-center gap-2">
                          {p.name}
                          {!isSupported && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono uppercase">Not Optimized</span>}
                        </div>
                        <div className="text-[10px] text-gray-400">{p.desc}</div>
                      </div>

                      {isActive && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse"></div>
                          <span className="text-[8px] font-mono uppercase text-brand-teal font-bold">Previewing</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 3: // Review Content (Text)
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold">AI Generated Content</h4>
              <button 
                onClick={() => generateAIDraft(config.propertyId, selectedFormat?.platform || 'Instagram')}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-brand-teal/10 text-brand-teal rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
                Regenerate Draft
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Headline</label>
              <input 
                type="text" 
                value={config.headlineOverride || ''} 
                onChange={e => setConfig({...config, headlineOverride: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Subheadline</label>
              <input 
                type="text" 
                value={config.subheadlineOverride || ''} 
                onChange={e => setConfig({...config, subheadlineOverride: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Caption / Description</label>
              <textarea 
                rows={6}
                value={config.captionOverride || ''} 
                onChange={e => setConfig({...config, captionOverride: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">CTA Text</label>
              <input 
                type="text" 
                value={config.ctaOverride || ''} 
                onChange={e => setConfig({...config, ctaOverride: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
          </div>
        );
      case 4: // Select Media
        return (
          <div className="space-y-8">
            {/* Video Upload Section */}
            {selectedFormat?.type === 'video' && (
              <div className="space-y-6 p-8 bg-[#0F0F0F] rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-brand-dark-teal"></div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-teal text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-teal/20">
                      <Video size={24} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">Source Video</h4>
                      <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Upload content for {selectedFormat.platform}</p>
                    </div>
                  </div>
                  {config.videoUrl && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[9px] font-mono uppercase font-bold">Ready</span>
                    </div>
                  )}
                </div>
                
                <div className="relative group/upload">
                  <input 
                    type="file" 
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setConfig({...config, videoUrl: url});
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full py-12 border-2 border-dashed rounded-[1.5rem] flex flex-col items-center justify-center gap-4 transition-all ${config.videoUrl ? 'border-brand-teal/50 bg-brand-teal/5' : 'border-white/10 hover:border-brand-teal/50 hover:bg-white/5'}`}>
                    {config.videoUrl ? (
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 size={32} />
                        </div>
                        <div>
                          <p className="text-white font-bold">Video Processed</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfig({...config, videoUrl: undefined});
                            }}
                            className="text-[10px] text-white/40 hover:text-red-400 mt-2 font-mono uppercase tracking-widest transition-colors"
                          >
                            Click to replace video
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white/5 text-white/20 rounded-full flex items-center justify-center group-hover/upload:bg-brand-teal/20 group-hover/upload:text-brand-teal transition-all">
                          <Download size={32} className="rotate-180" />
                        </div>
                        <div className="text-center">
                          <p className="text-white/60 font-bold">Drop your video here</p>
                          <p className="text-[10px] text-white/20 mt-2 font-mono uppercase tracking-widest">MP4, MOV or WEBM • Max 50MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Image Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">Media Selection (3-6)</label>
                <span className="text-[10px] font-mono text-brand-teal font-bold">{config.selectedImages.length} / 6 Selected</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {selectedProperty?.images?.map(img => (
                  <button 
                    key={img.id}
                    onClick={() => {
                      const current = config.selectedImages;
                      if (current.includes(img.image_url)) {
                        setConfig({...config, selectedImages: current.filter(u => u !== img.image_url)});
                      } else if (current.length < 6) {
                        setConfig({...config, selectedImages: [...current, img.image_url]});
                      }
                    }}
                    className={`aspect-square rounded-2xl overflow-hidden border-4 transition-all relative group ${
                      config.selectedImages.includes(img.image_url) 
                        ? 'border-brand-teal shadow-lg shadow-brand-teal/20 scale-95' 
                        : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <img src={img.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                    {config.selectedImages.includes(img.image_url) ? (
                      <div className="absolute inset-0 bg-brand-teal/40 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="w-10 h-10 bg-white text-brand-teal rounded-full flex items-center justify-center shadow-xl">
                          <CheckCircle2 size={24} />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center">
                          <Sparkles size={16} />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 5: // Amenities
        return (
          <div className="space-y-12">
            {/* Hardware-style Toggles */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">Visibility Controls</label>
                <div className="h-px flex-1 bg-gray-100 mx-6"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ToggleButton label="Price" active={config.selectedFacts.price} onClick={() => setConfig({...config, selectedFacts: {...config.selectedFacts, price: !config.selectedFacts.price}})} />
                <ToggleButton label="Beds/Baths" active={config.selectedFacts.beds} onClick={() => setConfig({...config, selectedFacts: {...config.selectedFacts, beds: !config.selectedFacts.beds, baths: !config.selectedFacts.beds}})} />
                <ToggleButton label="Parking" active={config.selectedFacts.parking} onClick={() => setConfig({...config, selectedFacts: {...config.selectedFacts, parking: !config.selectedFacts.parking}})} />
                <ToggleButton label="Floor Size" active={config.selectedFacts.size} onClick={() => setConfig({...config, selectedFacts: {...config.selectedFacts, size: !config.selectedFacts.size}})} />
              </div>
            </div>

            {/* Badge Selector */}
            <div className="space-y-6">
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 block">Status Overlay</label>
              <div className="flex flex-wrap gap-3">
                {['FOR SALE', 'TO LET', 'NEWLY RENOVATED', 'HOT DEAL', 'PRICE REDUCED'].map(b => (
                  <button 
                    key={b}
                    onClick={() => setConfig({...config, badge: b})}
                    className={`px-5 py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest border-2 transition-all ${
                      config.badge === b 
                        ? 'bg-black text-white border-black shadow-xl' 
                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 6: // Agent Selection
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map(a => (
                <button 
                  key={a.id}
                  onClick={() => setConfig({...config, agentId: a.id})}
                  className={`group relative p-6 text-left border-2 rounded-3xl flex items-center gap-6 transition-all ${
                    config.agentId === a.id 
                      ? 'border-brand-teal bg-brand-teal/5 shadow-xl shadow-brand-teal/10' 
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`absolute -inset-1 rounded-full blur-sm transition-opacity ${config.agentId === a.id ? 'bg-brand-teal opacity-30' : 'bg-transparent opacity-0'}`}></div>
                    <img src={a.profile_photo_url} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md relative z-10" alt="" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xl mb-1 group-hover:text-brand-teal transition-colors">{a.full_name}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-mono mb-3">{a.role_optional || 'Real Estate Agent'}</div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"><Phone size={10} /></div>
                      <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"><LucideType size={10} /></div>
                    </div>
                  </div>
                  {config.agentId === a.id && (
                    <div className="absolute top-6 right-6 bg-brand-teal text-white p-1.5 rounded-full shadow-lg">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      case 7: // Schedule
        const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = (year: number, month: number) => {
          const day = new Date(year, month, 1).getDay();
          return day === 0 ? 6 : day - 1; // Adjust to start from Monday (0)
        };

        const currentYear = calendarDate.getFullYear();
        const currentMonth = calendarDate.getMonth();
        const days = daysInMonth(currentYear, currentMonth);
        const firstDay = firstDayOfMonth(currentYear, currentMonth);
        
        const prevMonthDays = daysInMonth(currentYear, currentMonth - 1);
        const calendarDays = [];

        // Previous month padding
        for (let i = firstDay - 1; i >= 0; i--) {
          calendarDays.push({ day: prevMonthDays - i, currentMonth: false });
        }
        // Current month
        for (let i = 1; i <= days; i++) {
          calendarDays.push({ day: i, currentMonth: true });
        }
        // Next month padding
        const remaining = 42 - calendarDays.length;
        for (let i = 1; i <= remaining; i++) {
          calendarDays.push({ day: i, currentMonth: false });
        }

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        const handleDateSelect = (day: number) => {
          const selectedDate = new Date(currentYear, currentMonth, day);
          setScheduleConfig({
            ...scheduleConfig,
            mode: 'later',
            date: selectedDate.toISOString().split('T')[0]
          });
        };

        const isSelected = (day: number) => {
          const d = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
          return scheduleConfig.date === d;
        };

        return (
          <div className="max-w-md mx-auto space-y-4">
            {/* Schedule to post later button (Image 1) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-gray-900" />
              </div>
              <span className="text-gray-700 font-medium">Schedule to post later</span>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Canva Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep(step - 1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-gray-900" />
                    <span className="font-bold text-gray-900">Schedule</span>
                  </div>
                </div>
                <button onClick={() => setStep(0)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-8 px-2">
                  <button 
                    onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1))}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronLeft size={18} className="text-gray-400" />
                  </button>
                  <h3 className="font-medium text-gray-700">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <button 
                    onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1))}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                </div>

                {/* Day Names */}
                <div className="grid grid-cols-7 mb-4">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-[11px] font-medium text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-2">
                  {calendarDays.map((item, idx) => (
                    <div key={idx} className="flex justify-center items-center aspect-square">
                      {item.currentMonth ? (
                        <button
                          onClick={() => handleDateSelect(item.day)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all ${
                            isSelected(item.day)
                              ? 'bg-[#7d2ae8] text-white font-bold shadow-lg shadow-[#7d2ae8]/30'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.day}
                        </button>
                      ) : (
                        <span className="text-gray-300 text-sm">{item.day}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Time Input */}
                <div className="mt-10">
                  <div className="relative group">
                    <input 
                      type="text"
                      value={scheduleConfig.time}
                      onChange={e => setScheduleConfig({...scheduleConfig, time: e.target.value})}
                      placeholder="00:00"
                      className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#7d2ae8] focus:ring-4 focus:ring-[#7d2ae8]/5 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-mono text-gray-400 uppercase tracking-wider bg-white pl-2">
                      UTC +2
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleSchedulePost}
                  disabled={isScheduling}
                  className="w-full mt-8 bg-[#7d2ae8] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#6a24c7] transition-all shadow-xl shadow-[#7d2ae8]/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isScheduling ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Scheduling...
                    </>
                  ) : 'Next'}
                </button>
              </div>
            </div>
          </div>
        );
      case 8: // Export
        return (
          <div className="space-y-8 text-center py-12">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-serif italic">Export property post</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">Download your caption or structured post data. Image and video downloads require a separate validated rendering pipeline.</p>
            {studioMessage && <p role="status" className="rounded-xl bg-teal-50 p-3 text-sm text-teal-900">{studioMessage}</p>}
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
              {(['png', 'jpeg', 'pdf'] as const).map(format => <button key={format} type="button" disabled={isExportingFlyer || !selectedProperty} onClick={() => handleFlyerExport(format)} className="rounded-xl bg-teal-700 py-3 text-xs font-bold uppercase text-white disabled:opacity-50">{format === 'jpeg' ? 'JPG' : format.toUpperCase()}</button>)}
            </div>
            <div className="grid grid-cols-1 gap-3 pt-8 max-w-md mx-auto">
              <button type="button" onClick={() => exportPost('txt')} className="w-full bg-brand-teal text-white py-4 rounded-xl font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Download size={18} /> Download caption (.txt)</button>
              <button type="button" onClick={() => exportPost('json')} className="w-full border border-gray-200 py-4 rounded-xl font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Download size={18} /> Export post data (.json)</button>
              <button type="button" onClick={copyCaption} className="w-full border border-gray-200 py-4 rounded-xl font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Copy size={18} /> Copy caption</button>
              <button type="button" onClick={() => setStep(7)} className="text-sm text-teal-700 underline">Back to scheduling</button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full relative">
      <PageHeader 
        title="Post Builder" 
        subtitle="Create branded real estate marketing posts, then preview and export"
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <div 
                  key={s}
                  className={`w-2 h-2 rounded-full mx-1.5 transition-all ${step === s ? 'bg-brand-teal scale-125' : s < step ? 'bg-brand-teal/40' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        }
      />

      <div className="flex min-w-0 flex-col gap-4 relative">
      <AnimatePresence>
        {isLibraryOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[100] p-12 overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="text-4xl font-serif italic mb-2">Template Library</h2>
                  <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Select a professional layout for your post</p>
                </div>
                <button 
                  onClick={() => setIsLibraryOpen(false)}
                  className="p-4 bg-black text-white rounded-full hover:scale-110 transition-all shadow-xl"
                >
                  <X size={24} />
                </button>
              </div>
              <TemplateLibrary 
                branding={branding}
                selectedTemplateId={config.templateId}
                property={selectedProperty}
                agent={selectedAgent}
                onSelect={(t) => {
                  setConfig({
                    ...config, 
                    templateId: t.id,
                    layoutStyle: t.style_theme.charAt(0).toUpperCase() + t.style_theme.slice(1) as any,
                    previewLayout: t.style_theme === 'minimal' ? 'minimal' : t.style_theme === 'luxury' ? 'classic' : 'editorial'
                  });
                  setIsLibraryOpen(false);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left: Steps Rail */}
      <div className="flex w-full shrink-0 items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(s => {
          const isVideo = selectedFormat?.type === 'video';
          const isSkipped = isVideo && [2].includes(s); // Only skip Template for video
          if (isSkipped) return null;

          const icons = [
            selectedFormat ? (
              <img src={selectedFormat.icon} className={`w-5 h-5 object-contain ${selectedFormat.platform === 'TikTok' ? 'invert' : ''}`} alt="" />
            ) : <Layout size={20} />,
            <Home size={20} />,
            <Palette size={20} />,
            <Sparkles size={20} />,
            <ImageIcon size={20} />,
            <ToggleRight size={20} />,
            <User size={20} />,
            <Clock size={20} />,
            <Download size={20} />
          ];

          const labels = ['Platform', 'Property', 'Post Type', 'Content', 'Media', 'Amenities', 'Agent', 'Schedule', 'Export'];

          return (
            <button 
              key={s}
              onClick={() => s <= step && setStep(s)}
              disabled={s > step}
              aria-label={`Go to ${labels[s]} step`}
              aria-current={step === s ? 'step' : undefined}
              className={`group relative w-11 h-11 shrink-0 flex items-center justify-center rounded-xl transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 ${
                step === s 
                  ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/30' 
                  : step > s 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
              }`}
            >
              {icons[s]}
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-mono uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                {labels[s]}
              </div>
              {step > s && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle2 size={8} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[220px_minmax(0,1fr)_340px] 2xl:grid-cols-[250px_minmax(0,1fr)_380px]">
        <aside aria-label="Selected property information" className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24 xl:self-start">
          <div className="flex items-center justify-between gap-2">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700">Your listing</p><h3 className="mt-1 text-base font-bold text-slate-900">Property details</h3></div>
            <button type="button" onClick={() => setStep(1)} className="rounded-lg px-2 py-1 text-xs font-bold text-teal-700 hover:bg-teal-50">Change</button>
          </div>
          {selectedProperty ? <>
            <div className="mt-4 aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
              {selectedProperty.images?.[0]?.image_url ? <img src={selectedProperty.images[0].image_url} alt={selectedProperty.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <div className="flex h-full items-center justify-center text-xs text-slate-500">No image uploaded</div>}
            </div>
            <p className="mt-4 text-sm font-bold leading-snug text-slate-900">{selectedProperty.title}</p>
            <p className="mt-1 text-xs text-slate-500">{selectedProperty.location_area}, {selectedProperty.location_city}</p>
            <p className="mt-3 text-xl font-black text-teal-700">R {selectedProperty.price.toLocaleString('en-ZA')}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <span>{selectedProperty.bedrooms} bedrooms</span><span>{selectedProperty.bathrooms} bathrooms</span>
              <span>{selectedProperty.parking} parking</span><span>{selectedProperty.floor_size_m2} m²</span>
            </div>
            {selectedProperty.short_description && <p className="mt-4 line-clamp-5 text-xs leading-5 text-slate-500">{selectedProperty.short_description}</p>}
          </> : <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs leading-5 text-slate-500">Choose a property in the Property step to see its marketing information here.</div>}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Agent</p>
            {selectedAgent ? <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">{selectedAgent.full_name[0]}</span><span className="min-w-0 truncate text-xs font-semibold text-slate-800">{selectedAgent.full_name}</span></div> : <p className="text-xs text-slate-500">No agent selected yet.</p>}
            <button type="button" onClick={() => setStep(6)} className="mt-3 rounded-lg text-xs font-bold text-teal-700 hover:underline">Select agent</button>
          </div>
        </aside>

      {/* Middle: Workspace */}
      <div className="min-w-0 flex flex-col gap-5">
        {/* Selection Summary Card (Context) */}
        {(selectedFormat || selectedProperty) && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-8">
              {selectedFormat && (
                <div className="flex items-center gap-4 pr-8 border-r border-gray-100">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center p-2">
                    <img src={selectedFormat.icon} className={`w-full h-full object-contain ${selectedFormat.platform === 'TikTok' ? 'invert' : ''}`} alt="" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-none mb-1">{selectedFormat.platform}</div>
                    <div className="text-sm font-bold leading-none">{selectedFormat.label}</div>
                  </div>
                </div>
              )}
              {selectedProperty && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden">
                    <img src={selectedProperty.images?.[0]?.image_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{selectedProperty.title} in {selectedProperty.location_area}</h4>
                    <p className="text-brand-teal font-bold text-xs">R {selectedProperty.price.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-6 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              {selectedProperty && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900">{selectedProperty.bedrooms}</span> Beds
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900">{selectedProperty.bathrooms}</span> Baths
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900">{selectedProperty.parking}</span> Garage
                  </div>
                </>
              )}
              {selectedAgent && (
                <div className="flex items-center gap-2 pl-6 border-l border-gray-100">
                  <img src={selectedAgent.profile_photo_url} className="w-6 h-6 rounded-full object-cover border border-gray-100" alt="" referrerPolicy="no-referrer" />
                  <span className="font-bold text-gray-900">{selectedAgent.full_name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm flex flex-col flex-1">
          <div className="px-5 sm:px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="text-2xl font-serif italic leading-none">
                {step === 0 ? 'Select Platform' : step === 1 ? 'Select Property' : step === 2 ? 'Post Type' : step === 3 ? 'Review Content' : step === 4 ? 'Select Media' : step === 5 ? 'Amenities' : step === 6 ? 'Choose Agent' : step === 7 ? 'Schedule Post' : 'Export Post'}
              </h3>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-2">Step {step + 1} of 9 • PropPost Platform</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </div>

          {step < 8 && (
            <div className="px-4 sm:px-8 py-5 border-t border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-gray-50/50">
              <button 
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all disabled:opacity-0"
              >
                <ChevronLeft size={18} /> Back
              </button>
              
              <div className="flex items-center gap-8">
                <div className="hidden md:flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className={`w-8 h-1 rounded-full transition-all ${i === step ? 'bg-brand-teal w-12' : i < step ? 'bg-emerald-400' : 'bg-gray-200'}`}></div>
                  ))}
                </div>
                
                <button 
                  onClick={() => {
                    if (step === 7) {
                      setStep(8);
                    } else {
                      setStep(s => s + 1);
                    }
                  }}
                  disabled={
                    isGenerating || 
                    isScheduling || 
                    (step === 0 && !selectedFormat) || 
                    (step === 1 && !config.propertyId) || 
                    (step === 6 && !config.agentId) || 
                    (step === 4 && config.selectedImages.length < 1 && selectedFormat?.type !== 'video') || 
                    (step === 4 && selectedFormat?.type === 'video' && !config.videoUrl)
                  }
                  className={`px-10 py-4 text-white rounded-2xl text-xs font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl disabled:opacity-20 disabled:grayscale ${step === 7 ? 'bg-[#1E97AB] hover:bg-[#167a8b]' : 'bg-black hover:bg-brand-teal'}`}
                >
                  {isGenerating ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : isScheduling ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : step === 7 ? (
                    'Review export'
                  ) : (
                    'Continue'
                  )} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <StudioPreview
        config={config}
        property={selectedProperty}
        agent={selectedAgent}
        branding={branding}
        platformLabel={selectedFormat?.platform}
        onEditContent={() => setStep(3)}
        onSelectMedia={() => setStep(4)}
        onUpdateConfig={(next) => setConfig(previous => ({ ...previous, ...next }))}
        onExport={handleFlyerExport}
        isExporting={isExportingFlyer}
        exportDisabled={!selectedProperty}
        exportMessage={studioMessage}
      />
      </div>
    </div>
    </div>
  );
}

function ToggleButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between p-4 border-2 rounded-2xl transition-all ${
        active 
          ? 'border-brand-teal bg-brand-teal/5 text-brand-teal shadow-lg shadow-brand-teal/5' 
          : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
      }`}
    >
      <span className="text-[10px] font-mono uppercase tracking-widest font-bold">{label}</span>
      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${active ? 'bg-brand-teal' : 'bg-gray-200'}`}>
        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-4' : 'translate-x-0 shadow-sm'}`}></div>
      </div>
    </button>
  );
}
