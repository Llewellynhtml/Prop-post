import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Sparkles, 
  Home, 
  Shield, 
  Trees, 
  Waves, 
  X, 
  AlertTriangle,
  Car,
  Bath,
  Bed,
  Maximize,
  Wind,
  Wifi,
  Tv,
  Coffee,
  Utensils,
  Flame,
  Lock,
  Sun,
  Warehouse,
  Briefcase
} from 'lucide-react';
import { Amenity } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from './PageHeader';

interface Props {
  amenities: Amenity[];
  onUpdate: () => void;
}

export default function Amenities({ amenities, onUpdate }: Props) {
  const { token } = useAuth();
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amenityToDelete, setAmenityToDelete] = useState<Amenity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredAmenities = amenities.filter(a => 
    (a.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/amenities', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        setNewName('');
        onUpdate();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add amenity');
      }
    } catch (error) {
      console.error('Error adding amenity:', error);
      alert('An error occurred while adding the amenity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!amenityToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/amenities/${amenityToDelete.id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setAmenityToDelete(null);
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting amenity:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <PageHeader 
        title="Amenities" 
        subtitle="Manage the master list of property features and facilities"
        action={
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Swimming Pool" 
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none transition-all w-full md:w-64 shadow-sm"
            />
            <button 
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="bg-brand-teal text-white px-6 py-3 rounded-xl flex items-center gap-2 text-xs font-mono uppercase tracking-widest hover:bg-brand-dark-teal transition-all disabled:opacity-50 shadow-lg shadow-brand-teal/20 shrink-0"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Plus size={16} />}
              Add
            </button>
          </form>
        }
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {amenityToDelete && (
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
                  <h3 className="text-lg font-bold">Delete Amenity?</h3>
                  <p className="text-sm text-gray-500">This will remove the amenity from the master list and all associated properties.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Amenity to delete</p>
                <p className="font-bold text-gray-900">{amenityToDelete.name}</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setAmenityToDelete(null)}
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
                  {isDeleting ? 'Deleting...' : 'Delete Amenity'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter amenities..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none transition-all" 
            />
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAmenities.map((a) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={a.id} 
                  className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-brand-teal hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl text-brand-teal group-hover:bg-brand-teal/10 transition-colors">
                      {getAmenityIcon(a.name)}
                    </div>
                    <span className="font-bold text-sm text-gray-700">{a.name}</span>
                  </div>
                  <button 
                    onClick={() => setAmenityToDelete(a)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredAmenities.length === 0 && (
              <div className="col-span-full py-12 text-center space-y-3">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <Search size={32} />
                </div>
                <p className="text-gray-500 font-medium">No amenities found matching "{searchQuery}"</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-brand-teal text-sm font-bold hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-brand-teal/5 p-10 rounded-3xl border border-brand-teal/10 text-center space-y-4">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-6 h-6 text-brand-teal" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif italic text-xl text-brand-teal">Organize your offerings</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            These amenities will be available for selection when adding or editing properties. 
            Use consistent naming to ensure high-quality social media post generation.
          </p>
        </div>
      </div>
    </div>
  );
}

function getAmenityIcon(name: string) {
  const n = (name || '').toLowerCase();
  
  // Specific keywords
  if (n.includes('pool') || n.includes('water') || n.includes('ocean')) return <Waves size={20} />;
  if (n.includes('garden') || n.includes('tree') || n.includes('park') || n.includes('nature')) return <Trees size={20} />;
  if (n.includes('security') || n.includes('alarm') || n.includes('gate')) return <Shield size={20} />;
  if (n.includes('gym') || n.includes('fitness') || n.includes('workout')) return <Sparkles size={20} />;
  if (n.includes('garage') || n.includes('parking') || n.includes('car')) return <Car size={20} />;
  if (n.includes('bath') || n.includes('shower') || n.includes('toilet')) return <Bath size={20} />;
  if (n.includes('bed') || n.includes('sleep')) return <Bed size={20} />;
  if (n.includes('size') || n.includes('area') || n.includes('space')) return <Maximize size={20} />;
  if (n.includes('air') || n.includes('ac') || n.includes('cool')) return <Wind size={20} />;
  if (n.includes('wifi') || n.includes('internet') || n.includes('fiber')) return <Wifi size={20} />;
  if (n.includes('tv') || n.includes('dstv') || n.includes('netflix')) return <Tv size={20} />;
  if (n.includes('coffee') || n.includes('cafe')) return <Coffee size={20} />;
  if (n.includes('kitchen') || n.includes('cook') || n.includes('stove')) return <Utensils size={20} />;
  if (n.includes('fire') || n.includes('braai') || n.includes('heat')) return <Flame size={20} />;
  if (n.includes('safe') || n.includes('lock')) return <Lock size={20} />;
  if (n.includes('sun') || n.includes('light') || n.includes('view')) return <Sun size={20} />;
  if (n.includes('storage') || n.includes('closet')) return <Warehouse size={20} />;
  if (n.includes('office') || n.includes('work') || n.includes('study')) return <Briefcase size={20} />;
  
  return <Home size={20} />;
}
