import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Copy, 
  Trash2, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Edit2,
  Send
} from 'lucide-react';
import { HistoryItem, ScheduledPost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from './PageHeader';

interface Props {
  history: HistoryItem[];
  scheduledPosts: ScheduledPost[];
  onUpdate: () => void;
}

export default function History({ history, onUpdate }: { history: HistoryItem[], onUpdate: () => void }) {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const filteredHistory = history.filter(item => 
    (item.property_title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.agent_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.platform?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this history item?')) return;
    
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/history/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showFeedback('success', 'Item deleted successfully');
        onUpdate();
      } else {
        showFeedback('error', 'Failed to delete item');
      }
    } catch (error) {
      showFeedback('error', 'An error occurred');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear ALL history? This cannot be undone.')) return;
    
    setIsClearingAll(true);
    try {
      const res = await fetch('/api/history', { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showFeedback('success', 'History cleared successfully');
        onUpdate();
      } else {
        showFeedback('error', 'Failed to clear history');
      }
    } catch (error) {
      showFeedback('error', 'An error occurred');
    } finally {
      setIsClearingAll(false);
    }
  };

  const handlePostNow = async (id: string) => {
    try {
      const res = await fetch(`/api/scheduled_posts/${id}/post`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showFeedback('success', 'Post published successfully');
        onUpdate();
      } else {
        showFeedback('error', 'Failed to publish post');
      }
    } catch (error) {
      showFeedback('error', 'An error occurred');
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled post?')) return;
    try {
      const res = await fetch(`/api/scheduled_posts/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showFeedback('success', 'Scheduled post deleted');
        onUpdate();
      } else {
        showFeedback('error', 'Failed to delete post');
      }
    } catch (error) {
      showFeedback('error', 'An error occurred');
    }
  };

  const handleCopy = (item: HistoryItem) => {
    navigator.clipboard.writeText(`Post for ${item.property_title} on ${item.platform}`);
    showFeedback('success', 'Copied to clipboard');
  };

  const handleDownload = (item: HistoryItem) => {
    showFeedback('success', 'Starting download...');
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Post History" 
        subtitle="Track your exported content and completed social media posts"
        action={
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search history..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-teal outline-none transition-all w-80 shadow-sm" 
              />
            </div>
            {history.length > 0 && (
              <button 
                onClick={handleClearAll}
                disabled={isClearingAll}
                className="px-8 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[11px] font-mono uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all flex items-center gap-3 shadow-sm disabled:opacity-50 active:scale-95"
              >
                <Trash2 size={16} /> 
                <span>Clear All</span>
              </button>
            )}
          </div>
        }
      />

      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-mono uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4 font-normal">Preview</th>
                <th className="px-6 py-4 font-normal">Property / Agent</th>
                <th className="px-6 py-4 font-normal">Format / Style</th>
                <th className="px-6 py-4 font-normal">Brand</th>
                <th className="px-6 py-4 font-normal">Date</th>
                <th className="px-6 py-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-100 shadow-sm">
                      <img src={item.thumbnail_url || 'https://picsum.photos/seed/hist/100/100'} className="w-full h-full object-cover" alt="" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{item.property_title}</p>
                    <p className="text-xs text-gray-500">{item.agent_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs">
                        {getPlatformIcon(item.platform)}
                        {item.platform} ({item.aspect_ratio})
                      </div>
                      <span className="text-[10px] font-mono uppercase text-brand-teal">{item.style}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-gray-600">{item.brand_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-mono text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDownload(item)}
                        title="Download PNG" 
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => handleCopy(item)}
                        title="Copy HTML" 
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting === item.id}
                        title="Delete" 
                        className="p-2 hover:bg-gray-100 rounded-lg text-red-500 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><MoreVertical size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic font-serif">
                    {searchTerm ? 'No results found for your search.' : 'No export history available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getPlatformIcon(platform: string) {
  if (!platform) return null;
  const p = platform.toLowerCase();
  const urls: Record<string, string> = {
    instagram: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
    facebook: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg',
    linkedin: 'https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg',
    tiktok: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg',
    youtube: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg'
  };
  return <img src={urls[p]} className={`w-3.5 h-3.5 object-contain ${p === 'tiktok' ? 'invert' : ''}`} alt={platform} />;
}
