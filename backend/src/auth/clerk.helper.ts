import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY ?? '',
});

/**
 * Extracts the Clerk userId from a raw Authorization header value.
 * Returns null if the header is missing, malformed, or the token is invalid.
 * Never throws.
 */
export async function extractClerkId(authHeader?: string): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload = await clerk.verifyToken(authHeader.slice(7));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
