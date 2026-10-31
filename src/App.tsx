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
  Menu,
  X,
  LogOut,
  Calendar,
  TrendingUp,
  Layout,
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
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    setDashboardLoading(true);
    setDashboardError(null);
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
      setDashboardError("The agency API could not return all dashboard data.");
    } finally {
      setDashboardLoading(false);
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
          dataError={dashboardError}
          dataLoading={dashboardLoading}
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
          dataError={dashboardError}
          dataLoading={dashboardLoading}
          onNavigate={setView} 
        />
      );
    }
  };


  const navigateTo = (destination: View) => {
    setView(destination);
    setIsMobileMenuOpen(false);
  };

  const sections: { label: string; items: { view: View; label: string; icon: React.ReactNode; primary?: boolean }[] }[] = [
    { label: 'Overview', items: [{ view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> }] },
    { label: 'Listings & content', items: [
      { view: 'properties', label: 'Properties', icon: <Home size={18} /> },
      { view: 'media', label: 'Media library', icon: <Library size={18} /> },
      { view: 'templates', label: 'Templates', icon: <Layout size={18} /> }
    ] },
    { label: 'Agency', items: [
      { view: 'agents', label: 'Agents', icon: <Users size={18} /> },
      { view: 'amenities', label: 'Amenities', icon: <Sparkles size={18} /> },
      { view: 'branding', label: 'Branding', icon: <Palette size={18} /> }
    ] },
    { label: 'Marketing', items: [
      { view: 'builder', label: 'Post Builder', icon: <PlusCircle size={18} />, primary: true },
      { view: 'leads', label: 'Leads', icon: <Users size={18} /> },
      { view: 'scheduled', label: 'Schedule', icon: <Calendar size={18} /> },
      { view: 'history', label: 'History', icon: <HistoryIcon size={18} /> },
      { view: 'analytics', label: 'Analytics', icon: <TrendingUp size={18} /> }
    ] }
  ];

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isMobileMenuOpen]);

  const currentLabel = sections.flatMap(section => section.items).find(item => item.view === view)?.label
    || (view === 'agency-settings' ? 'Agency settings' : 'Dashboard');

  return (
    <div className="flex min-h-screen bg-[#f5f7f9] text-slate-900">
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] md:hidden"
        />
      )}
      <aside
        id="primary-navigation"
        aria-label="Primary navigation"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-[#101d25] text-white shadow-2xl transition-[transform,width] duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} w-[280px] ${isSidebarOpen ? 'md:w-[264px]' : 'md:w-[78px]'}`}
      >
        <div className="flex h-[76px] shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
          <button type="button" onClick={() => navigateTo('dashboard')} aria-label="PropPost dashboard" className="flex min-w-0 items-center gap-3 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#20b7a4] text-xl font-black text-[#0c2426]">P</span>
            <span className={`min-w-0 ${isSidebarOpen ? 'md:block' : 'md:hidden'}`}>
              <span className="block text-lg font-bold tracking-tight">PropPost<span className="text-teal-300">.</span></span>
              <span className="block text-[10px] font-medium tracking-[0.13em] text-slate-400">REAL ESTATE MARKETING</span>
            </span>
          </button>
          <button type="button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-slate-300 hover:bg-white/10 md:hidden"><X size={20}/></button>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5 custom-scrollbar" aria-label="Workspace sections">
          {sections.map(section => (
            <div key={section.label}>
              <p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500 ${isSidebarOpen ? 'md:block' : 'md:sr-only'}`}>{section.label}</p>
              <div className="space-y-1">
                {section.items.map(item => (
                  <SidebarItem key={item.view} label={item.label} icon={item.icon} active={view === item.view}
                    collapsed={!isSidebarOpen} primary={item.primary} onClick={() => navigateTo(item.view)} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          {user?.role === 'admin' && (
            <SidebarItem icon={<Building2 size={18}/>} label="Agency settings" active={view === 'agency-settings'} collapsed={!isSidebarOpen} onClick={() => navigateTo('agency-settings')} />
          )}
          <SidebarItem icon={<LogOut size={18}/>} label="Sign out" active={false} collapsed={!isSidebarOpen} onClick={() => { setIsMobileMenuOpen(false); logout(); }} />
          <div className={`mt-3 flex items-center gap-3 rounded-xl bg-white/[0.06] p-3 ${isSidebarOpen ? 'md:flex' : 'md:justify-center'}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-sm font-bold text-teal-200">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            <span className={`min-w-0 ${isSidebarOpen ? 'md:block' : 'md:hidden'}`}>
              <span className="block truncate text-xs font-semibold text-white">{user?.name || 'Account'}</span>
              <span className="block truncate text-[11px] capitalize text-slate-400">{user?.role || 'User'}</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-lg sm:px-6 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Open navigation" aria-expanded={isMobileMenuOpen} aria-controls="primary-navigation"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 md:hidden">
              <Menu size={20}/>
            </button>
            <button type="button" aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen(value => !value)}
              className="hidden rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 md:inline-flex">
              <Menu size={19}/>
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace / PropPost</p>
              <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">{currentLabel}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {view !== 'builder' && <button type="button" onClick={() => navigateTo('builder')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0e8278] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#0a665e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 sm:px-4 sm:text-sm">
              <PlusCircle size={17}/><span className="hidden sm:inline">Create post</span><span className="sm:hidden">Create</span>
            </button>}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200" title={user?.name || 'Account'}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
        </header>
        <main id="main-content" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label, collapsed, primary }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; collapsed: boolean; primary?: boolean; key?: React.Key }) {
  return <button type="button" onClick={onClick} title={collapsed ? label : undefined}
    aria-current={active ? 'page' : undefined}
    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${
      active ? 'bg-teal-400/15 text-teal-200' : primary ? 'text-teal-300 hover:bg-teal-400/10' : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
    }`}>
    <span className="shrink-0">{icon}</span>
    <span className={`truncate ${collapsed ? 'md:sr-only' : ''}`}>{label}</span>
    {active && <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300 ${collapsed ? 'md:hidden' : ''}`} />}
  </button>;
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
