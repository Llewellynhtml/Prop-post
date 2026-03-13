import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar,
  ExternalLink,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { Lead } from '../types';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from './PageHeader';
import { motion, AnimatePresence } from 'motion/react';

interface LeadsProps {
  dashboardData?: any;
}

export default function Leads({ dashboardData }: LeadsProps) {
  const { token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => 
    (lead.contactName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (lead.propertyTitle || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (lead.source || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'instagram': return <Instagram size={16} className="text-pink-500" />;
      case 'facebook': return <Facebook size={16} className="text-blue-600" />;
      case 'linkedin': return <Linkedin size={16} className="text-blue-700" />;
      case 'whatsapp': return <MessageSquare size={16} className="text-emerald-500" />;
      case 'website': return <Globe size={16} className="text-gray-500" />;
      default: return <Globe size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Leads Tracking" 
        subtitle="Monitor and manage inquiries from all social platforms and your website"
        action={
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search leads..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-teal outline-none transition-all w-80 shadow-sm" 
              />
            </div>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Leads by Platform</p>
          <div className="space-y-3">
            {(dashboardData?.leadsByPlatform || []).map((item: any) => (
              <div key={item.platform} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSourceIcon(item.platform)}
                  <span className="text-xs font-medium capitalize text-gray-600">{item.platform}</span>
                </div>
                <span className="text-xs font-bold text-gray-900">{item.count}</span>
              </div>
            ))}
            {(!dashboardData?.leadsByPlatform || dashboardData.leadsByPlatform.length === 0) && (
              <p className="text-xs text-gray-400 italic">No platform data available</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Top Performing Properties</p>
          <div className="space-y-3">
            {(dashboardData?.leadsByProperty || []).map((item: any) => (
              <div key={item.propertyTitle} className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 truncate max-w-[180px]">{item.propertyTitle}</span>
                <span className="text-xs font-bold text-gray-900">{item.leadCount}</span>
              </div>
            ))}
            {(!dashboardData?.leadsByProperty || dashboardData.leadsByProperty.length === 0) && (
              <p className="text-xs text-gray-400 italic">No property data available</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Agent Performance</p>
          <div className="space-y-3">
            {(dashboardData?.leadsPerAgent || []).slice(0, 5).map((item: any) => (
              <div key={item.agentName} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
                    <img src={item.profilePhoto} className="w-full h-full object-cover" alt="" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{item.agentName}</span>
                </div>
                <span className="text-xs font-bold text-gray-900">{item.leadCount}</span>
              </div>
            ))}
            {(!dashboardData?.leadsPerAgent || dashboardData.leadsPerAgent.length === 0) && (
              <p className="text-xs text-gray-400 italic">No agent data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leads List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredLeads.length > 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                      <th className="px-6 py-4 font-normal">Contact</th>
                      <th className="px-6 py-4 font-normal">Source</th>
                      <th className="px-6 py-4 font-normal">Property</th>
                      <th className="px-6 py-4 font-normal">Date</th>
                      <th className="px-6 py-4 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-50">
                    {filteredLeads.map((lead) => (
                      <tr 
                        key={lead.id} 
                        onClick={() => setSelectedLead(lead)}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer group ${selectedLead?.id === lead.id ? 'bg-brand-teal/5' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{lead.contactName}</span>
                            <span className="text-xs text-gray-500">{lead.contactPhone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                              {getSourceIcon(lead.source)}
                            </div>
                            <span className="text-xs font-medium capitalize text-gray-600">{lead.source}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900 truncate max-w-[150px]">
                              {lead.propertyTitle || 'General Inquiry'}
                            </span>
                            <span className="text-[10px] text-gray-500">{lead.agentName || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar size={12} />
                            <span className="text-[10px] font-mono">{new Date(lead.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 hover:bg-white rounded-lg text-gray-400 transition-colors">
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-32 text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Leads Found</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                {searchTerm ? 'No leads match your search criteria.' : 'You haven\'t received any inquiries yet. Share your properties to start generating leads!'}
              </p>
            </div>
          )}
        </div>

        {/* Lead Details Sidebar */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedLead ? (
              <motion.div 
                key={selectedLead.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden sticky top-8"
              >
                <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 flex items-center justify-center text-brand-teal">
                      <Users size={24} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {selectedLead.source}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedLead.contactName}</h3>
                  <p className="text-gray-500 text-sm">Inquiry received on {new Date(selectedLead.createdAt).toLocaleString()}</p>
                </div>

                <div className="p-8 space-y-8">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Contact Information</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <a 
                        href={`tel:${selectedLead.contactPhone}`}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-brand-teal/5 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-brand-teal shadow-sm">
                          <Phone size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Phone</span>
                          <span className="text-sm font-bold text-gray-900">{selectedLead.contactPhone}</span>
                        </div>
                      </a>
                      
                      {selectedLead.source === 'whatsapp' && (
                        <a 
                          href={`https://wa.me/${selectedLead.contactPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-all group border border-emerald-100"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                            <MessageSquare size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">WhatsApp</span>
                            <span className="text-sm font-bold text-emerald-700">Message Lead</span>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Inquiry Details */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Inquiry Details</h4>
                    <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Property</span>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">{selectedLead.propertyTitle || 'General Inquiry'}</span>
                          {selectedLead.propertyId && (
                            <button className="text-brand-teal hover:underline text-[10px] font-bold uppercase tracking-widest">
                              View Property
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Message</span>
                        <p className="text-sm text-gray-600 leading-relaxed italic">
                          "{selectedLead.message || 'No message provided.'}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex gap-3">
                    <button className="flex-1 px-6 py-4 bg-brand-teal text-white rounded-2xl text-xs font-bold shadow-lg shadow-brand-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Mark as Contacted
                    </button>
                    <button className="px-6 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl text-xs font-bold hover:bg-gray-50 transition-all">
                      Archive
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-12 text-center h-[600px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 shadow-sm mb-6">
                  <ChevronRight size={32} />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Select a Lead</h4>
                <p className="text-gray-500 text-sm max-w-[200px] mx-auto">
                  Click on a lead from the list to view detailed information and contact options.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
