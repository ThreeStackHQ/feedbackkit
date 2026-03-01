/**
 * Global Vitest setup for FeedbackKit integration tests.
 *
 * Sets required env variables so routes don't blow up on import.
 * All DB + external service calls are mocked per-test-file.
 */

process.env.NEXTAUTH_SECRET = "test-secret-for-integration-tests";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.NODE_ENV = "test";
// Don't set RESEND_API_KEY — tests mock Resend or rely on the "no key" code path
// Don't set STRIPE_SECRET_KEY — tests mock Stripe
