/**
 * Advanced Filtering System Types
 * Supports complex filter conditions with AND/OR logic
 */

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'between'
  | 'is_null'
  | 'is_not_null'
  | 'in'
  | 'not_in';

export type FilterLogic = 'AND' | 'OR';

export interface Filter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  logic?: FilterLogic;
}

export interface FilterGroup {
  filters: Filter[];
  logic: FilterLogic;
}

export interface SavedFilterData {
  id: string;
  userId: string;
  name: string;
  filters: FilterGroup;
  page: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterFieldConfig {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  operators: FilterOperator[];
  enumValues?: { value: string; label: string }[];
}

export interface ShareableFilter {
  name: string;
  filters: FilterGroup;
  page: string;
  version: string;
}
