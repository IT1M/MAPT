/**
 * Data Import System Types
 * Defines interfaces for the multi-step import wizard
 */

export interface ImportFile {
  file: File;
  name: string;
  size: number;
  type: 'csv' | 'excel';
}

export interface ColumnMapping {
  itemName: string | null;
  batch: string | null;
  quantity: string | null;
  reject: string | null;
  destination: string | null;
  category: string | null;
  notes: string | null;
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
  suggestion?: string;
}

export interface ImportOptions {
  duplicateHandling: 'skip' | 'update' | 'create';
  defaultDestination?: 'MAIS' | 'FOZAN';
  defaultCategory?: string;
}

export interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  status: 'idle' | 'processing' | 'completed' | 'cancelled' | 'error';
}

export interface ImportResult {
  successCount: number;
  failedCount: number;
  errors: ValidationError[];
  importLogId?: string;
}

export interface ParsedData {
  headers: string[];
  rows: any[];
  preview: any[];
}

export type ImportStep =
  | 'upload'
  | 'mapping'
  | 'validation'
  | 'options'
  | 'review'
  | 'progress';
