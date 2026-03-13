import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  Download,
  Instagram,
  Facebook,
  Linkedin,
  Video,
  Palette,
  Sparkles,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2,
  Zap,
  Layers,
  MousePointer2,
  MessageSquare,
  Image as ImageIcon,
  UserPlus
} from 'lucide-react';
import { HistoryItem, ScheduledPost } from '../types';

interface Props {
  stats: {
    totalProperties: number;
    activeCampaigns: number;
    totalLeads: number;
    scheduledPosts: number;
  };
  history: HistoryItem[];
  scheduledPosts: ScheduledPost[];
  topProperties: any[];
  leadsPerAgent: any[];
  recentActivity: any[];
  onNavigate: (view: any) => void;
}

export default function Dashboard({ stats, history, scheduledPosts, topProperties, leadsPerAgent, recentActivity, onNavigate }: Props) {
  const formatTimelineDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const postDate = new Date(year, month - 1, day);
    postDate.setHours(0, 0, 0, 0);
    
    if (postDate.getTime() === today.getTime()) return 'Today';
    if (postDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return postDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const groupedPosts = [...scheduledPosts]
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .slice(0, 7)
    .reduce((acc: Record<string, ScheduledPost[]>, post) => {
      const dateKey = formatTimelineDate(post.date);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(post);
      return acc;
    }, {});

  const getStatusBadge = (post: ScheduledPost) => {
    if (post.status === 'posted') return { label: 'published', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={10} /> };
    if (post.status === 'failed') return { label: 'failed', color: 'bg-red-50 text-red-600 border-red-100', icon: <AlertCircle size={10} /> };
    
    // Check if it's currently "publishing" (e.g. scheduled time is past but not yet posted)
    const scheduledTime = new Date(`${post.date}T${post.time}`).getTime();
    const now = Date.now();
    if (now >= scheduledTime && post.status === 'scheduled') {
      return { label: 'publishing', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Loader2 size={10} className="animate-spin" /> };
    }
    
    return { label: 'scheduled', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Clock size={10} /> };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-20"
    >
      {/* Header Section: Command Center Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif italic tracking-tight text-gray-900">Marketing Command Center</h2>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-[0.3em] mt-2">Operational Intelligence & Distribution Hub</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <QuickActionButton onClick={() => onNavigate('properties')} icon={<Plus size={16} />} label="Add Property" />
          <QuickActionButton onClick={() => onNavigate('builder')} icon={<Zap size={16} />} label="Create Post" primary />
          <QuickActionButton onClick={() => onNavigate('media')} icon={<ImageIcon size={16} />} label="Upload Media" />
          <QuickActionButton onClick={() => onNavigate('agents')} icon={<UserPlus size={16} />} label="Add Agent" />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Properties" value={stats.totalProperties} icon={<Home size={20} />} trend="+2 this week" />
        <StatCard label="Active Campaigns" value={stats.activeCampaigns} icon={<Layers size={20} />} color="text-amber-500" />
        <StatCard label="Leads Generated" value={stats.totalLeads} icon={<MessageSquare size={20} />} color="text-emerald-500" trend="+5 today" />
        <StatCard label="Scheduled Posts" value={stats.scheduledPosts} icon={<Calendar size={20} />} color="text-brand-teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Marketing Timeline & Top Assets */}
        <div className="lg:col-span-2 space-y-10">
          {/* Marketing Timeline */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div>
                <h3 className="font-serif italic text-xl tracking-tight">Marketing Timeline</h3>
                <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Upcoming Distribution Schedule</p>
              </div>
              <button 
                onClick={() => onNavigate('scheduled')}
                className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[9px] font-mono uppercase tracking-widest hover:border-brand-teal hover:text-brand-teal transition-all shadow-sm active:scale-95"
              >
                View Full Schedule
              </button>
            </div>
            
            <div className="p-10">
              {Object.keys(groupedPosts).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(groupedPosts).map(([date, posts]) => (
                    <div key={date} className="space-y-4">
                      <h4 className="text-[9px] font-mono uppercase tracking-[0.3em] text-brand-teal font-bold flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-teal"></div>
                        {date}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(posts as ScheduledPost[]).map((post) => {
                          const status = getStatusBadge(post);
                          return (
                            <div key={post.id} className="group p-5 bg-gray-50/50 border border-gray-100 rounded-2xl hover:border-brand-teal/30 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-brand-teal transition-colors">
                                    {getPlatformIcon(post.platforms[0])}
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-mono uppercase tracking-widest text-gray-400">{post.platforms[0]}</p>
                                    <p className="text-xs font-bold text-gray-900 truncate max-w-[140px]">{post.propertyTitle || 'Marketing Update'}</p>
                                  </div>
                                </div>
                                <div className={`px-2 py-1 rounded-lg border ${status.color} flex items-center gap-1.5`}>
                                  {status.icon}
                                  <span className="text-[8px] font-mono uppercase tracking-tighter font-bold">{status.label}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Clock size={12} />
                                  <span className="text-[10px] font-mono">{post.time}</span>
                                </div>
                                <button className="text-[9px] font-mono uppercase tracking-widest text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity">
                                  Details
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <Calendar size={40} className="text-gray-300" />
                  <div>
                    <p className="text-sm font-serif italic">No upcoming distributions</p>
                    <p className="text-[9px] font-mono uppercase tracking-widest mt-1">Initialize your first campaign to see the timeline</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Performing Properties */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div>
                <h3 className="font-serif italic text-xl tracking-tight">Top Performing Assets</h3>
                <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Ranked by Marketing Score</p>
              </div>
              <button 
                onClick={() => onNavigate('analytics')}
                className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[9px] font-mono uppercase tracking-widest hover:border-brand-teal hover:text-brand-teal transition-all shadow-sm active:scale-95"
              >
                Full Analytics
              </button>
            </div>
            
            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topProperties.length > 0 ? (
                  topProperties.slice(0, 4).map((prop, i) => (
                    <div key={i} className="p-6 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-4 hover:bg-white hover:shadow-lg transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{prop.title}</p>
                          <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest mt-1">{prop.leadCount} Leads • {((prop.impressionCount || 0) / 1000).toFixed(1)}k Reach</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-serif italic text-brand-teal font-bold">{prop.marketingScore}%</span>
                          <span className="text-[8px] font-mono uppercase text-gray-400">Score</span>
                        </div>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${prop.marketingScore}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full bg-brand-teal"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center opacity-40 space-y-3">
                    <TrendingUp size={32} className="text-gray-300" />
                    <p className="text-[10px] font-mono uppercase tracking-widest">No performance data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-full">
            <div className="px-8 py-8 border-b border-gray-50 bg-gray-50/30">
              <h3 className="font-serif italic text-xl tracking-tight">Recent Activity</h3>
              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Operational Event Log</p>
            </div>
            
            <div className="p-8 flex-1">
              <div className="space-y-8">
                {(recentActivity || []).length > 0 ? (
                  (recentActivity || []).map((activity, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="relative flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${getActivityStyle(activity.type).bg}`}>
                          {getActivityStyle(activity.type).icon}
                        </div>
                        {i !== (recentActivity || []).length - 1 && (
                          <div className="w-px h-full bg-gray-100 mt-2"></div>
                        )}
                      </div>
                      <div className="pb-8">
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                          {formatActivityTime(activity.timestamp)}
                        </p>
                        <p className="text-xs font-bold text-gray-900 mt-1 group-hover:text-brand-teal transition-colors">
                          {getActivityMessage(activity)}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1 truncate max-w-[200px]">
                          {activity.label}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-center opacity-40 space-y-3">
                    <Clock size={32} className="text-gray-300" />
                    <p className="text-[10px] font-mono uppercase tracking-widest">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-gray-50/50 border-t border-gray-50">
              <button 
                onClick={() => onNavigate('history')}
                className="w-full py-3 bg-white border border-gray-200 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
              >
                View Full Audit Log <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickActionButton({ onClick, icon, label, primary }: { onClick: () => void, icon: React.ReactNode, label: string, primary?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
        primary 
          ? 'bg-brand-teal text-white hover:bg-brand-dark-teal shadow-brand-teal/20 shadow-lg' 
          : 'bg-white text-gray-600 border border-gray-100 hover:border-brand-teal hover:text-brand-teal'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function getActivityStyle(type: string) {
  switch (type) {
    case 'property_added': return { icon: <Home size={16} className="text-blue-500" />, bg: 'bg-blue-50 border-blue-100' };
    case 'agent_created': return { icon: <Users size={16} className="text-purple-500" />, bg: 'bg-purple-50 border-purple-100' };
    case 'post_scheduled': return { icon: <Calendar size={16} className="text-brand-teal" />, bg: 'bg-brand-teal/10 border-brand-teal/20' };
    case 'lead_received': return { icon: <MessageSquare size={16} className="text-emerald-500" />, bg: 'bg-emerald-50 border-emerald-100' };
    default: return { icon: <Clock size={16} className="text-gray-400" />, bg: 'bg-gray-50 border-gray-100' };
  }
}

function getActivityMessage(activity: any) {
  switch (activity.type) {
    case 'property_added': return 'New Property Added';
    case 'agent_created': return 'New Agent Onboarded';
    case 'post_scheduled': return 'Marketing Post Scheduled';
    case 'lead_received': return 'New Lead Received';
    default: return 'System Event';
  }
}

function formatActivityTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function PerformanceMiniCard({ label, value, icon, trend }: { label: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-teal shadow-sm">
          {icon}
        </div>
        <span className="text-[9px] font-bold text-emerald-500">{trend}</span>
      </div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon, trend, color = "text-brand-teal" }: { label: string, value: number, icon: React.ReactNode, trend?: string, color?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-500 group relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center ${color} group-hover:bg-brand-teal/5 group-hover:text-brand-teal transition-all duration-500 shadow-sm`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">{trend}</span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-bold tracking-tight text-gray-900">
          {value.toString().padStart(2, '0')}
        </p>
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
