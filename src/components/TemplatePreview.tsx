import React from 'react';
import { Property, Agent, Branding, PostConfig } from '../types';
import { MapPin, Bed, Bath, Maximize, Phone, MessageSquare, Warehouse, ChefHat, Sparkles, Home, ChevronRight, Users, Layout, Dumbbell } from 'lucide-react';

interface Props {
  config: PostConfig;
  property: Property;
  agent: Agent;
  branding: Branding;
}

export default function TemplatePreview({ config, property, agent, branding }: Props) {
  const { activePreviewPlatform: platformFormat } = config;
  
  // Calculate dimensions based on format
  const getDimensions = () => {
    switch (platformFormat) {
      case '1:1': return { width: 400, height: 400 };
      case '4:5': return { width: 400, height: 500 };
      case '9:16': return { width: 300, height: 533 };
      case '1.91:1': return { width: 1100, height: 576 };
      case '16:9': return { width: 1100, height: 619 };
      case '1200x630': return { width: 1200, height: 630 };
      default: return { width: 400, height: 400 };
    }
  };

  const { width, height } = getDimensions();

  const containerStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: branding.background_color_hex,
    color: branding.primary_color_hex,
    fontFamily: branding.body_font_family,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const isPremiumFlyer = config.templateId === 1;
  const isExclusiveLiving = config.templateId === 2;

  const getHeadlineStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: branding.heading_font_family,
      color: branding.primary_color_hex,
      lineHeight: '1.1',
      fontWeight: 800,
    };
    
    if (isPremiumFlyer) {
      base.fontSize = '32px';
      base.fontWeight = 900;
      base.color = '#0A192F';
      base.letterSpacing = '-0.02em';
    }
    if (isExclusiveLiving) {
      base.fontSize = '36px';
      base.fontWeight = 800;
      base.color = '#283241';
      base.letterSpacing = '-0.6px';
    }
    return base;
  };

  return (
    <div id="template-render-target" style={containerStyle} className="flex flex-col relative bg-white">
      {isExclusiveLiving ? (
        <div className="flex flex-col h-full w-full overflow-hidden relative bg-[#f6f7f9]" style={{ display: 'grid', gridTemplateColumns: '37% 63%', gridTemplateRows: '64% 36%' }}>
          {/* LEFT HERO */}
          <div className="relative" style={{ gridColumn: '1 / 2', gridRow: '1 / 3', clipPath: 'polygon(0 0, 100% 0, 83% 55%, 100% 100%, 0 100%)' }}>
            <div className="absolute inset-0 z-0">
              <img src={config.selectedImages[0]} className="w-full h-full object-cover" alt="Hero" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* White wedge effect */}
            <div className="absolute top-[-8%] right-[-10%] w-[38%] h-[120%] bg-[#f6f7f9] rotate-[10deg] rounded-[60px] z-10"></div>
            
            {/* PRICE TAG */}
            {config.selectedFacts.price && (
              <div className="absolute top-[34px] left-[26px] bg-[#caa86a] text-[#1f2a37] p-[16px_18px] rounded-[14px] w-[250px] z-20" style={{ clipPath: 'polygon(0 0, 92% 0, 100% 28%, 100% 100%, 0 100%)' }}>
                <div className="text-[16px] font-medium opacity-95 mb-[6px]">Price Start From</div>
                <div className="text-[28px] font-extrabold tracking-[0.2px]">
                  {property.currency} {property.price.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT TOP CONTENT */}
          <div className="p-[34px_40px_18px_40px] relative flex flex-col" style={{ gridColumn: '2 / 3', gridRow: '1 / 2' }}>
            <div className="flex justify-between items-start gap-[18px]">
              <div className="headline">
                <h1 style={{ ...getHeadlineStyle(), fontSize: 'clamp(28px, 2.5vw, 42px)', lineHeight: '1.08', letterSpacing: '-0.6px', fontWeight: 800 }} className="m-0 text-[#283241]">
                  {config.headlineOverride || "Exclusive Properties,\nExceptional Living"}
                </h1>
                <div className="mt-[14px] w-[140px] h-[4px] bg-[#caa86a] rounded-full"></div>
              </div>

              {/* BADGE */}
              <div className="bg-[#caa86a] text-[#1f2a37] p-[14px_18px] rounded-[14px] flex items-center gap-[10px] min-w-[210px] justify-center" style={{ clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0 100%, 0 26%)' }}>
                <Home size={22} className="shrink-0" />
                <span className="font-bold text-[14px] tracking-[0.8px] uppercase">REAL ESTATE</span>
              </div>
            </div>

            <div className="m-[26px_0_14px] font-extrabold text-[#283241] text-[14px] uppercase tracking-[1px]">Features :</div>

            <div className="grid grid-cols-4 gap-y-[18px] gap-x-[22px] mt-[10px]">
              {[
                { label: 'Living Room', icon: <Layout size={20} /> },
                { label: 'Garage', icon: <Warehouse size={20} /> },
                { label: '3 Bathrooms', icon: <Bath size={20} /> },
                { label: 'Home Gym', icon: <Dumbbell size={20} /> },
                { label: '3 Bedrooms', icon: <Bed size={20} /> },
                { label: 'Kitchen Set', icon: <ChefHat size={20} /> },
                { label: 'Dining Room', icon: <Users size={20} /> },
                { label: 'Elegant Design', icon: <Sparkles size={20} /> }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-[12px] text-[#6b778a] font-semibold text-[13px] whitespace-nowrap">
                  <div className="w-[36px] h-[36px] rounded-[12px] bg-[#caa86a]/12 border border-[#caa86a]/38 flex items-center justify-center shrink-0 text-[#b89254]">
                    {item.icon}
                  </div>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="bg-[#2f3948] p-[18px_30px] relative flex items-center gap-[18px]" style={{ gridColumn: '2 / 3', gridRow: '2 / 3', display: 'grid', gridTemplateColumns: '1fr 320px' }}>
            {/* REAL ESTATE label tab */}
            <div className="absolute left-[20px] top-[-18px] bg-[#2f3948] p-[8px_12px] rounded-[12px] text-white/75 font-extrabold text-[12px] tracking-[0.8px] z-30">
              REAL ESTATE
            </div>

            {/* Gallery wrap */}
            <div className="relative h-[150px] flex items-center gap-[18px] pl-[6px]">
              {config.selectedImages.slice(1, 4).map((url, i) => (
                <div key={i} className="w-[170px] h-[110px] rounded-[14px] border-2 border-white/18 overflow-hidden relative bg-[#1d2430] shadow-[0_10px_24px_rgba(0,0,0,0.22)] skew-x-[-12deg]">
                  <img src={url} className="w-full h-full object-cover skew-x-[12deg] scale-[1.05]" alt="" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>

            {/* CTA & Contact Area */}
            <div className="justify-self-end w-[320px] text-white/86 flex flex-col gap-[12px] pr-[6px]">
              <div className="flex flex-col gap-[12px] items-end">
                <div className="flex gap-[12px] items-start justify-end text-white/82 text-[12px] font-semibold">
                  <div className="w-[34px] h-[34px] rounded-[12px] border border-[#caa86a]/50 flex items-center justify-center text-[#caa86a] shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="text-right">
                    <div className="opacity-50 text-[10px] uppercase leading-none mb-[4px]">Call For Booking</div>
                    <div className="text-[12px]">{agent.cellphone_number}</div>
                  </div>
                </div>
                <div className="flex gap-[12px] items-start justify-end text-white/82 text-[12px] font-semibold">
                  <div className="w-[34px] h-[34px] rounded-[12px] border border-[#caa86a]/50 flex items-center justify-center text-[#caa86a] shrink-0">
                    <MessageSquare size={18} />
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] truncate max-w-[200px]">{agent.email}</div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-[10px] h-[46px] rounded-[12px] border-2 border-[#caa86a]/70 text-white/92 font-extrabold tracking-[0.8px] text-[12px] w-[160px] cursor-pointer hover:bg-[#caa86a]/10 transition-all">
                  {config.ctaOverride || branding.default_cta_text}
                  <ChevronRight size={16} className="text-[#caa86a]" />
                </div>
              </div>
            </div>

            {/* Meta Line */}
            <div className="absolute left-[34px] bottom-[16px] right-[370px] flex gap-[26px] items-center flex-wrap text-white/78 text-[12px] font-semibold">
              <div className="flex items-center gap-[8px]">
                <MapPin size={16} className="text-[#caa86a]" />
                {property.location_area}, {property.location_city}
              </div>
              <div className="flex items-center gap-[8px]">
                <Maximize size={16} className="text-[#caa86a]" />
                {branding.website_url}
              </div>
            </div>
          </div>
        </div>
      ) : isPremiumFlyer ? (
        <div className="flex flex-col h-full w-full bg-white p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white translate-x-12 z-0"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="w-56 h-28 overflow-hidden border-4 border-white">
                <img src={config.selectedImages[0]} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              </div>
              <div className="text-right">
                <div className="text-[16px] font-black tracking-[0.3em] text-[#1f2a37]/30 uppercase mb-2">PRIVATE COLLECTION</div>
                <div className="w-24 h-1 bg-emerald-500 ml-auto"></div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-7xl font-black text-slate-800 tracking-tight leading-none">
                {property.title}
              </h2>
              <div className="flex items-center gap-4 text-[#1f2a37]/60 font-bold text-xl">
                <MapPin size={28} className="text-emerald-500" />
                {property.location_area}, {property.location_city}
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-8xl font-black text-emerald-600 tracking-tighter">
                {property.currency} {property.price.toLocaleString()}
              </div>
              <div className="flex items-center gap-10 text-slate-500 font-bold text-2xl">
                <div className="flex items-center gap-3"><Bed size={32} /> {property.bedrooms}</div>
                <div className="flex items-center gap-3"><Bath size={32} /> {property.bathrooms}</div>
                <div className="flex items-center gap-3"><Maximize size={32} /> {property.floor_size_m2}m²</div>
              </div>
            </div>

            <div className="flex justify-between items-end pt-12">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500">
                  <img src={agent.profile_photo_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-800 uppercase tracking-wider">{agent.full_name}</div>
                  <div className="text-slate-400 font-bold text-lg">{agent.role_optional || 'Property Consultant'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 italic">
          Select a template to preview
        </div>
      )}
    </div>
  );
}
