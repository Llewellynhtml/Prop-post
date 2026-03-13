import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Maximize,
  Edit3,
  Trash2,
  Copy,
  Archive,
  CheckCircle2,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Waves,
  Trees,
  Shield,
  Sparkles,
  Home,
  Layout,
  Upload,
  Image as ImageIcon,
  User,
  Users,
  TrendingUp,
  BarChart2,
  MousePointer2,
  Eye,
  MessageSquare,
  Share2,
  Heart,
  Palette
} from 'lucide-react';
import { Property, Amenity, Lead, PropertyPerformanceData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from './PageHeader';

interface Props {
  properties: Property[];
  amenities: Amenity[];
  agents: any[];
  onUpdate: () => void;
}

export default function Properties({ properties, amenities, agents, onUpdate }: Props) {
  const { token } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'marketing' | 'performance'>('overview');
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [propertyLeads, setPropertyLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [performanceData, setPerformanceData] = useState<PropertyPerformanceData | null>(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [amenitySearch, setAmenitySearch] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'sold' | 'rented' | 'archived'>('all');

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.location_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.location_area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateLead = async (source: 'whatsapp' | 'website', message?: string) => {
    if (!selectedProperty) return;
    setIsCreatingLead(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          agentId: selectedProperty.agent_id,
          source,
          contactName: 'Inquiry from Dashboard',
          contactPhone: 'N/A',
          message: message || `Inquiry for ${selectedProperty.title}`
        })
      });
      if (response.ok) {
        showToast('Lead recorded successfully');
        onUpdate();
        
        // If WhatsApp, open the link
        if (source === 'whatsapp') {
          const agent = agents.find(a => a.id === selectedProperty.agent_id);
          if (agent && agent.whatsapp_number) {
            const whatsappLink = `https://wa.me/${agent.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(message || `Hi, I'm interested in ${selectedProperty.title}`)}`;
            window.open(whatsappLink, '_blank');
          } else {
            showToast('No WhatsApp number found for assigned agent', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      showToast('Failed to record lead', 'error');
    } finally {
      setIsCreatingLead(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDuplicate = async (property: Property) => {
    try {
      const response = await fetch(`/api/properties/${property.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        onUpdate();
        showToast('Asset duplicated successfully');
      } else {
        showToast('Failed to duplicate asset', 'error');
      }
    } catch (error) {
      console.error('Error duplicating property:', error);
      showToast('An error occurred', 'error');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      const response = await fetch(`/api/properties/${id}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        onUpdate();
        showToast('Asset moved to archive');
      } else {
        showToast('Failed to archive asset', 'error');
      }
    } catch (error) {
      console.error('Error archiving property:', error);
      showToast('An error occurred', 'error');
    }
  };

  const handleGenerateCampaign = async () => {
    if (!selectedProperty) return;
    setIsGeneratingCampaign(true);
    try {
      const response = await fetch('/api/campaigns/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ propertyId: selectedProperty.id })
      });
      if (response.ok) {
        showToast('Marketing campaign generated successfully');
        onUpdate();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to generate campaign', 'error');
      }
    } catch (error) {
      console.error('Error generating campaign:', error);
      showToast('An error occurred', 'error');
    } finally {
      setIsGeneratingCampaign(false);
    }
  };

  useEffect(() => {
    if (selectedProperty && activeTab === 'performance') {
      const fetchPropertyLeads = async () => {
        setIsLoadingLeads(true);
        try {
          const response = await fetch('/api/leads', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const allLeads: Lead[] = await response.json();
            const filtered = allLeads.filter(l => l.propertyId === selectedProperty.id);
            setPropertyLeads(filtered);
          }
        } catch (error) {
          console.error('Failed to fetch property leads:', error);
        } finally {
          setIsLoadingLeads(false);
        }
      };

      const fetchPerformance = async () => {
        setIsLoadingPerformance(true);
        try {
          const response = await fetch(`/api/analytics/property/${selectedProperty.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setPerformanceData(data);
          }
        } catch (error) {
          console.error('Failed to fetch property performance:', error);
        } finally {
          setIsLoadingPerformance(false);
        }
      };

      fetchPropertyLeads();
      fetchPerformance();
    }
  }, [selectedProperty, activeTab, token]);

  const [newProperty, setNewProperty] = useState({
    title: '',
    price: 0,
    location_city: '',
    location_area: '',
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    floor_size_m2: 0,
    short_description: '',
    listing_type: 'sale' as 'sale' | 'rent',
    agent_id: undefined as number | undefined,
    amenities: [] as number[],
    images: [] as { url: string }[]
  });

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedProperty?.id]);

  useEffect(() => {
    if (editingProperty) {
      setNewProperty({
        title: editingProperty.title,
        price: editingProperty.price,
        location_city: editingProperty.location_city,
        location_area: editingProperty.location_area,
        bedrooms: editingProperty.bedrooms,
        bathrooms: editingProperty.bathrooms,
        parking: editingProperty.parking,
        floor_size_m2: editingProperty.floor_size_m2,
        short_description: editingProperty.short_description || '',
        listing_type: editingProperty.listing_type as 'sale' | 'rent',
        agent_id: editingProperty.agent_id,
        amenities: editingProperty.amenities?.map(a => a.id) || [],
        images: editingProperty.images?.map(img => ({ url: img.image_url })) || []
      });
    } else {
      setNewProperty({
        title: '',
        price: 0,
        location_city: '',
        location_area: '',
        bedrooms: 0,
        bathrooms: 0,
        parking: 0,
        floor_size_m2: 0,
        short_description: '',
        listing_type: 'sale',
        agent_id: undefined,
        amenities: [],
        images: []
      });
    }
  }, [editingProperty, amenities]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setNewProperty(prev => ({
          ...prev,
          images: [...prev.images, { url: data.url }]
        }));
      } else {
        showToast('Failed to upload image', 'error');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('An error occurred while uploading the image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setNewProperty(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingProperty ? `/api/properties/${editingProperty.id}` : '/api/properties';
      const method = editingProperty ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProperty),
      });

      if (response.ok) {
        setIsAdding(false);
        setEditingProperty(null);
        onUpdate();
        showToast(`Asset ${editingProperty ? 'updated' : 'added'} successfully`);
      } else {
        const data = await response.json();
        showToast(data.error || `Failed to ${editingProperty ? 'update' : 'add'} property`, 'error');
      }
    } catch (error) {
      console.error(`Error ${editingProperty ? 'updating' : 'adding'} property:`, error);
      showToast(`An error occurred while ${editingProperty ? 'updating' : 'adding'} the property`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/properties/${propertyToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        if (selectedProperty?.id === propertyToDelete.id) {
          setSelectedProperty(null);
        }
        setPropertyToDelete(null);
        onUpdate();
        showToast('Asset purged successfully');
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to delete property', 'error');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      showToast('An error occurred while deleting the property', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full relative">
      <PageHeader 
        title="Properties" 
        subtitle="Manage property records, media, and listing readiness"
        action={
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-brand-teal text-white px-8 py-4 rounded-2xl flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.2em] hover:bg-brand-dark-teal transition-all shadow-xl shadow-brand-teal/20 active:scale-95 group/btn"
          >
            <Plus size={16} className="group-hover/btn:rotate-90 transition-transform duration-300" /> 
            <span>Add Property</span>
          </button>
        }
      />

      <div className="flex gap-8 h-[calc(100vh-280px)] relative">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {propertyToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 space-y-8 border border-gray-100"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-5 bg-red-50 text-red-500 rounded-full shadow-inner">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif italic">Confirm Deletion</h3>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">This action is irreversible. All associated data, history, and media assets will be permanently purged from the system.</p>
                </div>
              </div>

              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-2">Target Asset</p>
                <p className="font-bold text-gray-900 text-lg">{propertyToDelete.title}</p>
                <p className="text-xs text-gray-400 mt-1">{propertyToDelete.location_area}, {propertyToDelete.location_city}</p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setPropertyToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-4 rounded-2xl border border-gray-200 text-[11px] font-mono uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50 active:scale-95"
                >
                  Abort
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white text-[11px] font-mono uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {isDeleting ? 'Purging...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Add/Edit Property Modal */}
      <AnimatePresence>
        {(isAdding || editingProperty) && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="bg-white rounded-[3rem] shadow-2xl max-w-3xl w-full my-12 overflow-hidden flex flex-col border border-gray-100"
            >
              <div className="flex items-center justify-between p-12 border-b border-gray-50 bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-3xl font-serif italic tracking-tight">{editingProperty ? 'Refine Asset' : 'Register New Asset'}</h2>
                  <p className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-2">
                    {editingProperty ? 'Update the technical specifications of this listing' : 'Initialize a new property record in the inventory'}
                  </p>
                </div>
                <button 
                  onClick={() => { setIsAdding(false); setEditingProperty(null); }} 
                  className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 rounded-2xl text-gray-400 transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-12 overflow-y-auto">
                <form onSubmit={handleAddProperty} className="space-y-10">
                  <div className="space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">Asset Designation</label>
                        <input 
                          required
                          type="text" 
                          value={newProperty.title}
                          onChange={e => setNewProperty({...newProperty, title: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all"
                          placeholder="e.g. Azure Heights Penthouse"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">Market Valuation (ZAR)</label>
                        <input 
                          required
                          type="number" 
                          value={newProperty.price || ''}
                          onChange={e => setNewProperty({...newProperty, price: Number(e.target.value)})}
                          className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all font-mono font-bold text-brand-teal"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">Municipality / City</label>
                        <input 
                          required
                          type="text" 
                          value={newProperty.location_city}
                          onChange={e => setNewProperty({...newProperty, location_city: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all"
                          placeholder="e.g. Cape Town"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">District / Suburb</label>
                        <input 
                          required
                          type="text" 
                          value={newProperty.location_area}
                          onChange={e => setNewProperty({...newProperty, location_area: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all"
                          placeholder="e.g. Sea Point"
                        />
                      </div>
                    </div>

                    <div className="pt-10 border-t border-gray-50">
                      <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-teal font-bold mb-8 block">Technical Specifications</label>
                      <div className="grid grid-cols-4 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2 ml-1">
                            <Bed size={12} className="text-brand-teal" /> Bedrooms
                          </label>
                          <input 
                            type="number" 
                            value={newProperty.bedrooms || ''}
                            onChange={e => setNewProperty({...newProperty, bedrooms: Number(e.target.value)})}
                            className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all shadow-sm font-bold"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2 ml-1">
                            <Bath size={12} className="text-brand-teal" /> Bathrooms
                          </label>
                          <input 
                            type="number" 
                            value={newProperty.bathrooms || ''}
                            onChange={e => setNewProperty({...newProperty, bathrooms: Number(e.target.value)})}
                            className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all shadow-sm font-bold"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2 ml-1">
                            <Car size={12} className="text-brand-teal" /> Parking
                          </label>
                          <input 
                            type="number" 
                            value={newProperty.parking || ''}
                            onChange={e => setNewProperty({...newProperty, parking: Number(e.target.value)})}
                            className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all shadow-sm font-bold"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2 ml-1">
                            <Maximize size={12} className="text-brand-teal" /> Area (m²)
                          </label>
                          <input 
                            type="number" 
                            value={newProperty.floor_size_m2 || ''}
                            onChange={e => setNewProperty({...newProperty, floor_size_m2: Number(e.target.value)})}
                            className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all shadow-sm font-bold"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-gray-50">
                      <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">Listing Classification</label>
                      <div className="flex gap-4">
                        {['sale', 'rent'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewProperty({...newProperty, listing_type: type as 'sale' | 'rent'})}
                            className={`flex-1 py-4 rounded-2xl border text-[11px] font-mono uppercase tracking-widest transition-all ${
                              newProperty.listing_type === type 
                                ? 'bg-brand-teal text-white border-brand-teal shadow-xl shadow-brand-teal/20' 
                                : 'bg-white text-gray-400 border-gray-100 hover:border-brand-teal/50'
                            }`}
                          >
                            For {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-gray-50">
                      <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">Assigned Agent</label>
                      <select 
                        value={newProperty.agent_id || ''}
                        onChange={e => setNewProperty({...newProperty, agent_id: e.target.value ? Number(e.target.value) : undefined})}
                        className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all appearance-none"
                      >
                        <option value="">Select an agent...</option>
                        {agents.map(agent => (
                          <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-gray-50">
                      <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">Executive Summary</label>
                      <textarea 
                        value={newProperty.short_description}
                        onChange={e => setNewProperty({...newProperty, short_description: e.target.value})}
                        className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[2rem] text-sm outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all h-32 resize-none leading-relaxed"
                        placeholder="Provide a compelling overview of the property..."
                      />
                    </div>

                    <div className="space-y-6 pt-6 border-t border-gray-50">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">Amenities Matrix</label>
                        <div className="relative w-64 group/search">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-brand-teal transition-colors" size={14} />
                          <input 
                            type="text" 
                            placeholder="Filter amenities..." 
                            value={amenitySearch}
                            onChange={e => setAmenitySearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-[10px] outline-none focus:ring-2 focus:ring-brand-teal/10 focus:border-brand-teal transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 border border-gray-50 rounded-[2rem] bg-gray-50/30 custom-scrollbar">
                        {amenities
                          .filter(a => (a.name?.toLowerCase() || '').includes(amenitySearch.toLowerCase()))
                          .map(a => {
                            const isSelected = newProperty.amenities.includes(a.id);
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => {
                                  setNewProperty({
                                    ...newProperty,
                                    amenities: isSelected 
                                      ? newProperty.amenities.filter(id => id !== a.id)
                                      : [...newProperty.amenities, a.id]
                                  });
                                }}
                                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all group/amenity ${
                                  isSelected
                                    ? 'bg-brand-teal/5 border-brand-teal text-brand-teal shadow-sm'
                                    : 'bg-white border-gray-50 text-gray-400 hover:border-brand-teal/30'
                                }`}
                              >
                                <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-brand-teal text-white' : 'bg-gray-50 text-gray-400 group-hover/amenity:bg-brand-teal/10'}`}>
                                  {getAmenityIcon(a.name)}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider truncate">{a.name}</span>
                              </button>
                            );
                          })}
                      </div>
                      <div className="flex items-center justify-between px-2">
                        <p className="text-[9px] text-gray-400 italic">Matrix Analysis: {newProperty.amenities.length} features selected</p>
                        {newProperty.amenities.length > 0 && (
                          <button 
                            type="button" 
                            onClick={() => setNewProperty({...newProperty, amenities: []})}
                            className="text-[9px] font-mono uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-gray-50">
                      <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">Media Assets</label>
                      
                      <div className="grid grid-cols-4 gap-6">
                        {newProperty.images.map((img, index) => (
                          <div key={index} className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-gray-100 group shadow-sm border border-gray-100">
                            <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                type="button"
                                onClick={() => removeImage(index)}
                                className="p-2 bg-red-500 text-white rounded-xl shadow-lg active:scale-90 transition-all"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <label className={`aspect-square rounded-[1.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand-teal hover:bg-brand-teal/5 transition-all group/upload ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isUploading}
                          />
                          {isUploading ? (
                            <div className="w-6 h-6 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
                          ) : (
                            <>
                              <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover/upload:bg-brand-teal group-hover/upload:text-white transition-all">
                                <Upload size={24} />
                              </div>
                              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 group-hover/upload:text-brand-teal transition-colors">Import</span>
                            </>
                          )}
                        </label>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 ml-1">External Asset URLs</label>
                        <textarea 
                          value={newProperty.images.map(img => img.url).join('\n')}
                          onChange={e => {
                            const urls = e.target.value.split('\n').filter(url => url.trim() !== '').map(url => ({ url: url.trim() }));
                            setNewProperty({...newProperty, images: urls});
                          }}
                          className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[2rem] text-[10px] outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all h-32 resize-none font-mono leading-relaxed"
                          placeholder="https://cdn.example.com/asset-01.jpg&#10;https://cdn.example.com/asset-02.jpg"
                        />
                      </div>
                    </div>

                    <div className="flex gap-6 pt-10 border-t border-gray-50">
                      <button 
                        type="button"
                        onClick={() => { setIsAdding(false); setEditingProperty(null); }}
                        className="flex-1 py-5 rounded-2xl border border-gray-200 text-[11px] font-mono uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-2 py-5 rounded-2xl bg-brand-teal text-white text-[11px] font-mono uppercase tracking-widest hover:bg-brand-dark-teal transition-all shadow-2xl shadow-brand-teal/30 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 size={18} />
                        )}
                        {isSubmitting ? 'Processing...' : (editingProperty ? 'Commit Changes' : 'Finalize Asset')}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden group/inventory hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500">
        <div className="p-10 border-b border-gray-50 space-y-8 bg-gray-50/30">
          <div className="flex gap-4">
            <div className="flex-1 relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-brand-teal transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, location or reference..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all shadow-sm" 
              />
            </div>
            <div className="flex bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
              {(['all', 'available', 'sold', 'archived'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all ${
                    filterStatus === status 
                      ? 'bg-brand-teal text-white shadow-md' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {properties.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <tr className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-400 border-b border-gray-50">
                  <th className="px-10 py-6 font-bold">Property Asset</th>
                  <th className="px-10 py-6 font-bold">Valuation</th>
                  <th className="px-10 py-6 font-bold">Marketing Score</th>
                  <th className="px-10 py-6 font-bold">Specifications</th>
                  <th className="px-10 py-6 font-bold">Inventory Status</th>
                  <th className="px-10 py-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {filteredProperties.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedProperty(p)}
                    className={`group/row hover:bg-gray-50/50 transition-all duration-300 cursor-pointer ${selectedProperty?.id === p.id ? 'bg-brand-teal/5' : ''}`}
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 shadow-sm group-hover/row:scale-105 transition-transform duration-300">
                          <img src={p.images?.[0]?.image_url || 'https://picsum.photos/seed/prop/200/200'} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-base group-hover/row:text-brand-teal transition-colors">{p.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <MapPin size={12} className="text-brand-teal" />
                            <span className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-mono">
                              {p.location_area} <span className="mx-1 opacity-30">•</span> {p.location_city}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-brand-teal text-base">{p.currency} {p.price.toLocaleString()}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-mono mt-1">{p.listing_type} Listing</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-gray-400">
                          <span>Score</span>
                          <span className="font-bold text-brand-teal">{p.metrics?.marketing_score || 0}%</span>
                        </div>
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${p.metrics?.marketing_score || 0}%` }}
                            className="h-full bg-brand-teal"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                          <Bed size={14} className="text-gray-400" />
                          <span className="font-mono text-xs font-bold text-gray-700">{p.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                          <Bath size={14} className="text-gray-400" />
                          <span className="font-mono text-xs font-bold text-gray-700">{p.bathrooms}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border ${
                        p.status === 'available' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : p.status === 'archived'
                          ? 'bg-gray-100 text-gray-500 border-gray-200'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          p.status === 'available' ? 'bg-emerald-500' : 
                          p.status === 'archived' ? 'bg-gray-400' : 'bg-amber-500'
                        } ${p.status === 'available' ? 'animate-pulse' : ''}`}></div>
                        {p.status}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === p.id ? null : p.id);
                        }}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-brand-teal transition-all active:scale-90"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenuId === p.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-20" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                            }}
                          />
                          <div className="absolute right-6 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProperty(p);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs flex items-center gap-3 hover:bg-gray-50 transition-colors"
                            >
                              <Edit3 size={14} /> Edit Asset
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicate(p);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs flex items-center gap-3 hover:bg-gray-50 transition-colors"
                            >
                              <Copy size={14} /> Duplicate
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchive(p.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs flex items-center gap-3 hover:bg-gray-50 transition-colors"
                            >
                              <Archive size={14} /> Archive Asset
                            </button>
                            <div className="my-1 border-t border-gray-50" />
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPropertyToDelete(p);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} /> Purge Asset
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <Home size={40} />
              </div>
              <div>
                <h3 className="text-lg font-serif italic text-gray-900">No properties found</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">Start building your inventory by adding your first property listing.</p>
              </div>
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-brand-teal text-white px-6 py-3 rounded-xl flex items-center gap-2 text-xs font-mono uppercase tracking-widest hover:bg-brand-dark-teal transition-all shadow-lg shadow-brand-teal/20"
              >
                <Plus size={16} /> Add First Property
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Details Panel */}
      <div className={`w-[480px] bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl flex flex-col transition-all duration-500 ease-out ${selectedProperty ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
        {selectedProperty && (
          <>
            <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div>
                <h3 className="font-serif italic text-2xl tracking-tight">Property Details</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Asset Intelligence</p>
              </div>
              <button onClick={() => setSelectedProperty(null)} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl text-gray-400 transition-all active:scale-90">
                <X size={20} />
              </button>
            </div>

            <div className="flex px-10 border-b border-gray-50 bg-white sticky top-0 z-10">
              <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" />
              <TabButton active={activeTab === 'media'} onClick={() => setActiveTab('media')} label="Media" />
              <TabButton active={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} label="Marketing" />
              <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} label="Performance" />
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              {activeTab === 'overview' && (
                <div className="space-y-10">
                  {/* Marketing Score Bar */}
                  <div className="p-6 bg-brand-teal/5 rounded-2xl border border-brand-teal/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                        <TrendingUp size={14} className="text-brand-teal" />
                        Marketing Score
                      </h4>
                      <span className="text-lg font-serif italic text-brand-teal">{selectedProperty.metrics?.marketing_score || 0}%</span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden border border-brand-teal/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedProperty.metrics?.marketing_score || 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-brand-teal"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="space-y-1">
                        <p className="text-[8px] font-mono text-gray-400 uppercase">Posts</p>
                        <p className="text-xs font-bold">{selectedProperty.metrics?.posts_created || 0}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-mono text-gray-400 uppercase">Leads</p>
                        <p className="text-xs font-bold">{selectedProperty.metrics?.leads_generated || 0}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-mono text-gray-400 uppercase">Reach</p>
                        <p className="text-xs font-bold">{((selectedProperty.metrics?.total_reach || 0) / 1000).toFixed(1)}k</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <DetailField label="Title" value={selectedProperty.title} />
                    <div className="grid grid-cols-2 gap-6">
                      <DetailField label="Valuation" value={`${selectedProperty.currency} ${selectedProperty.price.toLocaleString()}`} />
                      <DetailField label="Listing Class" value={selectedProperty.listing_type.toUpperCase()} />
                    </div>
                    <DetailField label="Geographic Location" value={`${selectedProperty.location_area}, ${selectedProperty.location_city}`} />
                    <div className="grid grid-cols-3 gap-6">
                      <DetailField label="Bedrooms" value={selectedProperty.bedrooms} />
                      <DetailField label="Bathrooms" value={selectedProperty.bathrooms} />
                      <DetailField label="Parking" value={selectedProperty.parking} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <DetailField label="Floor Area" value={`${selectedProperty.floor_size_m2}m²`} />
                      <DetailField label="Erf Area" value={selectedProperty.erf_size_m2 ? `${selectedProperty.erf_size_m2}m²` : 'N/A'} />
                    </div>
                    <DetailField label="Executive Summary" value={selectedProperty.short_description} />
                  </div>

                  {/* Lead Generation Section */}
                  <div className="pt-10 border-t border-gray-50 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-4">Lead Generation</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => handleCreateLead('whatsapp')}
                          disabled={isCreatingLead}
                          className="flex items-center justify-center gap-3 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <MessageSquare size={16} />
                          Inquire via WhatsApp
                        </button>
                        <button 
                          onClick={() => handleCreateLead('website', 'Direct inquiry from property dashboard')}
                          disabled={isCreatingLead}
                          className="flex items-center justify-center gap-3 py-4 bg-brand-teal/5 text-brand-teal border border-brand-teal/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal/10 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Palette size={16} />
                          Send Inquiry
                        </button>
                      </div>
                    </div>
                    
                    {selectedProperty.agent_id ? (
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-gray-100">
                          <img 
                            src={agents.find(a => a.id === selectedProperty.agent_id)?.profile_photo_url || 'https://picsum.photos/seed/agent/100/100'} 
                            className="w-full h-full object-cover" 
                            alt="" 
                          />
                        </div>
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-widest text-gray-400">Assigned Agent</p>
                          <p className="text-xs font-bold text-gray-900">{agents.find(a => a.id === selectedProperty.agent_id)?.full_name || 'Unknown Agent'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                        <AlertTriangle size={16} className="text-amber-500" />
                        <p className="text-[10px] text-amber-600 font-medium">No agent assigned to this property.</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-10 border-t border-gray-50 space-y-6">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">Amenities Matrix</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProperty.amenities?.map(a => (
                        <div 
                          key={a.id}
                          className="px-3 py-1.5 rounded-full bg-brand-teal/5 text-brand-teal border border-brand-teal/20 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2"
                        >
                          {getAmenityIcon(a.name)}
                          {a.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProperty.images?.map((img, i) => (
                      <div key={img.id} className="aspect-video rounded-lg overflow-hidden relative group">
                        <img src={img.image_url} className="w-full h-full object-cover" alt="" />
                        {img.is_hero && (
                          <div className="absolute top-2 left-2 bg-brand-teal text-white px-2 py-0.5 rounded text-[8px] font-mono uppercase">Hero</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button className="p-1.5 bg-white rounded-lg text-gray-700 hover:bg-gray-100"><Edit3 size={14} /></button>
                          <button className="p-1.5 bg-white rounded-lg text-red-500 hover:bg-gray-100"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                    <button className="aspect-video rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-teal hover:text-brand-teal transition-all">
                      <Plus size={20} />
                      <span className="text-[10px] font-mono uppercase">Add Image</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'marketing' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="aspect-square bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
                      <div className="h-2/3 w-full relative group">
                        <img 
                          src={selectedProperty.images?.[currentImageIndex]?.image_url || 'https://picsum.photos/seed/prop/400/400'} 
                          className="w-full h-full object-cover transition-all duration-500" 
                          alt="" 
                        />
                        
                        {selectedProperty.images && selectedProperty.images.length > 1 && (
                          <>
                            <button 
                              onClick={() => setCurrentImageIndex(prev => (prev === 0 ? selectedProperty.images!.length - 1 : prev - 1))}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button 
                              onClick={() => setCurrentImageIndex(prev => (prev === selectedProperty.images!.length - 1 ? 0 : prev + 1))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <ChevronRight size={16} />
                            </button>
                            
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {selectedProperty.images.map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-brand-teal w-3' : 'bg-white/50'}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="font-bold text-xs truncate">{selectedProperty.title}</p>
                        <p className="text-[10px] text-brand-teal font-mono">{selectedProperty.currency} {selectedProperty.price.toLocaleString()}</p>
                        <div className="flex gap-2 text-[8px] opacity-50">
                          <span>{selectedProperty.bedrooms} BEDS</span>
                          <span>{selectedProperty.bathrooms} BATHS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-brand-teal/5 rounded-2xl border border-brand-teal/10 space-y-4">
                    <h4 className="text-xs font-bold flex items-center gap-2">
                      <Sparkles size={14} className="text-brand-teal" />
                      Campaign Generator
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Generate a full marketing campaign for Instagram, Facebook, and LinkedIn in one click.
                    </p>
                    <button 
                      onClick={handleGenerateCampaign}
                      disabled={isGeneratingCampaign}
                      className="w-full py-4 bg-brand-teal text-white rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-brand-dark-teal transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingCampaign ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      {isGeneratingCampaign ? 'Generating...' : 'Generate Marketing Campaign'}
                    </button>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                    <h4 className="text-xs font-bold flex items-center gap-2">
                      <Layout size={14} className="text-gray-400" />
                      Manual Builder
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      This asset is ready for distribution. You can generate social media posts, brochures, and email campaigns directly from the Marketing Builder.
                    </p>
                    <button className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-gray-50 transition-all">
                      Open in Builder
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-8">
                  {isLoadingPerformance ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Analyzing Performance...</p>
                    </div>
                  ) : performanceData ? (
                    <div className="space-y-10">
                      {/* Performance Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3 text-gray-400 mb-2">
                            <Eye size={14} />
                            <span className="text-[9px] font-mono uppercase tracking-widest">Impressions</span>
                          </div>
                          <p className="text-2xl font-serif italic">{performanceData.stats.impressions.toLocaleString()}</p>
                        </div>
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3 text-brand-teal mb-2">
                            <MousePointer2 size={14} />
                            <span className="text-[9px] font-mono uppercase tracking-widest">Clicks</span>
                          </div>
                          <p className="text-2xl font-serif italic">{performanceData.stats.clicks.toLocaleString()}</p>
                        </div>
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3 text-emerald-500 mb-2">
                            <Users size={14} />
                            <span className="text-[9px] font-mono uppercase tracking-widest">Leads</span>
                          </div>
                          <p className="text-2xl font-serif italic">{performanceData.stats.leads.toLocaleString()}</p>
                        </div>
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3 text-amber-500 mb-2">
                            <TrendingUp size={14} />
                            <span className="text-[9px] font-mono uppercase tracking-widest">Conv. Rate</span>
                          </div>
                          <p className="text-2xl font-serif italic">
                            {performanceData.stats.clicks > 0 
                              ? ((performanceData.stats.leads / performanceData.stats.clicks) * 100).toFixed(1) 
                              : '0.0'}%
                          </p>
                        </div>
                      </div>

                      {/* Engagement Metrics */}
                      <div className="pt-8 border-t border-gray-50">
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-6">Engagement Matrix</p>
                        <div className="flex justify-between items-center px-4">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                              <Heart size={20} />
                            </div>
                            <span className="text-lg font-bold">{performanceData.stats.likes}</span>
                            <span className="text-[8px] font-mono uppercase text-gray-400">Likes</span>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                              <MessageSquare size={20} />
                            </div>
                            <span className="text-lg font-bold">{performanceData.stats.comments}</span>
                            <span className="text-[8px] font-mono uppercase text-gray-400">Comments</span>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                              <Share2 size={20} />
                            </div>
                            <span className="text-lg font-bold">{performanceData.stats.shares}</span>
                            <span className="text-[8px] font-mono uppercase text-gray-400">Shares</span>
                          </div>
                        </div>
                      </div>

                      {/* Platform Breakdown */}
                      <div className="pt-8 border-t border-gray-50">
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-6">Platform Distribution</p>
                        <div className="space-y-4">
                          {performanceData.platformBreakdown.map(pb => (
                            <div key={pb.platform} className="space-y-2">
                              <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                                <span>{pb.platform}</span>
                                <span className="text-gray-400">{pb.clicks} Clicks</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(pb.clicks / performanceData.stats.clicks) * 100}%` }}
                                  className="h-full bg-brand-teal"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Leads for this property */}
                      <div className="pt-8 border-t border-gray-50">
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-6">Recent Inquiries</p>
                        {isLoadingLeads ? (
                          <div className="flex justify-center py-4">
                            <div className="w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : propertyLeads.length > 0 ? (
                          <div className="space-y-4">
                            {propertyLeads.slice(0, 3).map(lead => (
                              <div key={lead.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2">
                                <div className="flex justify-between items-start">
                                  <p className="text-xs font-bold">{lead.contactName}</p>
                                  <span className="text-[8px] font-mono uppercase bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{lead.source}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 italic line-clamp-1">"{lead.message}"</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 italic text-center py-4">No recent leads recorded.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-40">
                      <BarChart2 size={32} />
                      <p className="text-[10px] font-mono uppercase tracking-widest text-center">No performance data available<br/>for this asset yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-10 border-t border-gray-50 grid grid-cols-2 gap-6 bg-gray-50/30">
              <button 
                onClick={() => setEditingProperty(selectedProperty)}
                className="flex items-center justify-center gap-3 bg-brand-teal text-white py-5 rounded-[1.5rem] text-[11px] font-mono uppercase tracking-widest hover:bg-brand-dark-teal transition-all shadow-xl shadow-brand-teal/20 active:scale-95"
              >
                <Edit3 size={18} /> Edit Asset
              </button>
              <div className="grid grid-cols-3 gap-4">
                <ActionIcon 
                  onClick={() => handleDuplicate(selectedProperty)}
                  icon={<Copy size={18} />} 
                  title="Duplicate Asset" 
                />
                <ActionIcon 
                  onClick={() => handleArchive(selectedProperty.id)}
                  icon={<Archive size={18} />} 
                  title="Archive Asset" 
                />
                <ActionIcon 
                  onClick={() => setPropertyToDelete(selectedProperty)}
                  icon={<Trash2 size={18} />} 
                  color="text-red-500" 
                  title="Purge Asset"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[200] px-8 py-4 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border border-white/10 backdrop-blur-xl"
          >
            <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-brand-teal/20 text-brand-teal' : 'bg-red-500/20 text-red-500'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <p className="text-[11px] font-mono uppercase tracking-widest">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-5 text-[10px] font-mono uppercase tracking-[0.2em] transition-all relative group ${
        active ? 'text-brand-teal font-bold' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {label}
      {active && (
        <motion.div 
          layoutId="active-tab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-teal"
        />
      )}
    </button>
  );
}

function DetailField({ label, value }: { label: string, value: string | number | null }) {
  return (
    <div className="space-y-2 group">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 group-hover:text-brand-teal transition-colors">{label}</p>
      <p className="text-sm font-medium text-gray-900 leading-relaxed">{value || 'Not specified'}</p>
    </div>
  );
}

function ActionIcon({ icon, color = "text-gray-400", onClick, title }: { icon: React.ReactNode, color?: string, onClick?: () => void, title?: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center p-4 bg-white border border-gray-100 rounded-[1.25rem] hover:border-brand-teal hover:text-brand-teal transition-all shadow-sm active:scale-90 ${color}`}
    >
      {icon}
    </button>
  );
}

function getAmenityIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('pool') || n.includes('water')) return <Waves size={14} />;
  if (n.includes('garden') || n.includes('tree')) return <Trees size={14} />;
  if (n.includes('security') || n.includes('alarm')) return <Shield size={14} />;
  if (n.includes('gym') || n.includes('fitness')) return <Sparkles size={14} />;
  if (n.includes('bed') || n.includes('room')) return <Bed size={14} />;
  if (n.includes('bath')) return <Bath size={14} />;
  if (n.includes('park') || n.includes('garage')) return <Car size={14} />;
  return <Home size={14} />;
}
