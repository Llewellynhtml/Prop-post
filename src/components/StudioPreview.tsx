import React from 'react';
import { BedDouble, Bath, CarFront, ImageIcon, MapPin, Ruler, Sparkles } from 'lucide-react';
import type { Agent, Branding, PostConfig, Property } from '../types';

interface Props {
  config: PostConfig;
  property?: Property;
  agent?: Agent;
  branding?: Branding;
  platformLabel?: string;
  onEditContent: () => void;
  onSelectMedia: () => void;
}
const ratioMap: Record<string, string> = { '1:1': '1 / 1', '4:5': '4 / 5', '9:16': '9 / 16', '1.91:1': '1.91 / 1', '16:9': '16 / 9', '1200x630': '1.91 / 1' };
const safeColor = (value: string | undefined, fallback: string) => value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;

export default function StudioPreview({ config, property, agent, branding, platformLabel, onEditContent, onSelectMedia }: Props) {
  const hero = config.selectedImages[0] || property?.images?.[0]?.image_url;
  const accent = safeColor(branding?.primary_color_hex, '#0e8278');
  const secondary = safeColor(branding?.accent_color_hex, '#1f2937');
  const headline = config.headlineOverride || property?.title || 'Your next property campaign';
  const location = property ? [property.location_area, property.location_city].filter(Boolean).join(', ') : 'Select a property to begin';
  const format = config.activePreviewPlatform || '1:1';
  const badge = config.badge || (property?.listing_type === 'rent' ? 'TO LET' : 'FOR SALE');

  return <aside aria-label="Live property marketing preview" className="min-w-0 rounded-[24px] border border-slate-200 bg-white shadow-sm xl:sticky xl:top-24 xl:self-start">
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">Creative preview</p><h3 className="mt-1 text-base font-bold text-slate-900">Live branded draft</h3></div>
      <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{format}</span>
    </div>
    <div className="bg-slate-50 p-4">
      <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" style={{ aspectRatio: ratioMap[format] || '1 / 1' }}>
        <div className="flex h-full flex-col">
          <div className="relative min-h-0 flex-[3] overflow-hidden bg-slate-200">
            {hero ? <img src={hero} alt="Selected property" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400"><ImageIcon size={22}/> Add property media</div>}
            <span className="absolute left-3 top-3 rounded-md px-2.5 py-1.5 text-[10px] font-extrabold tracking-wider text-white shadow" style={{ background: accent }}>{badge}</span>
            {config.selectedFacts.price && property && <span className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-extrabold text-slate-900 shadow">R {Number(property.price).toLocaleString('en-ZA')}</span>}
          </div>
          <div className="flex min-h-0 flex-[2] flex-col justify-between gap-2 overflow-hidden p-4" style={{ borderTop: `4px solid ${accent}` }}>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}><MapPin size={11}/><span className="truncate">{location}</span></div>
              <h4 className="mt-1 line-clamp-2 text-base font-black leading-tight" style={{ color: secondary }}>{headline}</h4>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-600">
                {property && config.selectedFacts.beds && <span className="inline-flex items-center gap-1"><BedDouble size={13}/>{property.bedrooms}</span>}
                {property && config.selectedFacts.baths && <span className="inline-flex items-center gap-1"><Bath size={13}/>{property.bathrooms}</span>}
                {property && config.selectedFacts.parking && <span className="inline-flex items-center gap-1"><CarFront size={13}/>{property.parking}</span>}
                {property && config.selectedFacts.size && <span className="inline-flex items-center gap-1"><Ruler size={13}/>{property.floor_size_m2} m²</span>}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
              <span className="min-w-0 truncate text-[11px] font-bold text-slate-800">{agent?.full_name || branding?.company_name || 'Agency name'}</span>
              <span className="shrink-0 text-[10px] font-bold" style={{ color: accent }}>{config.ctaOverride || 'Enquire now'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="space-y-3 px-5 py-4">
      <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Channel</span><strong className="text-slate-800">{platformLabel || 'Not selected'}</strong></div>
      <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Media selected</span><strong className="text-slate-800">{config.selectedImages.length}</strong></div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onEditContent} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">Edit content</button>
        <button type="button" onClick={onSelectMedia} className="rounded-xl bg-[#0e8278] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#0a665e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">Change media</button>
      </div>
      <p className="flex items-start gap-1.5 text-[11px] leading-4 text-slate-500"><Sparkles size={13} className="mt-0.5 shrink-0"/> Responsive draft preview. Final downloadable image rendering is not yet implemented.</p>
    </div>
  </aside>;
}
