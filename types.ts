export const PRIMARY_ADMIN_ID = 'primary_admin_account';

export interface Collaborator {
  id: string;
  name: string;
  email: string; // Adicionado para recuperação de password
  password: string; // Adicionado para segurança
  isAdmin: boolean;
  status: 'aprovado' | 'pendente';
  mustChangePassword?: boolean;
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

export interface Notification {
  message: string;
  type: 'success' | 'error';
  undoAction?: () => void;
}