import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  Sparkles, 
  Palette, 
  PlusCircle, 
  Library, 
  History as HistoryIcon, 
  Settings,
  ChevronDown,
  Search,
  Bell,
  Menu,
  LogOut,
  User as UserIcon,
  Calendar,
  TrendingUp,
  Layout,
  Layers,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import Properties from './components/Properties';
import Agents from './components/Agents';
import Amenities from './components/Amenities';
import Branding from './components/Branding';
import PostBuilder from './components/PostBuilder';
import Templates from './components/Templates';
import History from './components/History';
import ScheduledPosts from './components/ScheduledPosts';
import Leads from './components/Leads';
import Analytics from './components/Analytics';
import MediaLibrary from './components/MediaLibrary';
import AgencySettings from './components/AgencySettings';
import { Property, Agent, Branding as BrandingType, Amenity, HistoryItem, ScheduledPost } from './types';

type View = 'dashboard' | 'properties' | 'agents' | 'amenities' | 'branding' | 'builder' | 'templates' | 'history' | 'scheduled' | 'leads' | 'analytics' | 'settings' | 'media' | 'agency-settings';

function AppContent() {
  const { user, token, logout } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [branding, setBranding] = useState<BrandingType[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchData = async () => {
    if (!token) return;
    try {
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      const [pRes, aRes, bRes, amRes, hRes, sRes, tRes] = await Promise.all([
        fetch('/api/properties', { headers }),
        fetch('/api/agents', { headers }),
        fetch('/api/branding', { headers }),
        fetch('/api/amenities', { headers }),
        fetch('/api/history', { headers }),
        fetch('/api/scheduled_posts', { headers }),
        fetch('/api/analytics/dashboard', { headers })
      ]);

      const checkResponse = async (res: Response) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Request failed with status ${res.status}: ${text.slice(0, 100)}`);
        }
        return res.json();
      };

      const [propertiesData, agentsData, brandingData, amenitiesData, historyData, scheduledData, dashboardData] = await Promise.all([
        checkResponse(pRes),
        checkResponse(aRes),
        checkResponse(bRes),
        checkResponse(amRes),
        checkResponse(hRes),
        checkResponse(sRes),
        checkResponse(tRes)
      ]);

      setProperties(propertiesData);
      setAgents(agentsData);
      setBranding(brandingData);
      setAmenities(amenitiesData);
      setHistory(historyData);
      setScheduledPosts(scheduledData);
      setDashboardData(dashboardData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const renderView = () => {
    switch (view) {
      case 'dashboard': return (
        <Dashboard 
          stats={{ 
            totalProperties: dashboardData?.stats?.totalProperties || 0, 
            activeCampaigns: dashboardData?.stats?.activeCampaigns || 0, 
            totalLeads: dashboardData?.stats?.totalLeads || 0, 
            scheduledPosts: dashboardData?.stats?.scheduledPosts || 0 
          }} 
          history={history} 
          scheduledPosts={scheduledPosts} 
          topProperties={dashboardData?.topProperties || []} 
          leadsPerAgent={dashboardData?.leadsPerAgent || []} 
          recentActivity={dashboardData?.recentActivity || []}
          onNavigate={setView} 
        />
      );
      case 'properties': return <Properties properties={properties} amenities={amenities} agents={agents} onUpdate={fetchData} />;
      case 'agents': return <Agents agents={agents} onUpdate={fetchData} />;
      case 'amenities': return <Amenities amenities={amenities} onUpdate={fetchData} />;
      case 'branding': return <Branding branding={branding} onUpdate={fetchData} />;
      case 'builder': return <PostBuilder properties={properties} agents={agents} branding={branding[0]} amenities={amenities} onComplete={fetchData} />;
      case 'templates': return <Templates branding={branding[0]} />;
      case 'history': return <History history={history} onUpdate={fetchData} />;
      case 'scheduled': return <ScheduledPosts scheduledPosts={scheduledPosts} onUpdate={fetchData} />;
      case 'leads': return <Leads dashboardData={dashboardData} />;
      case 'analytics': return <Analytics />;
      case 'media': return <MediaLibrary />;
      case 'agency-settings': return <AgencySettings />;
      default: return (
        <Dashboard 
          stats={{ 
            totalProperties: dashboardData?.stats?.totalProperties || 0, 
            activeCampaigns: dashboardData?.stats?.activeCampaigns || 0, 
            totalLeads: dashboardData?.stats?.totalLeads || 0, 
            scheduledPosts: dashboardData?.stats?.scheduledPosts || 0 
          }} 
          history={history} 
          scheduledPosts={scheduledPosts} 
          topProperties={dashboardData?.topProperties || []} 
          leadsPerAgent={dashboardData?.leadsPerAgent || []} 
          recentActivity={dashboardData?.recentActivity || []}
          onNavigate={setView} 
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-brand-white flex text-[#1A1A1A] font-sans">
      {/* Sidebar */}
      <aside className={`bg-[#080809] text-white flex flex-col transition-all duration-500 z-50 sticky top-0 h-screen border-r border-white/[0.05] ${isSidebarOpen ? 'w-[260px]' : 'w-20'}`}>
        <div className="h-20 flex items-center px-5 gap-3 border-b border-white/[0.05] bg-black/20">
          <div className="w-10 h-10 bg-brand-teal rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-brand-teal/20 shrink-0 relative group overflow-hidden">
            <span className="relative z-10 text-white">P</span>
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none text-white">PropPost</span>
              <span className="text-[8px] font-mono font-bold text-brand-teal uppercase tracking-[0.2em] mt-1 opacity-70">Marketing Platform</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {/* OVERVIEW */}
          <div className="pb-2">
            {isSidebarOpen && (
              <div className="px-3 mb-1">
                <p className="text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/20">Overview</p>
              </div>
            )}
            <SidebarItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={16} />} label="Dashboard" collapsed={!isSidebarOpen} />
          </div>

          {/* CONTENT */}
          <div className="pb-2 border-t border-white/[0.03] pt-2">
            {isSidebarOpen && (
              <div className="px-3 mb-1">
                <p className="text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/20">Content</p>
              </div>
            )}
            <SidebarItem active={view === 'properties'} onClick={() => setView('properties')} icon={<Home size={16} />} label="Properties" collapsed={!isSidebarOpen} />
            <SidebarItem active={view === 'media'} onClick={() => setView('media')} icon={<Library size={16} />} label="Media Library" collapsed={!isSidebarOpen} />
            <SidebarItem active={view === 'templates'} onClick={() => setView('templates')} icon={<Layout size={16} />} label="Templates" collapsed={!isSidebarOpen} />
          </div>

          {/* TEAM */}
          <div className="pb-2 border-t border-white/[0.03] pt-2">
            {isSidebarOpen && (
              <div className="px-3 mb-1">
                <p className="text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/20">Team</p>
              </div>
            )}
            <SidebarItem active={view === 'agents'} onClick={() => setView('agents')} icon={<Users size={16} />} label="Agents" collapsed={!isSidebarOpen} />
            <SidebarItem active={view === 'amenities'} onClick={() => setView('amenities')} icon={<Sparkles size={16} />} label="Amenities" collapsed={!isSidebarOpen} />
            <SidebarItem active={view === 'branding'} onClick={() => setView('branding')} icon={<Palette size={16} />} label="Branding" collapsed={!isSidebarOpen} />
          </div>

          {/* MARKETING */}
          <div className="pb-2 border-t border-white/[0.03] pt-2">
            {isSidebarOpen && (
              <div className="px-3 mb-1">
                <p className="text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/20">Marketing</p>
              </div>
            )}
            <SidebarItem active={view === 'builder'} onClick={() => setView('builder')} icon={<PlusCircle size={16} />} label="Post Builder" collapsed={!isSidebarOpen} primary />
            <SidebarItem active={view === 'leads'} onClick={() => setView('leads')} icon={<Users size={16} />} label="Leads" collapsed={!isSidebarOpen} />
            <SidebarItem active={view === 'scheduled'} onClick={() => setView('scheduled')} icon={<Calendar size={16} />} label="Scheduled" collapsed={!isSidebarOpen} />
            <SidebarItem active={view === 'history'} onClick={() => setView('history')} icon={<HistoryIcon size={16} />} label="History" collapsed={!isSidebarOpen} />
            <SidebarItem active={view === 'analytics'} onClick={() => setView('analytics')} icon={<TrendingUp size={16} />} label="Analytics" collapsed={!isSidebarOpen} />
          </div>
        </nav>

        <div className="p-3 border-t border-white/[0.05] bg-black/20 space-y-3">
          {/* User Account Area */}
          <div className={`flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors cursor-pointer group ${!isSidebarOpen ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 bg-brand-teal rounded flex items-center justify-center text-white font-bold text-[10px] shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-white truncate">{user?.name || 'Mpho Ronald'}</span>
                <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest">{user?.role || 'Admin'}</span>
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            {user?.role === 'admin' && (
              <SidebarItem active={view === 'agency-settings'} onClick={() => setView('agency-settings')} icon={<Building2 size={16} />} label="Agency" collapsed={!isSidebarOpen} />
            )}
            <SidebarItem active={view === 'settings'} onClick={() => setView('settings')} icon={<Settings size={16} />} label="Settings" collapsed={!isSidebarOpen} />
            <SidebarItem active={false} onClick={logout} icon={<LogOut size={16} />} label="Logout" collapsed={!isSidebarOpen} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-xl transition-all active:scale-90"
            >
              <Menu size={20} className="text-gray-400" />
            </button>
            <div className="h-6 w-px bg-gray-100"></div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.3em]">Current View</span>
              <div className="flex items-center gap-2">
                <span className="capitalize font-bold text-gray-900">{view.replace('-', ' ')}</span>
                {view === 'builder' && (
                  <>
                    <span className="text-gray-300">/</span>
                    <span className="text-brand-teal font-medium">Studio</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative hidden md:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search engine..." 
                className="pl-12 pr-6 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm w-72 focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal focus:bg-white transition-all outline-none" 
              />
            </div>
            
            <div className="flex items-center gap-4 border-l border-gray-100 pl-8">
              <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-brand-teal hover:bg-brand-teal/5 rounded-xl relative transition-all">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-teal rounded-full border-2 border-white"></span>
              </button>
              
              <div className="flex items-center gap-3 pl-4 py-1.5 pr-1.5 bg-gray-50 border border-gray-100 rounded-2xl hover:border-brand-teal/30 transition-all cursor-pointer group">
                <div className="flex flex-col items-end hidden lg:block">
                  <p className="text-[11px] font-bold text-gray-900 leading-none group-hover:text-brand-teal transition-colors">{user?.name || 'Mpho Ronald'}</p>
                  <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest font-bold">{user?.role || 'Admin'}</p>
                </div>
                <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-[10px] shadow-md group-hover:scale-105 transition-transform">
                  {user?.name?.[0] || 'M'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* View Container */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label, collapsed, primary }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, collapsed: boolean, primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 group relative overflow-hidden ${
        active 
          ? primary 
            ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20' 
            : 'bg-white/[0.08] text-white' 
          : primary 
            ? 'bg-brand-teal/5 text-brand-teal hover:bg-brand-teal/10' 
            : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      <div className={`relative z-10 ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300 shrink-0`}>
        {icon}
      </div>
      
      {!collapsed && (
        <span className="relative z-10 text-xs font-bold tracking-wide truncate">
          {label}
        </span>
      )}

      {collapsed && (
        <div className="absolute left-full ml-4 px-3 py-2 bg-[#121214] text-white text-[9px] font-bold uppercase tracking-[0.1em] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/[0.05]">
          {label}
        </div>
      )}
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
