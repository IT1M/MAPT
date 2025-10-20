import { prisma } from './fixtures';

/**
 * Authenticated fetch helper for API tests
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  sessionToken?: string
) {
  const headers = new Headers(options.headers);

  if (sessionToken) {
    headers.set('Cookie', `next-auth.session-token=${sessionToken}`);
  }

  headers.set('Content-Type', 'application/json');

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Create authenticated session for testing
 */
export async function createAuthenticatedSession(userId: string) {
  const sessionToken = `test-session-${Date.now()}-${Math.random()}`;

  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  return {
    sessionToken,
    session,
  };
}

/**
 * Make authenticated API request
 */
export async function makeAuthenticatedRequest(
  url: string,
  method: string = 'GET',
  body?: any,
  userId?: string
) {
  let sessionToken: string | undefined;

  if (userId) {
    const { sessionToken: token } = await createAuthenticatedSession(userId);
    sessionToken = token;
  }

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return authenticatedFetch(url, options, sessionToken);
}

/**
 * Parse JSON response
 */
export async function parseJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${text}`);
  }
}

/**
 * Assert response status
 */
export function assertResponseStatus(
  response: Response,
  expectedStatus: number
) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}`
    );
  }
}

/**
 * Wait for condition with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}
