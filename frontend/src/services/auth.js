/**
 * Mock auth service — Promise-based so a real auth API can replace these
 * functions without touching any component.
 *
 * To swap for a real API:
 *   - Replace `login()` body with a fetch/axios call to your auth endpoint.
 *   - Replace `logout()` to call a server-side session invalidation endpoint.
 *   - Replace `getSession()` to validate the token with your backend.
 */

const SESSION_KEY = 'bess_session';

// Demo credentials — defined once here, referenced by Login page hint
export const DEMO_CREDENTIALS = [
  {
    email: 'admin@bessmonitor.demo',
    password: 'Demo@123',
    name: 'Demo Admin',
    role: 'Administrator',
  },
];

export async function login(email, password) {
  const user = DEMO_CREDENTIALS.find(
    (c) => c.email === email && c.password === password
  );
  if (!user) {
    throw new Error('Invalid email or password. Please try again.');
  }
  const session = { email: user.email, name: user.name, role: user.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export async function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
