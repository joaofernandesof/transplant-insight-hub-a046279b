// Marketplace Types - reutilizando estruturas existentes do Portal

export interface MarketplaceProfessional {
  id: string;
  portalUserId: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  crm: string;
  crmState?: string;
  rqe?: string;
  specialty?: string;
  bio?: string;
  isAvailable: boolean;
  consultationDuration: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

export interface MarketplaceUnit {
  id: string;
  name: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  professionals: MarketplaceProfessional[];
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

export interface MarketplaceProcedure {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration: number;
  price?: number;
  isActive: boolean;
}

export interface MarketplaceLead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  source: 'marketplace' | 'indication' | 'direct';
  procedureInterest?: string;
  status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';
  responsibleId?: string;
  notes?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceReview {
  id: string;
  patientName: string;
  professionalId?: string;
  unitId?: string;
  rating: number;
  comment?: string;
  reply?: string;
  repliedAt?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface MarketplaceCampaign {
  id: string;
  name: string;
  description?: string;
  type: 'email' | 'push' | 'sms';
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  targetAudience: string;
  content: string;
  scheduledAt?: string;
  sentAt?: string;
  sentCount?: number;
  openRate?: number;
  createdAt: string;
}

export interface MarketplaceMetrics {
  totalLeads: number;
  newLeadsThisMonth: number;
  conversionRate: number;
  totalAppointments: number;
  appointmentsThisMonth: number;
  averageRating: number;
  reviewsThisMonth: number;
  leadsBySource: { source: string; count: number }[];
  leadsByStatus: { status: string; count: number }[];
}

export interface MarketplaceScheduleSlot {
  id: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  appointmentId?: string;
}

export type LeadStatus = MarketplaceLead['status'];
export type CampaignStatus = MarketplaceCampaign['status'];
export type CampaignType = MarketplaceCampaign['type'];
