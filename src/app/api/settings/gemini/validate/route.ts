import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkAuth, checkRole } from '@/middleware/auth';
import {
  successResponse,
  handleApiError,
  validationError,
} from '@/utils/api-response';
import { ValidationResult } from '@/types/settings';

/**
 * POST /api/settings/gemini/validate
 *
 * Validate Gemini API key and return usage statistics
 *
 * Requirements: 15.3, 15.4
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if ('error' in authResult) {
      return authResult.error;
    }

    const { context } = authResult;

    // Check user role (ADMIN only)
    const roleCheck = checkRole('ADMIN', context);
    if ('error' in roleCheck) {
      return roleCheck.error;
    }

    // Parse request body
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return validationError('API key is required');
    }

    // Validate API key by making a test request
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Make a simple test request
      const result = await model.generateContent('Hello');
      const response = await result.response;

      // If we get here, the API key is valid
      const text = response.text();

      // Try to get usage metadata if available
      let usageStats = null;
      try {
        // Note: Usage stats might not be available in all API responses
        // This is a placeholder for when the API provides this information
        usageStats = {
          requestsThisMonth: 0, // Would need to track this separately
          tokensConsumed: 0, // Would need to track this separately
          rateLimit: {
            limit: 60, // Default rate limit (requests per minute)
            remaining: 59,
            resetAt: new Date(Date.now() + 60000), // 1 minute from now
          },
        };
      } catch (error) {
        console.log('[Gemini Validate] Usage stats not available:', error);
      }

      const validationResult: ValidationResult = {
        valid: true,
        message: 'API key is valid and working correctly',
        lastValidated: new Date(),
      };

      return successResponse({
        validation: validationResult,
        usage: usageStats,
      });
    } catch (error: any) {
      console.error('[Gemini Validate] Validation failed:', error);

      // Check for specific error types
      let errorMessage = 'API key validation failed';

      if (error.message?.includes('API_KEY_INVALID')) {
        errorMessage = 'Invalid API key. Please check your key and try again.';
      } else if (
        error.message?.includes('429') ||
        error.message?.includes('quota')
      ) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else if (error.message?.includes('403')) {
        errorMessage =
          'API key does not have permission to access this service.';
      } else if (
        error.message?.includes('network') ||
        error.message?.includes('ENOTFOUND')
      ) {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      const validationResult: ValidationResult = {
        valid: false,
        message: errorMessage,
      };

      return successResponse({
        validation: validationResult,
        usage: null,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
