export type LogSource = 'POS' | 'TERMINAL';

export type LogStatus = 'success' | 'failure' | 'warning' | 'info';

export type PosType = 'BPOS' | 'CPOS' | 'UNKNOWN';

export type TerminalType = 'Eximbay' | 'KIS' | 'KOCES' | 'UNKNOWN';

export interface LogEntry {
  timestamp: string;
  source: LogSource;
  event: string;
  rawLog: string;
  status: LogStatus;
  ptxId?: string;
}

export interface AnalysisResult {
  posType: PosType;
  terminal: TerminalType;
  discrepancyType: string;
  ptxId: string;
  entries: LogEntry[];
  errorPoints: number[];
}
