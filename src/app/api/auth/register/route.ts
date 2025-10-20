import { NextRequest } from 'next/server';
import { hash } from 'bcrypt';
import { prisma } from '@/services/prisma';
import { registrationSchema } from '@/utils/validators';
import { sanitizeObject } from '@/utils/sanitize';
import { createAuditLog, extractRequestMetadata } from '@/utils/audit';
import {
  successResponse,
  handleApiError,
  conflictError,
  validationError,
} from '@/utils/api-response';

/**
 * POST /api/auth/register
 * Register a new user account
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = registrationSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        'Validation failed',
        validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }

    const { email, name, password, role } = validationResult.data;

    // Sanitize string inputs
    const sanitizedData = sanitizeObject({ email, name });

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedData.email },
    });

    if (existingUser) {
      return conflictError('A user with this email already exists', {
        field: 'email',
      });
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await hash(password, 12);

    // Create user with DATA_ENTRY role default
    const user = await prisma.user.create({
      data: {
        email: sanitizedData.email,
        name: sanitizedData.name,
        passwordHash,
        role: role || 'DATA_ENTRY',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Extract request metadata for audit log
    const metadata = extractRequestMetadata(request);

    // Create audit log entry
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      changes: {
        new: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      metadata,
    });

    // Return sanitized user object (passwordHash excluded by select)
    return successResponse(user, 'User registered successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
