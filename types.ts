export interface Collaborator {
  id: string;
  name: string;
}

export interface Interaction {
  id: string;
  collaboratorId: string;
  nationality: string;
  timestamp: string;
  count: number;
  visitReason?: string;
  lengthOfStay?: string;
}

export type View = 'login' | 'dashboard' | 'reports';

export type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';