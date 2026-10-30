/**
 * Generate a unique ID.
 * Works in both Node.js (main process) and browser (renderer).
 */
export function generateId(): string {
  // Use Web Crypto API (available in both modern browsers and Node.js 19+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for older environments
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  // Format as UUID-like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return (
    id.slice(0, 8) + '-' +
    id.slice(8, 12) + '-' +
    id.slice(12, 16) + '-' +
    id.slice(16, 20) + '-' +
    id.slice(20, 32)
  )
}
