import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  MousePointer2, 
  Eye, 
  Share2, 
  MessageSquare, 
  ThumbsUp,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  Layout,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardData } from '../types';
import PageHeader from './PageHeader';
import { motion } from 'motion/react';

const COLORS = ['#1E97AB', '#359288', '#518E58', '#7BB072', '#A6D28C'];

export default function Analytics() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/analytics/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Aggregating ROI Data...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      <PageHeader 
        title="Marketing Intelligence" 
        subtitle="Performance metrics and ROI tracking across all platforms"
      />

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Posts" 
            value={data.stats.totalPosts} 
            icon={<Layout size={20} />} 
            trend="+12%" 
            isUp={true}
          />
          <StatCard 
            title="Total Leads" 
            value={data.stats.totalLeads} 
            icon={<Users size={20} />} 
            trend="+8%" 
            isUp={true}
          />
          <StatCard 
            title="Total Clicks" 
            value={data.stats.totalClicks} 
            icon={<MousePointer2 size={20} />} 
            trend="+24%" 
            isUp={true}
          />
          <StatCard 
            title="Impressions" 
            value={data.stats.totalImpressions.toLocaleString()} 
            icon={<Eye size={20} />} 
            trend="-3%" 
            isUp={false}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Platform Performance */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Platform Performance</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Engagement by channel</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <Filter size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.platformPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="platform" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9ca3af', textTransform: 'uppercase' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f9fafb' }}
                  />
                  <Bar dataKey="clicks" fill="#1E97AB" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="likes" fill="#359288" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leads per Agent */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Agent Performance</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Lead conversion by agent</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.leadsPerAgent}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="leadCount"
                    nameKey="agentName"
                  >
                    {data.leadsPerAgent.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {data.leadsPerAgent.map((agent, index) => (
                  <div key={agent.agentName} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] text-gray-500 font-medium">{agent.agentName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Properties */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900">High-Performance Assets</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Top properties by engagement</p>
            </div>
            <button className="text-[10px] font-mono text-brand-teal uppercase tracking-widest hover:underline">
              View Full Report
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">Property Asset</th>
                  <th className="text-center py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">Impressions</th>
                  <th className="text-center py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">Clicks</th>
                  <th className="text-center py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">Leads</th>
                  <th className="text-center py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">Score</th>
                  <th className="text-right py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.topProperties.map((prop, i) => (
                  <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                          0{i + 1}
                        </div>
                        <span className="text-xs font-bold text-gray-900">{prop.title}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center text-xs font-mono text-gray-500">{prop.impressionCount?.toLocaleString() || 0}</td>
                    <td className="py-4 text-center text-xs font-mono text-gray-500">{prop.clickCount || 0}</td>
                    <td className="py-4 text-center">
                      <span className="px-2 py-1 bg-brand-teal/5 text-brand-teal rounded-lg text-[10px] font-bold">
                        {prop.leadCount}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-brand-teal">{prop.marketingScore}%</span>
                        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-teal" style={{ width: `${prop.marketingScore}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-xs font-bold text-emerald-500">
                        <TrendingUp size={12} />
                        {prop.clickCount > 0 ? ((prop.leadCount / prop.clickCount) * 100).toFixed(1) : 0}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Conversions</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Latest inbound inquiries</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.recentLeads.map((lead) => (
              <div key={lead.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{lead.contactName}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{new Date(lead.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-white rounded-lg border border-gray-100 text-[8px] font-mono uppercase tracking-widest text-brand-teal">
                    {lead.source}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Property</p>
                  <p className="text-xs font-bold text-gray-900 truncate">{lead.propertyTitle}</p>
                </div>
                <p className="text-[11px] text-gray-600 italic leading-relaxed line-clamp-2">"{lead.message}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, isUp }: { title: string, value: string | number, icon: React.ReactNode, trend: string, isUp: boolean }) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-teal/5 group-hover:text-brand-teal transition-colors">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
    </div>
  );
}
