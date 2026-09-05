// User types
export interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatar_path?: string
  is_active: boolean
  organization?: Organization
  roles: string[]
  permissions: string[]
}

// Organization types
export interface Organization {
  id: string
  name: string
  legal_name?: string
  cnpj?: string
  email: string
  phone?: string
  logo_path?: string
  subscription_status: 'trial' | 'active' | 'past_due' | 'canceled'
  subscription_plan: string
  subscription_ends_at?: string
}

// Category types
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  /** Nome do ícone (ex.: "utensils"), não o símbolo. Renderize com CategoryIcon. */
  icon?: string
  color?: string
  is_active: boolean
  /** Só vem nas rotas que usam withCount('vendors'). */
  vendors_count?: number
}

// Vendor types
export interface Vendor {
  id: string
  organization_id?: string
  trade_name: string
  legal_name?: string
  cnpj?: string
  email?: string
  phone?: string
  whatsapp?: string
  website?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  latitude?: number
  longitude?: number
  service_radius_km: number
  logo_path?: string
  description?: string
  accepts_urgent: boolean
  is_verified: boolean
  average_rating: number
  total_ratings: number
  is_local_business: boolean
  is_sustainable: boolean
  is_minority_owned: boolean
  is_active: boolean
  // Marketplace fields
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended'
  rejection_reason?: string
  approved_by?: string
  approved_at?: string
  source: 'self_register' | 'import' | 'invite' | 'admin'
  invite_token?: string
  invite_expires_at?: string
  invited_by?: string
  subscription_tier: 'free' | 'featured' | 'premium'
  subscription_expires_at?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  // Relationships
  categories?: Category[]
  organization?: Organization
  distance?: number // Calculated field for geo queries
  created_at?: string
  updated_at?: string
}

// Event types
export interface Event {
  id: string
  organization_id: string
  created_by: string
  name: string
  description?: string
  briefing?: string
  start_date: string
  end_date?: string
  start_time?: string
  end_time?: string
  venue_name?: string
  address: string
  city: string
  state: string
  zip_code?: string
  latitude?: number
  longitude?: number
  estimated_budget?: number
  actual_budget?: number
  currency: string
  expected_attendees?: number
  status: 'draft' | 'active' | 'completed' | 'canceled'
  required_categories?: string[]
  creator?: User
  quote_requests?: QuoteRequest[]
}

// Quote Request types
export interface QuoteRequest {
  id: string
  event_id: string
  category_id: string
  created_by: string
  title: string
  technical_description: string
  specifications?: string
  budget_min?: number
  budget_max?: number
  response_deadline?: string
  delivery_deadline?: string
  status: 'draft' | 'open' | 'in_review' | 'closed' | 'canceled'
  max_proposals?: number
  is_urgent: boolean
  event?: Event
  category?: Category
  proposals?: Proposal[]
  vendors?: VendorInvite[]
}

export interface VendorInvite {
  id: string
  vendor_id: string
  token: string
  status: 'pending' | 'sent' | 'viewed' | 'responded' | 'expired'
  sent_at?: string
  viewed_at?: string
  responded_at?: string
  vendor?: Vendor
}

// Proposal types
export interface Proposal {
  id: string
  quote_request_id: string
  vendor_id: string
  total_value: number
  labor_value?: number
  material_value?: number
  transport_value?: number
  taxes_value?: number
  discount_value?: number
  currency: string
  payment_terms?: string
  payment_days?: number
  payment_conditions?: string
  delivery_date?: string
  setup_hours?: number
  delivery_notes?: string
  description?: string
  items?: ProposalItem[]
  included_services?: string[]
  excluded_services?: string[]
  observations?: string
  pdf_path?: string
  locked_value?: number
  locked_at?: string
  status: 'draft' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'contracted'
  reviewed_at?: string
  review_notes?: string
  valid_until?: string
  vendor?: Vendor
  quote_request?: QuoteRequest
}

export interface ProposalItem {
  description: string
  quantity: number
  unit_price: number
  total_price: number
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  meta?: PaginationMeta
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
  organization_name: string
}

export interface AuthResponse {
  user: User
  token: string
}

// Dashboard types
export interface DashboardStats {
  active_events: number
  total_vendors: number
  open_quotes: number
  pending_proposals: number
  events_this_month: number
  active_budget: number
  verified_vendors: number
  response_rate: number
}

export interface UpcomingEvent {
  id: string
  name: string
  start_date: string
  city: string
  state: string
  days_until: number
  estimated_budget: number
  expected_attendees: number
}

export interface RecentProposal {
  id: string
  vendor_name: string
  event_name: string
  value: number
  status: string
  submitted_at?: string
  created_at: string
}

export interface TopVendor {
  id: string
  trade_name: string
  city: string
  state: string
  average_rating: number
  total_ratings: number
  is_verified: boolean
}

export interface DashboardData {
  stats: DashboardStats
  upcoming_events: UpcomingEvent[]
  recent_proposals: RecentProposal[]
  top_vendors: TopVendor[]
}
