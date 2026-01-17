
export enum EvaluationDecision {
  APPROVE = 'Approve / Continue',
  CONDITIONAL = 'Conditional / Improve',
  REJECT = 'Reject / Exit',
  AUTO_REJECT = 'AUTO REJECT / EXIT'
}

export type EvaluationType = 'New Onboarding' | 'Existing Hotel Health Report';

export interface ScorecardEntry {
  parameter: string;
  score: number;
  reason: string;
}

export interface TreeboPresence {
  cityHotelCount: number;
  nearestHotelName: string;
  nearestHotelDistance: string;
  marketShareContext: string;
}

export interface GuestReviewPlatform {
  platform: string;
  positive: string[];
  negative: string[];
  sentimentScore: number; // 0-100, where 100 is perfect
  recurringThemes: {
    theme: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

export enum OTAStatus {
  FAIL = 'FAIL',
  WARNING = 'WARNING',
  PASS = 'PASS'
}

export interface ProtocolStatus {
  duplicationAudit: OTAStatus;
  geoVerification: OTAStatus;
  complianceAudit: OTAStatus;
  notes?: string;
}

export interface OTAAuditItem {
  platform: string;
  status: OTAStatus;
  currentRating?: string;
  channelBlockers: string[];
  recoveryPlan: string[];
}

export interface RoomTypeAudit {
  roomName: string;
  sizeSqFt?: string;
  occupancy: string;
  amenities: string[];
  descriptionAudit: string;
  configRisk: string;
}

export interface Competitor {
  name: string;
  otaRating: number;
  estimatedADR: string;
  distance: string;
  category: string;
}

export interface TargetHotelMetrics {
  averageOTARating: number;
  estimatedADR: number;
  adrCurrency: string;
}

export interface EvaluationResult {
  executiveSummary: {
    hotelName: string;
    city: string;
    evaluationType: EvaluationType;
    finalDecision: EvaluationDecision;
    averageScore: number;
  };
  targetHotelMetrics?: TargetHotelMetrics;
  scorecard: ScorecardEntry[];
  roomTypeAudit?: RoomTypeAudit[];
  treeboPresence?: TreeboPresence;
  protocolStatus: ProtocolStatus;
  guestReviews?: GuestReviewPlatform[];
  otaAudit?: OTAAuditItem[];
  competitors?: Competitor[];
  topCorporates?: string[];
  topTravelAgents?: string[];
  keyRisks: string[];
  commercialUpside: string[];
  finalRecommendation: string;
  conditionalActionPlan?: string[];
  hardStopFlagged: boolean;
  hardStopReason?: string;
  groundingSources?: { title: string; uri: string }[];
}

export interface HotelInput {
  hotelName: string;
  city: string;
  reportType: EvaluationType;
}
