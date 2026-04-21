export type LogSource = 'POS' | 'TERMINAL';

export type LogStatus = 'success' | 'failure' | 'warning' | 'info';

export type PosType = 'BPOS' | 'CPOS' | 'APOS' | 'UNKNOWN';

export type TerminalType = 'Eximbay' | 'KIS' | 'KOCES' | 'UNKNOWN';

export interface LogEntry {
  timestamp: string;
  source: LogSource;
  event: string;
  rawLog: string;
  status: LogStatus;
  ptxId?: string;
  resultCode?: string;
  resultMessage?: string;
}

export type AttemptResult = 'success' | 'failure' | 'cancelled' | 'timeout' | 'unknown';

export interface PaymentAttempt {
  attemptNumber: number;
  startIndex: number;
  endIndex: number;
  startTimestamp: string;
  endTimestamp: string;
  vanApprovalSent: boolean;
  vanApprovalSuccess: boolean;
  posReceivedSuccess: boolean;
  result: AttemptResult;
  resultDetail: string;
}

export interface AnalysisResult {
  posType: PosType;
  terminal: TerminalType;
  discrepancyType: string;
  ptxId: string;
  entries: LogEntry[];
  errorPoints: number[];
  attempts?: PaymentAttempt[];
  conclusion?: string;
  actualApprovalCount?: number;
  isDuplicatePaymentSuspected?: boolean;
}
