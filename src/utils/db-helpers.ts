import { Prisma } from '@prisma/client';
import { prisma } from '@/services/prisma';

/**
 * Database Error Types
 */
export enum DbErrorCode {
  UNIQUE_CONSTRAINT = 'P2002',
  FOREIGN_KEY_CONSTRAINT = 'P2003',
  RECORD_NOT_FOUND = 'P2025',
  DEPENDENT_RECORDS = 'P2014',
  CONNECTION_ERROR = 'P1001',
  TIMEOUT = 'P1008',
}

/**
 * Custom Database Error Class
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public meta?: Record<string, any>
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Handle Prisma errors and convert them to user-friendly messages
 */
export function handlePrismaError(error: unknown): DatabaseError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case DbErrorCode.UNIQUE_CONSTRAINT:
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return new DatabaseError(
          `A record with this ${field} already exists`,
          error.code,
          error.meta
        );

      case DbErrorCode.FOREIGN_KEY_CONSTRAINT:
        return new DatabaseError(
          'Invalid reference: The related record does not exist',
          error.code,
          error.meta
        );

      case DbErrorCode.RECORD_NOT_FOUND:
        return new DatabaseError('Record not found', error.code, error.meta);

      case DbErrorCode.DEPENDENT_RECORDS:
        return new DatabaseError(
          'Cannot delete record: It has dependent records',
          error.code,
          error.meta
        );

      default:
        return new DatabaseError(
          `Database error: ${error.message}`,
          error.code,
          error.meta
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new DatabaseError('Invalid data provided', 'VALIDATION_ERROR');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError(
      'Failed to connect to database',
      DbErrorCode.CONNECTION_ERROR
    );
  }

  if (error instanceof Error) {
    return new DatabaseError(error.message);
  }

  return new DatabaseError('An unknown database error occurred');
}

/**
 * Transaction wrapper for atomic operations
 * Automatically handles errors and rollback
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(callback, {
      maxWait: 5000, // Maximum time to wait for a transaction slot (ms)
      timeout: 10000, // Maximum time the transaction can run (ms)
    });
  } catch (error) {
    throw handlePrismaError(error);
  }
}

/**
 * Safe query wrapper that handles errors gracefully
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>
): Promise<{ data: T | null; error: DatabaseError | null }> {
  try {
    const data = await queryFn();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handlePrismaError(error) };
  }
}

/**
 * Pagination helper types
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

/**
 * Offset-based pagination helper
 * Use for simple pagination with page numbers
 */
export async function paginateQuery<T>(
  model: any,
  params: PaginationParams & { where?: any; orderBy?: any; include?: any },
  defaultPageSize = 10
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, params.pageSize || defaultPageSize);
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    model.findMany({
      where: params.where,
      orderBy: params.orderBy,
      include: params.include,
      skip,
      take: pageSize,
    }),
    model.count({ where: params.where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Cursor-based pagination helper
 * Use for infinite scroll or large datasets
 */
export async function paginateWithCursor<T extends { id: string }>(
  model: any,
  params: PaginationParams & { where?: any; orderBy?: any; include?: any },
  defaultPageSize = 10
): Promise<CursorPaginatedResult<T>> {
  const pageSize = Math.min(100, params.pageSize || defaultPageSize);

  const data = await model.findMany({
    where: params.where,
    orderBy: params.orderBy || { createdAt: 'desc' },
    include: params.include,
    take: pageSize + 1, // Fetch one extra to check if there's more
    ...(params.cursor && {
      cursor: { id: params.cursor },
      skip: 1, // Skip the cursor itself
    }),
  });

  const hasMore = data.length > pageSize;
  const items = hasMore ? data.slice(0, pageSize) : data;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    data: items,
    pagination: {
      nextCursor,
      hasMore,
    },
  };
}

/**
 * Batch operation helper
 * Processes items in batches to avoid memory issues
 */
export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Upsert helper - creates or updates a record
 */
export async function upsertRecord<T>(
  model: any,
  where: any,
  create: any,
  update: any
): Promise<T> {
  try {
    return await model.upsert({
      where,
      create,
      update,
    });
  } catch (error) {
    throw handlePrismaError(error);
  }
}

/**
 * Soft delete helper
 * Updates a record with deleted flag instead of removing it
 */
export async function softDelete(
  model: any,
  id: string,
  deletedByField = 'deletedAt'
): Promise<void> {
  try {
    await model.update({
      where: { id },
      data: { [deletedByField]: new Date() },
    });
  } catch (error) {
    throw handlePrismaError(error);
  }
}

/**
 * Bulk create with error handling
 */
export async function bulkCreate<T>(
  model: any,
  data: any[],
  skipDuplicates = false
): Promise<Prisma.BatchPayload> {
  try {
    return await model.createMany({
      data,
      skipDuplicates,
    });
  } catch (error) {
    throw handlePrismaError(error);
  }
}

/**
 * Find or create helper
 */
export async function findOrCreate<T>(
  model: any,
  where: any,
  create: any
): Promise<{ record: T; created: boolean }> {
  try {
    const existing = await model.findUnique({ where });
    if (existing) {
      return { record: existing, created: false };
    }

    const record = await model.create({ data: create });
    return { record, created: true };
  } catch (error) {
    throw handlePrismaError(error);
  }
}

/**
 * Check if record exists
 */
export async function recordExists(model: any, where: any): Promise<boolean> {
  const count = await model.count({ where });
  return count > 0;
}

/**
 * Get record or throw error
 */
export async function getRecordOrThrow<T>(
  model: any,
  where: any,
  include?: any
): Promise<T> {
  try {
    const record = await model.findUniqueOrThrow({
      where,
      include,
    });
    return record;
  } catch (error) {
    throw handlePrismaError(error);
  }
}

/**
 * Date range query helper
 */
export interface DateRangeParams {
  startDate?: Date | string;
  endDate?: Date | string;
  field?: string;
}

export function buildDateRangeFilter(params: DateRangeParams) {
  const field = params.field || 'createdAt';
  const filter: any = {};

  if (params.startDate || params.endDate) {
    filter[field] = {};

    if (params.startDate) {
      filter[field].gte = new Date(params.startDate);
    }

    if (params.endDate) {
      filter[field].lte = new Date(params.endDate);
    }
  }

  return filter;
}

/**
 * Search helper for text fields
 */
export function buildSearchFilter(searchTerm: string, fields: string[]): any {
  if (!searchTerm || fields.length === 0) {
    return {};
  }

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as Prisma.QueryMode,
      },
    })),
  };
}

/**
 * Aggregate helper for common aggregations
 */
export async function aggregateData(
  model: any,
  where: any,
  aggregations: {
    count?: boolean;
    sum?: string[];
    avg?: string[];
    min?: string[];
    max?: string[];
  }
) {
  const aggregateQuery: any = { where };

  if (aggregations.count) {
    aggregateQuery._count = true;
  }

  if (aggregations.sum) {
    aggregateQuery._sum = aggregations.sum.reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {}
    );
  }

  if (aggregations.avg) {
    aggregateQuery._avg = aggregations.avg.reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {}
    );
  }

  if (aggregations.min) {
    aggregateQuery._min = aggregations.min.reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {}
    );
  }

  if (aggregations.max) {
    aggregateQuery._max = aggregations.max.reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {}
    );
  }

  return await model.aggregate(aggregateQuery);
}
