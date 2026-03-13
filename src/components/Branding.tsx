import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Palette, 
  Type, 
  Layout, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  AlertTriangle,
  X,
  Globe,
  Hash
} from 'lucide-react';
import { Branding as BrandingType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from './PageHeader';

interface Props {
  branding: BrandingType[];
  onUpdate: () => void;
}

const DEFAULT_BRANDING: Partial<BrandingType> = {
  company_name: 'New Brand Profile',
  primary_color_hex: '#1E97AB',
  secondary_color_hex: '#359288',
  accent_color_hex: '#518E58',
  background_color_hex: '#FEFEFE',
  heading_font_family: 'Montserrat',
  body_font_family: 'Montserrat',
  default_cta_text: 'WhatsApp Now',
  website_url: 'www.proppost.co.za',
  logo_url: 'https://picsum.photos/seed/logo/200/200',
  watermark_logo_optional_url: '',
  default_hashtags_optional: '#RealEstate #LuxuryLiving'
};

export default function Branding({ branding, onUpdate }: Props) {
  const { token } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<BrandingType | null>(branding[0] || null);
  const [formData, setFormData] = useState<Partial<BrandingType>>(selectedProfile || DEFAULT_BRANDING);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState<{ logo: boolean, watermark: boolean }>({ logo: false, watermark: false });
  const [profileToDelete, setProfileToDelete] = useState<BrandingType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedProfile) {
      setFormData(selectedProfile);
    } else if (branding.length > 0) {
      setSelectedProfile(branding[0]);
      setFormData(branding[0]);
    } else {
      setFormData(DEFAULT_BRANDING);
    }
  }, [selectedProfile, branding]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const isNew = !formData.id;
      const url = isNew ? '/api/branding' : `/api/branding/${formData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        if (isNew) {
          // If it was a new profile, we might want to select it
          // But onUpdate will refetch and we'll handle it in useEffect
        }
        onUpdate();
        alert('Brand identity saved successfully!');
      }
    } catch (error) {
      console.error("Error saving branding:", error);
      alert('Failed to save brand identity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!profileToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/branding/${profileToDelete.id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        if (selectedProfile?.id === profileToDelete.id) {
          setSelectedProfile(null);
        }
        setProfileToDelete(null);
        onUpdate();
      }
    } catch (error) {
      console.error("Error deleting branding:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'watermark') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(prev => ({ ...prev, [type]: true }));
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      });
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ 
          ...prev, 
          [type === 'logo' ? 'logo_url' : 'watermark_logo_optional_url']: url 
        }));
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleAddNew = () => {
    setSelectedProfile(null);
    setFormData(DEFAULT_BRANDING);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <PageHeader 
        title="Branding" 
        subtitle="Configure visual identities for your agencies and sub-brands"
        action={
          <div className="flex gap-3">
            <button 
              onClick={handleAddNew}
              className="px-6 py-4 border border-gray-200 rounded-2xl text-[11px] font-mono uppercase tracking-[0.2em] hover:bg-gray-50 transition-all flex items-center gap-3 bg-white shadow-sm active:scale-95"
            >
              <Plus size={16} /> 
              <span>New Profile</span>
            </button>
            <button 
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-brand-teal text-white px-8 py-4 rounded-2xl flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.2em] hover:bg-brand-dark-teal transition-all shadow-xl shadow-brand-teal/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Save size={16} />}
              <span>{isSubmitting ? 'Saving...' : 'Save Identity'}</span>
            </button>
          </div>
        }
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {profileToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6"
            >
              <div className="flex items-center gap-4 text-red-600">
                <div className="p-3 bg-red-50 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Delete Brand Profile?</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone. All history associated with this brand will remain but the profile will be removed.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Profile to delete</p>
                <p className="font-bold text-gray-900">{profileToDelete.company_name}</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setProfileToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {isDeleting ? 'Deleting...' : 'Delete Profile'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Profile List */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Active Profiles</h3>
          <div className="space-y-3">
            {branding.map(b => (
              <div key={b.id} className="relative group">
                <button 
                  onClick={() => { setSelectedProfile(b); setFormData(b); }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${
                    selectedProfile?.id === b.id ? 'border-brand-teal bg-brand-teal/5 ring-1 ring-brand-teal' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2 border border-gray-100 shadow-sm">
                    <img src={b.logo_url} className="w-full h-full object-contain" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{b.company_name}</p>
                    <div className="flex gap-1 mt-1">
                      <div className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: b.primary_color_hex }} />
                      <div className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: b.secondary_color_hex }} />
                      <div className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: b.accent_color_hex }} />
                    </div>
                  </div>
                  {selectedProfile?.id === b.id && <CheckCircle2 size={16} className="text-brand-teal" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setProfileToDelete(b); }}
                  className="absolute -top-2 -right-2 p-1.5 bg-white border border-gray-100 rounded-full text-gray-300 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {branding.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-xs text-gray-400">No profiles found. Create your first brand identity.</p>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Editor */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-10">
            <div className="space-y-6">
              <SectionHeader icon={<ImageIcon size={14} />} label="Brand Name" />
              <input 
                className="text-2xl font-bold text-gray-900 w-full bg-transparent border-b border-gray-100 focus:border-brand-teal outline-none pb-2 transition-all"
                value={formData.company_name || ''}
                placeholder="Enter Company Name"
                onChange={e => setFormData({...formData, company_name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <SectionHeader icon={<Palette size={14} />} label="Color Palette" />
                <div className="grid grid-cols-2 gap-4">
                  <ColorInput label="Primary" value={formData.primary_color_hex || '#000'} onChange={v => setFormData({...formData, primary_color_hex: v})} />
                  <ColorInput label="Secondary" value={formData.secondary_color_hex || '#000'} onChange={v => setFormData({...formData, secondary_color_hex: v})} />
                  <ColorInput label="Accent" value={formData.accent_color_hex || '#000'} onChange={v => setFormData({...formData, accent_color_hex: v})} />
                  <ColorInput label="Background" value={formData.background_color_hex || '#fff'} onChange={v => setFormData({...formData, background_color_hex: v})} />
                </div>
              </div>

              <div className="space-y-6">
                <SectionHeader icon={<Type size={14} />} label="Typography" />
                <div className="space-y-4">
                  <TextInput label="Heading Font" value={formData.heading_font_family || ''} onChange={v => setFormData({...formData, heading_font_family: v})} />
                  <TextInput label="Body Font" value={formData.body_font_family || ''} onChange={v => setFormData({...formData, body_font_family: v})} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-gray-100">
              <div className="space-y-6">
                <SectionHeader icon={<Layout size={14} />} label="Assets & Digital" />
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Main Logo</label>
                      <div className="relative group aspect-square bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center p-4">
                        {formData.logo_url ? (
                          <img src={formData.logo_url} className="max-w-full max-h-full object-contain" alt="" />
                        ) : (
                          <ImageIcon className="text-gray-300" size={32} />
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
                          <Upload size={20} />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                        </label>
                        {isUploading.logo && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Watermark</label>
                      <div className="relative group aspect-square bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center p-4">
                        {formData.watermark_logo_optional_url ? (
                          <img src={formData.watermark_logo_optional_url} className="max-w-full max-h-full object-contain" alt="" />
                        ) : (
                          <ImageIcon className="text-gray-300" size={32} />
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
                          <Upload size={20} />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'watermark')} />
                        </label>
                        {isUploading.watermark && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <TextInput icon={<Globe size={14} />} label="Website URL" value={formData.website_url || ''} onChange={v => setFormData({...formData, website_url: v})} />
                    <TextInput icon={<Layout size={14} />} label="Default CTA Text" value={formData.default_cta_text || ''} onChange={v => setFormData({...formData, default_cta_text: v})} />
                    <TextInput icon={<Hash size={14} />} label="Default Hashtags" value={formData.default_hashtags_optional || ''} onChange={v => setFormData({...formData, default_hashtags_optional: v})} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <SectionHeader icon={<Sparkles size={14} />} label="Live Preview" />
                <div 
                  className="p-8 rounded-3xl shadow-2xl space-y-6 border border-gray-100 relative overflow-hidden min-h-[300px] flex flex-col justify-center"
                  style={{ backgroundColor: formData.background_color_hex }}
                >
                  {/* Decorative background element */}
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-16 -mt-16"
                    style={{ backgroundColor: formData.primary_color_hex }}
                  />
                  
                  <div className="relative z-10 space-y-6">
                    <img src={formData.logo_url} className="h-10 object-contain" alt="" />
                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold leading-tight" style={{ color: formData.primary_color_hex, fontFamily: formData.heading_font_family }}>Luxury Ocean Villa</h4>
                      <p className="text-xs opacity-60" style={{ fontFamily: formData.body_font_family, color: formData.primary_color_hex }}>Camps Bay, Cape Town • R 25,000,000</p>
                    </div>
                    <div className="pt-4">
                      <button 
                        className="w-full py-4 rounded-2xl text-white text-xs font-mono uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform"
                        style={{ backgroundColor: formData.primary_color_hex }}
                      >
                        {formData.default_cta_text}
                      </button>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-black/5">
                      <p className="text-[10px] font-mono opacity-40" style={{ color: formData.primary_color_hex }}>{formData.website_url}</p>
                      {formData.watermark_logo_optional_url && (
                        <img src={formData.watermark_logo_optional_url} className="h-4 opacity-30 grayscale" alt="" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-gray-400">
      {icon} {label}
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">{label}</label>
      <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl bg-gray-50 hover:border-gray-300 transition-colors">
        <input 
          type="color" 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none p-0"
        />
        <input 
          type="text" 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="flex-1 text-[10px] font-mono uppercase outline-none bg-transparent"
        />
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, icon }: { label: string, value: string, onChange: (v: string) => void, icon?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input 
          type="text" 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className={`w-full ${icon ? 'pl-10' : 'px-4'} py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal transition-all`}
        />
      </div>
    </div>
  );
}
