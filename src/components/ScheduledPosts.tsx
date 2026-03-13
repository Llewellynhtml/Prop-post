import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  Send, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  List,
  Filter,
  History as HistoryIcon,
  Calendar as CalendarIcon
} from 'lucide-react';
import { ScheduledPost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from './PageHeader';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  scheduledPosts: ScheduledPost[];
  onUpdate: () => void;
}

type GroupKey = 'Today' | 'Tomorrow' | 'This Week' | 'Later';
type ViewMode = 'list' | 'calendar';

export default function ScheduledPosts({ scheduledPosts, onUpdate }: Props) {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState<number | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handlePostNow = async (id: number) => {
    try {
      const res = await fetch(`/api/scheduled_posts/${id}/post`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showFeedback('success', 'Post triggered successfully');
        onUpdate();
      } else {
        showFeedback('error', 'Failed to trigger post');
      }
    } catch (error) {
      showFeedback('error', 'An error occurred');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) return;
    try {
      const res = await fetch(`/api/scheduled_posts/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showFeedback('success', 'Scheduled post cancelled');
        onUpdate();
      } else {
        showFeedback('error', 'Failed to cancel post');
      }
    } catch (error) {
      showFeedback('error', 'An error occurred');
    }
  };

  const handleReschedule = async (id: number) => {
    if (!rescheduleData.date || !rescheduleData.time) {
      showFeedback('error', 'Please select date and time');
      return;
    }

    try {
      const res = await fetch(`/api/scheduled_posts/${id}/reschedule`, { 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(rescheduleData)
      });
      if (res.ok) {
        showFeedback('success', 'Post rescheduled successfully');
        setIsRescheduling(null);
        onUpdate();
      } else {
        showFeedback('error', 'Failed to reschedule post');
      }
    } catch (error) {
      showFeedback('error', 'An error occurred');
    }
  };

  const groupPosts = () => {
    const groups: Record<GroupKey, ScheduledPost[]> = {
      'Today': [],
      'Tomorrow': [],
      'This Week': [],
      'Later': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    scheduledPosts.forEach(post => {
      if (searchTerm && 
          !(post.propertyTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) && 
          !(post.caption?.toLowerCase() || '').includes(searchTerm.toLowerCase())) {
        return;
      }

      const postDate = new Date(post.date);
      
      if (postDate.getTime() === today.getTime()) {
        groups['Today'].push(post);
      } else if (postDate.getTime() === tomorrow.getTime()) {
        groups['Tomorrow'].push(post);
      } else if (postDate.getTime() > tomorrow.getTime() && postDate.getTime() < nextWeek.getTime()) {
        groups['This Week'].push(post);
      } else {
        groups['Later'].push(post);
      }
    });

    return groups;
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    // Padding for previous month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const groupedPosts = groupPosts();
  const calendarDays = getCalendarDays();

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Scheduled Posts" 
        subtitle="Manage your automated social media presence across all platforms"
        action={
          <div className="flex gap-4">
            <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-sm">
              <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-brand-teal shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List size={16} />
                <span>List</span>
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-brand-teal shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <CalendarIcon size={16} />
                <span>Calendar</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search schedules..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-teal outline-none transition-all w-80 shadow-sm" 
              />
            </div>
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

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-12"
          >
            {(Object.keys(groupedPosts) as GroupKey[]).map(group => (
              groupedPosts[group].length > 0 && (
                <section key={group} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-900">{group}</h2>
                    <div className="h-px flex-1 bg-gray-100"></div>
                    <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {groupedPosts[group].length} {groupedPosts[group].length === 1 ? 'Post' : 'Posts'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {groupedPosts[group].map((post) => (
                      <div key={post.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                        <div className="flex items-center p-4 gap-6">
                          {/* Preview */}
                          <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden border border-gray-100 shadow-sm shrink-0 relative group/preview">
                            <img src={post.imageURL || 'https://picsum.photos/seed/sched/200/200'} className="w-full h-full object-cover group-hover/preview:scale-110 transition-transform duration-500" alt="" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                              <LayoutGrid size={20} className="text-white" />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-gray-900 truncate">{post.propertyTitle}</h3>
                              <StatusBadge status={post.status} publishStatus={post.publish_status} />
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-1 mb-3">{post.caption}</p>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                                <Calendar size={14} />
                                {post.date}
                              </div>
                              <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                                <Clock size={14} />
                                {post.time}
                              </div>
                              <div className="flex items-center gap-2">
                                {post.platforms.map(p => (
                                  <div key={p} className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100" title={p}>
                                    {getPlatformIcon(p)}
                                  </div>
                                ))}
                              </div>
                              {post.attempts > 0 && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                  <RefreshCw size={10} className={post.status === 'scheduled' ? 'animate-spin' : ''} />
                                  {post.attempts} {post.attempts === 1 ? 'Retry' : 'Retries'}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handlePostNow(post.id)}
                              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                            >
                              <Send size={14} />
                              <span>Publish Now</span>
                            </button>
                            
                            <button 
                              onClick={() => {
                                setIsRescheduling(post.id);
                                setRescheduleData({ date: post.date, time: post.time });
                              }}
                              className="p-2.5 hover:bg-gray-50 text-gray-400 hover:text-brand-teal rounded-xl transition-all"
                              title="Reschedule"
                            >
                              <Edit2 size={18} />
                            </button>

                            <button 
                              onClick={() => handleDelete(post.id)}
                              className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all"
                              title="Cancel"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Reschedule Overlay */}
                        <AnimatePresence>
                          {isRescheduling === post.id && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gray-100 bg-gray-50/50 p-4"
                            >
                              <div className="flex items-end gap-4 max-w-2xl">
                                <div className="flex-1 space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">New Date</label>
                                  <input 
                                    type="date" 
                                    value={rescheduleData.date}
                                    onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none transition-all"
                                  />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">New Time</label>
                                  <input 
                                    type="time" 
                                    value={rescheduleData.time}
                                    onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal outline-none transition-all"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleReschedule(post.id)}
                                    className="px-6 py-2.5 bg-brand-teal text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-teal/20 hover:scale-105 active:scale-95 transition-all"
                                  >
                                    Save Changes
                                  </button>
                                  <button 
                                    onClick={() => setIsRescheduling(null)}
                                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Error Message */}
                        {post.status === 'failed' && post.failure_reason && (
                          <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
                            <AlertCircle size={12} className="text-red-500" />
                            <span className="text-[10px] font-medium text-red-600">Failed: {post.failure_reason}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )
            ))}

            {Object.values(groupedPosts).every(g => g.length === 0) && (
              <div className="py-32 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar size={32} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Scheduled Posts</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  {searchTerm ? 'No posts match your search criteria.' : 'Your queue is empty. Start building posts to see them here.'}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Calendar Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                  <button 
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-50 text-gray-400 hover:text-brand-teal rounded-lg transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-teal transition-all"
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-gray-50 text-gray-400 hover:text-brand-teal rounded-lg transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Published</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Failed</span>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-r border-gray-100 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayPosts = day ? scheduledPosts.filter(p => p.date === day.toISOString().split('T')[0]) : [];
                const isToday = day && day.toDateString() === new Date().toDateString();

                return (
                  <div 
                    key={idx} 
                    className={`min-h-[160px] p-4 border-r border-b border-gray-100 last:border-r-0 relative transition-colors ${!day ? 'bg-gray-50/30' : 'hover:bg-gray-50/50'}`}
                  >
                    {day && (
                      <>
                        <span className={`text-sm font-bold ${isToday ? 'w-8 h-8 bg-brand-teal text-white rounded-full flex items-center justify-center -ml-1 -mt-1 shadow-lg shadow-brand-teal/20' : 'text-gray-400'}`}>
                          {day.getDate()}
                        </span>
                        
                        <div className="mt-3 space-y-2">
                          {dayPosts.map(post => (
                            <div 
                              key={post.id}
                              className={`p-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                                post.status === 'posted' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                post.status === 'failed' ? 'bg-red-50 border-red-100 text-red-700' :
                                'bg-blue-50 border-blue-100 text-blue-700'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate">{post.propertyTitle}</span>
                                <span className="shrink-0 opacity-60">{post.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status, publishStatus }: { status: string, publishStatus?: string }) {
  if (status === 'posted') {
    return (
      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-widest">
        Published
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[9px] font-bold uppercase tracking-widest">
        Failed
      </span>
    );
  }
  if (publishStatus === 'pending') {
    return (
      <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[9px] font-bold uppercase tracking-widest">
        Pending
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[9px] font-bold uppercase tracking-widest">
      Scheduled
    </span>
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
  return <img src={urls[p]} className={`w-3 h-3 object-contain ${p === 'tiktok' ? 'invert' : ''}`} alt={platform} />;
}
