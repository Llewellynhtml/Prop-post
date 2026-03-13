export interface Property {
  id: number;
  title: string;
  price: number;
  currency: string;
  listing_type: 'sale' | 'rent';
  status: 'available' | 'pending' | 'sold' | 'archived';
  agent_id?: number;
  location_city: string;
  location_area: string;
  address_optional?: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  floor_size_m2: number;
  erf_size_m2?: number;
  short_description: string;
  long_description?: string;
  created_at: string;
  updated_at: string;
  amenities?: PropertyAmenity[];
  images?: PropertyImage[];
  metrics?: {
    marketing_score: number;
    posts_created: number;
    leads_generated: number;
    total_reach: number;
  };
}

export interface PropertyAmenity {
  id: number;
  name: string;
  icon_optional?: string;
  priority_score?: number;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  caption_optional?: string;
  sort_order: number;
  is_hero: boolean;
}

export interface Amenity {
  id: number;
  name: string;
  icon_optional?: string;
}

export interface Agent {
  id: number;
  full_name: string;
  role_optional?: string;
  profile_photo_url: string;
  email: string;
  whatsapp_number: string;
  cellphone_number: string;
  office_number_optional?: string;
  bio_optional?: string;
  linkedin_url_optional?: string;
  instagram_url_optional?: string;
}

export interface Branding {
  id: number;
  company_name: string;
  logo_url: string;
  watermark_logo_optional_url?: string;
  primary_color_hex: string;
  secondary_color_hex: string;
  accent_color_hex: string;
  background_color_hex: string;
  heading_font_family: string;
  body_font_family: string;
  default_cta_text: string;
  website_url: string;
  default_hashtags_optional?: string;
}

export interface PostConfig {
  brandingId: number;
  propertyId: number;
  agentId: number;
  templateId: number;
  selectedAmenities: string[];
  selectedFacts: {
    price: boolean;
    beds: boolean;
    baths: boolean;
    parking: boolean;
    size: boolean;
    location: boolean;
  };
  selectedImages: string[];
  layoutStyle: 'Luxury' | 'Minimal' | 'Bold' | 'Editorial' | 'Modern' | 'Just Sold' | 'Price Badge' | 'Editorial Banner';
  selectedPlatforms: ('1:1' | '4:5' | '9:16' | '1.91:1' | '16:9' | '1200x630')[];
  activePreviewPlatform: '1:1' | '4:5' | '9:16' | '1.91:1' | '16:9' | '1200x630';
  videoUrl?: string;
  headlineOverride?: string;
  subheadlineOverride?: string;
  captionOverride?: string;
  ctaOverride?: string;
  badge?: string;
  contactToggles: {
    whatsapp: boolean;
    cell: boolean;
    email: boolean;
    photo: boolean;
  };
  postContent?: string;
  postVisibility?: 'public' | 'friends' | 'only_me';
  postLocation?: string;
}

export interface Template {
  id: number;
  name: string;
  category: 'just_sold' | 'for_sale' | 'banner' | 'multilingual' | 'feature_icons' | 'new_listing' | 'modern_lavender' | 'modern_earthy';
  style_theme: 'luxury' | 'minimal' | 'bold' | 'editorial' | 'modern';
  supported_formats: string[]; // Parsed from JSON
  thumbnail_url?: string;
  description?: string;
  version: number;
  layout_rules?: any;
  is_favorite?: boolean;
  tags?: string;
  listing_status?: string;
}

export interface HistoryItem {
  id: number;
  property_id: number;
  agent_id: number;
  brand_id: number;
  template_id?: number;
  platform: string;
  aspect_ratio: string;
  style: string;
  created_at: string;
  thumbnail_url?: string;
  property_title?: string;
  agent_name?: string;
  brand_name?: string;
  template_name?: string;
}

export interface Post {
  id: number;
  user_id?: number;
  content: string;
  visibility: 'public' | 'friends' | 'only_me';
  location?: string;
  platform?: string;
  dimensions?: string;
  created_at: string;
  media?: PostMedia[];
}

export interface PostMedia {
  id: number;
  post_id: number;
  media_url: string;
  media_type: 'image' | 'video';
}

export interface ScheduledPost {
  id?: number;
  propertyId: number;
  agentId: number;
  platforms: string[];
  caption: string;
  imageURL?: string;
  videoURL?: string;
  status: 'scheduled' | 'posted' | 'failed';
  publish_status?: 'pending' | 'success' | 'error';
  date: string;
  time: string;
  createdAt: string;
  propertyTitle?: string;
  agentName?: string;
  attempts?: number;
  last_attempt?: string;
  failure_reason?: string;
}

export interface Lead {
  id: number;
  propertyId?: number;
  postId?: number;
  agentId?: number;
  source: 'website' | 'instagram' | 'facebook' | 'linkedin' | 'whatsapp';
  contactName: string;
  contactPhone: string;
  message?: string;
  metadata?: any;
  createdAt: string;
  propertyTitle?: string;
  agentName?: string;
}

export interface AnalyticsStats {
  totalPosts: number;
  totalLeads: number;
  totalClicks: number;
  totalImpressions: number;
}

export interface TopProperty {
  title: string;
  leadCount: number;
  clickCount: number;
  impressionCount: number;
  marketingScore: number;
}

export interface PlatformPerformance {
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  impressions: number;
}

export interface AgentLeads {
  agentName: string;
  leadCount: number;
}

export interface DashboardData {
  stats: AnalyticsStats;
  topProperties: TopProperty[];
  platformPerformance: PlatformPerformance[];
  leadsPerAgent: AgentLeads[];
  recentLeads: Lead[];
}

export interface PropertyPerformanceData {
  stats: {
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    impressions: number;
    leads: number;
  };
  platformBreakdown: {
    platform: string;
    clicks: number;
    impressions: number;
  }[];
}
