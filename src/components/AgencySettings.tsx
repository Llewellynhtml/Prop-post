import React, { useState, useEffect } from 'react';
import { Building2, Upload, Palette, Save, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from './PageHeader';

interface Agency {
  id: string;
  name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
}

export default function AgencySettings() {
  const { token } = useAuth();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchAgency();
  }, []);

  const fetchAgency = async () => {
    try {
      const res = await fetch('/api/agencies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch agency settings');
      const data = await res.json();
      setAgency(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/agencies', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agency)
      });

      if (!res.ok) throw new Error('Failed to update agency settings');
      
      setMessage({ type: 'success', text: 'Agency settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!agency) return <div>Agency not found.</div>;

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Agency Settings" 
        subtitle="Manage your agency profile, branding and identity"
        icon={<Building2 className="text-brand-teal" size={24} />}
      />

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <Building2 size={20} className="text-brand-teal" />
              General Information
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Agency Name</label>
                <input
                  type="text"
                  value={agency.name}
                  onChange={(e) => setAgency({ ...agency, name: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all font-medium"
                  placeholder="Enter agency name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Logo URL</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={agency.logo_url}
                      onChange={(e) => setAgency({ ...agency, logo_url: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all font-medium"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                    {agency.logo_url ? (
                      <img src={agency.logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain p-2" referrerPolicy="no-referrer" />
                    ) : (
                      <Upload size={20} className="text-gray-300" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Branding Colors */}
          <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <Palette size={20} className="text-brand-teal" />
              Brand Identity
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Primary Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={agency.primary_color}
                    onChange={(e) => setAgency({ ...agency, primary_color: e.target.value })}
                    className="w-14 h-14 rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={agency.primary_color}
                    onChange={(e) => setAgency({ ...agency, primary_color: e.target.value })}
                    className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Secondary Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={agency.secondary_color}
                    onChange={(e) => setAgency({ ...agency, secondary_color: e.target.value })}
                    className="w-14 h-14 rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={agency.secondary_color}
                    onChange={(e) => setAgency({ ...agency, secondary_color: e.target.value })}
                    className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-xl">
            <h4 className="font-bold mb-4">Save Changes</h4>
            <p className="text-white/60 text-sm mb-8 leading-relaxed">
              Updating your agency settings will affect how your brand appears across the platform and in generated content.
            </p>
            
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 bg-brand-teal hover:bg-brand-dark-teal disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-teal/20 active:scale-95"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={20} />
                  Save Settings
                </>
              )}
            </button>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                  message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}
              >
                {message.type === 'success' && <CheckCircle2 size={18} />}
                {message.text}
              </motion.div>
            )}
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4">Preview</h4>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${agency.primary_color}, ${agency.secondary_color})` }}
                >
                  {agency.name?.[0] || 'A'}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{agency.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Agency Identity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
