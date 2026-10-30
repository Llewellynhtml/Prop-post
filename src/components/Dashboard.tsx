import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight, ArrowUpRight, Building2, CalendarDays, CheckCircle2,
  Clock3, FilePlus2, Home, Layers3, Megaphone, MessageSquareText,
  Plus, ShieldAlert, Sparkles, TrendingUp, Users, AlertTriangle
} from 'lucide-react';
import type { HistoryItem, ScheduledPost } from '../types';

interface Props {
  stats: { totalProperties: number; activeCampaigns: number; totalLeads: number; scheduledPosts: number };
  history: HistoryItem[];
  scheduledPosts: ScheduledPost[];
  topProperties: any[];
  leadsPerAgent: any[];
  recentActivity: any[];
  onNavigate: (view: any) => void;
  dataError?: string | null;
  dataLoading?: boolean;
}

const numberFormat = new Intl.NumberFormat('en-ZA');
const card = 'rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_36px_rgba(15,23,42,0.035)]';
const linkStyle = 'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-teal-700 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600';

function postingState(post: ScheduledPost) {
  const publishStatus = (post as any).publish_status;
  if (publishStatus === 'not_configured') return { text: 'Manual publishing needed', classes: 'bg-amber-50 text-amber-800 ring-amber-200' };
  if (post.status === 'failed') return { text: 'Needs attention', classes: 'bg-rose-50 text-rose-700 ring-rose-200' };
  if (post.status === 'posted') return { text: 'Marked posted', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
  return { text: 'Planned', classes: 'bg-sky-50 text-sky-700 ring-sky-200' };
}

function shortDate(date: string, time?: string) {
  const parsed = new Date(`${date}T${time || '12:00'}`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatTile({ label, value, icon, detail, onClick }: { label: string; value: number; icon: React.ReactNode; detail: string; onClick: () => void }) {
  return <button onClick={onClick} className={`${card} group p-5 text-left transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600`}>
    <div className="flex items-start justify-between gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-700">{icon}</span>
      <ArrowUpRight size={17} className="text-slate-300 group-hover:text-teal-600" aria-hidden />
    </div>
    <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{numberFormat.format(value)}</p>
    <p className="mt-1 text-sm font-semibold text-slate-800">{label}</p>
    <p className="mt-1 text-xs text-slate-500">{detail}</p>
  </button>;
}

function SectionHeading({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description?: string; action?: string; onAction?: () => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p>
      <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
    </div>
    {action && onAction && <button type="button" onClick={onAction} className={linkStyle}>{action}<ArrowRight size={15}/></button>}
  </div>;
}

export default function Dashboard({ stats, scheduledPosts, topProperties, recentActivity, onNavigate, dataError, dataLoading }: Props) {
  const upcoming = scheduledPosts
    .filter(post => post.status === 'scheduled')
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 5);
  const propertyHighlights = topProperties.slice(0, 4);

  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mx-auto max-w-[1480px] space-y-7 pb-16">
    <header className="relative overflow-hidden rounded-[28px] bg-[#101f27] px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-10">
      <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl"/>
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-teal-200"><Building2 size={14}/> Real estate marketing workspace</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your marketing, in one place.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Manage listings, prepare branded property content, and follow your agency's marketing activity.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => onNavigate('properties')} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><Plus size={17}/> Add property</button>
          <button onClick={() => onNavigate('builder')} className="inline-flex items-center gap-2 rounded-xl bg-[#20b7a4] px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#6ce0d0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><Sparkles size={17}/> Create marketing post <ArrowRight size={16}/></button>
        </div>
      </div>
    </header>

    {dataError && <div role="alert" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950"><ShieldAlert className="mt-0.5 shrink-0" size={21}/><div><p className="font-semibold">Dashboard data is unavailable</p><p className="mt-1 text-sm">{dataError} Metrics are not shown as live until the API connection succeeds.</p></div></div>}
    {dataLoading && <div role="status" className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">Loading agency data…</div>}

    <section aria-label="Agency overview">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-bold tracking-tight text-slate-900">Agency overview</h2><p className="mt-1 text-sm text-slate-500">Statistics reported by your connected agency database</p></div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">{dataError ? 'Data unavailable' : 'Agency data'}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Properties" value={stats.totalProperties} detail="Listings in your workspace" icon={<Home size={21}/>} onClick={() => onNavigate('properties')}/>
        <StatTile label="Active campaigns" value={stats.activeCampaigns} detail="Campaigns reported by the API" icon={<Megaphone size={21}/>} onClick={() => onNavigate('analytics')}/>
        <StatTile label="Leads recorded" value={stats.totalLeads} detail="Inquiries captured by the agency" icon={<Users size={21}/>} onClick={() => onNavigate('leads')}/>
        <StatTile label="Scheduled posts" value={stats.scheduledPosts} detail="Planned marketing activity" icon={<CalendarDays size={21}/>} onClick={() => onNavigate('scheduled')}/>
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
      <div className="space-y-6">
        <section className={card}>
          <SectionHeading eyebrow="Plan" title="Upcoming marketing" description="Scheduled posts do not imply automatic publishing." action="View schedule" onAction={() => onNavigate('scheduled')}/>
          <div className="space-y-3 px-5 py-5 sm:px-7">
            {upcoming.length ? upcoming.map(post => {
              const state = postingState(post);
              return <div key={post.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm"><CalendarDays size={20}/></span>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{post.propertyTitle || 'Property marketing post'}</p><p className="mt-1 text-xs text-slate-500">{shortDate(post.date, post.time)} at {post.time} · {post.platforms?.join(', ') || 'Platform not selected'}</p></div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${state.classes}`}>{state.text}</span>
              </div>;
            }) : <div className="py-10 text-center"><CalendarDays className="mx-auto text-slate-300" size={34}/><p className="mt-3 text-sm font-semibold text-slate-800">Nothing scheduled yet</p><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">Plan your next listing campaign from the Post Builder.</p><button onClick={() => onNavigate('builder')} className={`${linkStyle} mt-3`}>Open Post Builder <ArrowRight size={14}/></button></div>}
          </div>
        </section>

        <section className={card}>
          <SectionHeading eyebrow="Performance" title="Property highlights" description="Scores and reach come from stored agency records." action="Open analytics" onAction={() => onNavigate('analytics')}/>
          {propertyHighlights.length ? <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">{propertyHighlights.map((property, index) => {
            const score = Number(property.marketingScore);
            const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;
            return <div key={property.id || index} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <p className="truncate text-sm font-bold text-slate-900">{property.title}</p>
              <p className="mt-2 text-xs text-slate-500">{numberFormat.format(Number(property.leadCount || 0))} leads · {numberFormat.format(Number(property.impressionCount || 0))} recorded impressions</p>
              <div className="mt-5 flex items-center justify-between text-xs"><span className="font-medium text-slate-500">Marketing score</span><span className="font-bold text-teal-700">{safeScore === null ? 'Not available' : `${safeScore}%`}</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">{safeScore !== null && <div className="h-full rounded-full bg-teal-500" style={{ width: `${safeScore}%` }}/>}</div>
            </div>;
          })}</div> : <div className="p-10 text-center"><TrendingUp size={32} className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-800">No performance insights available</p><p className="mt-1 text-xs text-slate-500">Property metrics will appear when the backend has data.</p></div>}
        </section>
      </div>

      <div className="space-y-6">
        <section className={card}>
          <SectionHeading eyebrow="Shortcuts" title="Quick workspace actions"/>
          <div className="grid grid-cols-2 gap-3 p-5 sm:p-6">
            {[
              { label: 'Properties', icon: <Home size={19}/>, view: 'properties', hint: 'Manage listings' },
              { label: 'Agents', icon: <Users size={19}/>, view: 'agents', hint: 'Team directory' },
              { label: 'Brand kit', icon: <Layers3 size={19}/>, view: 'branding', hint: 'Agency identity' },
              { label: 'Templates', icon: <FilePlus2 size={19}/>, view: 'templates', hint: 'Marketing layouts' }
            ].map(item => <button key={item.view} onClick={() => onNavigate(item.view)} className="group flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-white group-hover:text-teal-700">{item.icon}</span>
              <span className="mt-4 text-sm font-bold text-slate-900">{item.label}</span>
              <span className="mt-1 text-xs text-slate-500">{item.hint}</span>
            </button>)}
          </div>
        </section>

        <section className={card}>
          <SectionHeading eyebrow="Operations" title="Recent activity" action="View history" onAction={() => onNavigate('history')}/>
          {recentActivity?.length ? <div className="divide-y divide-slate-100 px-6">{recentActivity.slice(0, 6).map((activity, index) => <div key={activity.id || index} className="flex items-start gap-3 py-4">
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">{activity.type === 'lead_received' ? <MessageSquareText size={17}/> : activity.type === 'post_scheduled' ? <Clock3 size={17}/> : <CheckCircle2 size={17}/>}</span>
            <div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{String(activity.label || activity.type || 'Agency activity')}</p><p className="mt-1 text-xs text-slate-500">{activity.timestamp ? new Date(activity.timestamp).toLocaleString('en-ZA') : 'Date unavailable'}</p></div>
          </div>)}</div> : <div className="px-6 py-10 text-center"><Clock3 size={30} className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-800">No activity recorded</p><p className="mt-1 text-xs text-slate-500">Agency actions will appear here when available.</p></div>}
        </section>

        <div className="flex items-start gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-5 text-slate-800"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-teal-700"/><p className="text-xs leading-5">Social publishing connections are not yet enabled. Use export or manual publishing until an official provider integration is verified.</p></div>
      </div>
    </div>
  </motion.div>;
}
