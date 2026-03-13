import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  X,
  CheckCircle2,
  Globe,
  Briefcase,
  Upload,
  Linkedin as LinkedinIcon,
  Instagram as InstagramIcon,
  AlertTriangle
} from 'lucide-react';
import { Agent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from './PageHeader';

interface Props {
  agents: Agent[];
  onUpdate: () => void;
}

export default function Agents({ agents, onUpdate }: Props) {
  const { token } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    full_name: '',
    role_optional: '',
    profile_photo_url: 'https://picsum.photos/seed/agent/200/200',
    email: '',
    whatsapp_number: '',
    cellphone_number: '',
    office_number_optional: '',
    bio_optional: '',
    linkedin_url_optional: '',
    instagram_url_optional: ''
  });

  const filteredAgents = agents.filter(a => 
    (a.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (a.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
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
        if (isEditing && selectedAgent) {
          setSelectedAgent({ ...selectedAgent, profile_photo_url: data.url });
        } else {
          setNewAgent(prev => ({ ...prev, profile_photo_url: data.url }));
        }
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('An error occurred while uploading the image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAgent),
      });

      if (response.ok) {
        setIsAdding(false);
        setNewAgent({
          full_name: '',
          role_optional: '',
          profile_photo_url: 'https://picsum.photos/seed/agent/200/200',
          email: '',
          whatsapp_number: '',
          cellphone_number: '',
          office_number_optional: '',
          bio_optional: '',
          linkedin_url_optional: '',
          instagram_url_optional: ''
        });
        onUpdate();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding agent:', error);
      alert('An error occurred while adding the agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/agents/${selectedAgent.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedAgent),
      });

      if (response.ok) {
        onUpdate();
        alert('Agent updated successfully');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      alert('An error occurred while updating the agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!agentToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/agents/${agentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAgentToDelete(null);
        setSelectedAgent(null);
        onUpdate();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('An error occurred while deleting the agent');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full relative overflow-hidden">
      <PageHeader 
        title="Agents" 
        subtitle="Manage agent profiles, contact details, and social presence"
        action={
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-brand-teal text-white px-8 py-4 rounded-2xl flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.2em] hover:bg-brand-dark-teal transition-all shadow-xl shadow-brand-teal/20 active:scale-95 group/btn"
          >
            <Plus size={16} className="group-hover/btn:rotate-90 transition-transform duration-300" /> 
            <span>Add Agent</span>
          </button>
        }
      />

      <div className="flex gap-8 h-[calc(100vh-280px)] relative overflow-hidden">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {agentToDelete && (
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
                  <h3 className="text-lg font-bold">Delete Agent?</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone. All associated data will be removed.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Agent to delete</p>
                <p className="font-bold text-gray-900">{agentToDelete.full_name}</p>
                <p className="text-xs text-gray-500">{agentToDelete.email}</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setAgentToDelete(null)}
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
                  {isDeleting ? 'Deleting...' : 'Delete Agent'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Agent Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-serif italic">Add New Agent</h2>
                  <p className="text-sm text-gray-500">Create a new agent profile for your directory.</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <form onSubmit={handleAddAgent} className="space-y-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-brand-teal/10 relative group">
                      <img src={newAgent.profile_photo_url} className="w-full h-full object-cover" alt="" />
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                        <Upload size={20} />
                        <span className="text-[8px] font-mono uppercase mt-1">Upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, false)} />
                      </label>
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-mono uppercase text-gray-400">Profile Photo</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Full Name</label>
                      <input 
                        required
                        type="text" 
                        value={newAgent.full_name}
                        onChange={e => setNewAgent({...newAgent, full_name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                        placeholder="e.g. Sarah Jenkins"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Role / Title</label>
                      <input 
                        type="text" 
                        value={newAgent.role_optional}
                        onChange={e => setNewAgent({...newAgent, role_optional: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                        placeholder="e.g. Senior Property Consultant"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Email Address</label>
                    <input 
                      required
                      type="email" 
                      value={newAgent.email}
                      onChange={e => setNewAgent({...newAgent, email: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                      placeholder="sarah@groupten.co.za"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">WhatsApp Number</label>
                      <input 
                        required
                        type="text" 
                        value={newAgent.whatsapp_number}
                        onChange={e => setNewAgent({...newAgent, whatsapp_number: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                        placeholder="27821234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Cellphone Number</label>
                      <input 
                        required
                        type="text" 
                        value={newAgent.cellphone_number}
                        onChange={e => setNewAgent({...newAgent, cellphone_number: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                        placeholder="27821234567"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">LinkedIn URL</label>
                      <input 
                        type="url" 
                        value={newAgent.linkedin_url_optional}
                        onChange={e => setNewAgent({...newAgent, linkedin_url_optional: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Instagram URL</label>
                      <input 
                        type="url" 
                        value={newAgent.instagram_url_optional}
                        onChange={e => setNewAgent({...newAgent, instagram_url_optional: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal transition-all"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 py-4 rounded-xl border border-gray-200 text-sm font-bold hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-4 rounded-xl bg-brand-teal text-white text-sm font-bold hover:bg-brand-dark-teal transition-all shadow-lg shadow-brand-teal/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : <Plus size={16} />}
                      {isSubmitting ? 'Creating...' : 'Create Agent'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Left Side: List */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none transition-all" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-[10px] font-mono uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-3 font-normal">Agent</th>
                <th className="px-6 py-3 font-normal">Contact</th>
                <th className="px-6 py-3 font-normal">Status</th>
                <th className="px-6 py-3 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {filteredAgents.map((a) => (
                <tr 
                  key={a.id} 
                  onClick={() => setSelectedAgent(a)}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedAgent?.id === a.id ? 'bg-brand-teal/5' : ''}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0 border-2 border-white shadow-sm">
                        <img src={a.profile_photo_url} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{a.full_name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">{a.role_optional || 'Agent'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail size={12} className="shrink-0" /> {a.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone size={12} className="shrink-0" /> {a.cellphone_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-100 text-emerald-700">Active</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400"><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Side: Details Panel */}
      <div className={`w-[420px] bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col transition-all duration-300 ${selectedAgent ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
        {selectedAgent && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-serif italic text-lg">Agent Profile</h3>
              <button onClick={() => setSelectedAgent(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-brand-teal/10 shadow-inner relative group">
                  <img src={selectedAgent.profile_photo_url} className="w-full h-full object-cover" alt="" />
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
                    <Edit3 size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, true)} />
                  </label>
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="w-full space-y-2">
                  <input 
                    className="text-xl font-bold text-gray-900 w-full text-center bg-transparent border-b border-transparent focus:border-brand-teal outline-none"
                    value={selectedAgent.full_name}
                    onChange={e => setSelectedAgent({...selectedAgent, full_name: e.target.value})}
                  />
                  <input 
                    className="text-xs text-brand-teal font-mono uppercase tracking-widest w-full text-center bg-transparent border-b border-transparent focus:border-brand-teal outline-none"
                    value={selectedAgent.role_optional || ''}
                    placeholder="Role / Title"
                    onChange={e => setSelectedAgent({...selectedAgent, role_optional: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h5 className="text-[10px] font-mono uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Contact Information</h5>
                <div className="space-y-4">
                  <EditableContactItem 
                    icon={<Mail size={16} />} 
                    label="Email Address" 
                    value={selectedAgent.email} 
                    onChange={val => setSelectedAgent({...selectedAgent, email: val})}
                  />
                  <EditableContactItem 
                    icon={<MessageSquare size={16} />} 
                    label="WhatsApp Number" 
                    value={selectedAgent.whatsapp_number} 
                    onChange={val => setSelectedAgent({...selectedAgent, whatsapp_number: val})}
                  />
                  <EditableContactItem 
                    icon={<Phone size={16} />} 
                    label="Cellphone Number" 
                    value={selectedAgent.cellphone_number} 
                    onChange={val => setSelectedAgent({...selectedAgent, cellphone_number: val})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-mono uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Lead Generation</h5>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">WhatsApp Link</span>
                    <button 
                      onClick={() => {
                        const link = `https://wa.me/${selectedAgent.whatsapp_number?.replace(/\D/g, '')}`;
                        navigator.clipboard.writeText(link);
                        alert('WhatsApp link copied to clipboard!');
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:underline uppercase tracking-widest"
                    >
                      Copy Link
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 truncate">
                    <code className="text-[10px] text-emerald-600 font-mono">
                      https://wa.me/{selectedAgent.whatsapp_number?.replace(/\D/g, '')}
                    </code>
                  </div>
                  <p className="text-[9px] text-emerald-600/70 italic">
                    Share this link in your social posts to generate direct WhatsApp leads.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-mono uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Biography</h5>
                <textarea 
                  className="text-sm text-gray-600 leading-relaxed italic w-full bg-gray-50 p-3 rounded-xl border border-transparent focus:border-brand-teal outline-none min-h-[100px] resize-none"
                  value={selectedAgent.bio_optional || ''}
                  placeholder="Add a short bio to help clients get to know the agent."
                  onChange={e => setSelectedAgent({...selectedAgent, bio_optional: e.target.value})}
                />
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-mono uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Social Presence</h5>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <LinkedinIcon size={16} className="text-gray-400" />
                    <input 
                      className="text-xs text-gray-600 bg-transparent outline-none flex-1"
                      placeholder="LinkedIn URL"
                      value={selectedAgent.linkedin_url_optional || ''}
                      onChange={e => setSelectedAgent({...selectedAgent, linkedin_url_optional: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <InstagramIcon size={16} className="text-gray-400" />
                    <input 
                      className="text-xs text-gray-600 bg-transparent outline-none flex-1"
                      placeholder="Instagram URL"
                      value={selectedAgent.instagram_url_optional || ''}
                      onChange={e => setSelectedAgent({...selectedAgent, instagram_url_optional: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 grid grid-cols-2 gap-3">
              <button 
                onClick={handleUpdateAgent}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 bg-brand-teal text-white py-3 rounded-xl text-xs font-mono uppercase tracking-widest hover:bg-brand-dark-teal transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <CheckCircle2 size={16} />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={() => setAgentToDelete(selectedAgent)}
                className="flex items-center justify-center gap-2 border border-red-100 text-red-500 py-3 rounded-xl text-xs font-mono uppercase tracking-widest hover:bg-red-50 transition-all"
              >
                <Trash2 size={16} /> Delete Agent
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
}

function EditableContactItem({ icon, label, value, onChange }: { icon: React.ReactNode, label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div className="flex gap-3">
      <div className="p-2 bg-gray-50 rounded-lg text-gray-400 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">{label}</p>
        <input 
          className="text-sm font-medium text-gray-900 w-full bg-transparent border-b border-transparent focus:border-brand-teal outline-none"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex gap-3">
      <div className="p-2 bg-gray-50 rounded-lg text-gray-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}
