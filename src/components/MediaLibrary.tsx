import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List, 
  MoreVertical, 
  Download, 
  Trash2,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import PageHeader from './PageHeader';
import { useAuth } from '../contexts/AuthContext';

interface MediaAsset {
  id: string;
  url: string;
  name: string;
  type: string;
  size: string;
  createdAt: string;
}

export default function MediaLibrary() {
  const { token } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true);
      try {
        // Mock data for now as there's no dedicated media API yet
        // In a real app, this would fetch from /api/media
        const mockAssets: MediaAsset[] = [
          { id: '1', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', name: 'Modern Villa Exterior.jpg', type: 'image/jpeg', size: '2.4 MB', createdAt: '2024-03-10' },
          { id: '2', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', name: 'Luxury Kitchen.png', type: 'image/png', size: '4.1 MB', createdAt: '2024-03-09' },
          { id: '3', url: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=800&q=80', name: 'Master Bedroom.jpg', type: 'image/jpeg', size: '1.8 MB', createdAt: '2024-03-08' },
          { id: '4', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80', name: 'Living Room View.jpg', type: 'image/jpeg', size: '3.2 MB', createdAt: '2024-03-07' },
          { id: '5', url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80', name: 'Bathroom Suite.jpg', type: 'image/jpeg', size: '1.5 MB', createdAt: '2024-03-06' },
          { id: '6', url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80', name: 'Garden Area.jpg', type: 'image/jpeg', size: '2.9 MB', createdAt: '2024-03-05' },
        ];
        setAssets(mockAssets);
      } catch (error) {
        console.error("Failed to fetch media:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [token]);

  return (
    <div className="h-full flex flex-col bg-white">
      <PageHeader 
        title="Media Library" 
        subtitle="Manage and organize your property marketing assets"
        action={
          <button className="flex items-center gap-2 bg-brand-teal text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-brand-teal/20 hover:scale-105 transition-all active:scale-95">
            <Upload size={18} />
            Upload Assets
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-brand-teal shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-brand-teal shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List size={18} />
              </button>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Loading Assets...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ImageIcon size={40} className="text-gray-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No assets found</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-xs">Upload your first property photos or videos to get started.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {assets.map((asset) => (
              <motion.div 
                key={asset.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={asset.url} 
                    alt={asset.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 bg-white rounded-xl text-gray-900 hover:bg-brand-teal hover:text-white transition-all">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 bg-white rounded-xl text-gray-900 hover:bg-brand-teal hover:text-white transition-all">
                      <Download size={16} />
                    </button>
                    <button className="p-2 bg-white rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-bold text-gray-900 truncate">{asset.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[9px] text-gray-400 font-mono uppercase">{asset.size}</p>
                    <p className="text-[9px] text-gray-400 font-mono uppercase">{asset.type.split('/')[1]}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">Asset</th>
                  <th className="text-left px-6 py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="text-left px-6 py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">Size</th>
                  <th className="text-left px-6 py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">Date Added</th>
                  <th className="text-right px-6 py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                          <img src={asset.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-xs font-bold text-gray-900">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono uppercase">{asset.type.split('/')[1]}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono uppercase">{asset.size}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono uppercase">{asset.createdAt}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-brand-teal transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
