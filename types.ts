export interface Collaborator {
  id: string;
  name: string;
  isAdmin: boolean;
  status: 'aprovado' | 'pendente';
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

export type View = 'login' | 'dashboard' | 'reports' | 'admin';

export type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';