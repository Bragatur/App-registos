import React from 'react';

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
  /** Data e hora do evento, pode ser editada. */
  timestamp: string;
  /** Data e hora da criação do registo, imutável. */
  createdAt: string;
  count: number;
  visitReason?: string;
  lengthOfStay?: string;
}

export type View = 'login' | 'dashboard' | 'reports' | 'admin' | 'analysis';

export type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface Notification {
  message: React.ReactNode;
  type: 'success' | 'error';
  undoAction?: () => void;
}