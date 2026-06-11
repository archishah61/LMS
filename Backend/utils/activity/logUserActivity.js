const crypto = require('crypto');
const { callProcedure } = require('../procedure/callProcedure');

const HASH_IP = process.env.ACTIVITY_LOG_HASH_IP === 'true';

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function sanitizeMetadata(meta = {}) {
  if (typeof meta !== 'object' || meta === null) return {};
  const clone = { ...meta };
  ['password', 'newPassword', 'oldPassword', 'token', 'accessToken', 'refreshToken'].forEach(k => { if (k in clone) delete clone[k]; });
  return clone;
}

async function logUserActivity({
  userId = null,
  userIdentifier = null,
  eventCategory,
  eventAction,
  outcome = 'n/a',
  entityType = 'none',
  entityId = null,
  sessionToken = null,
  ip,
  userAgent,
  metadata = {},
  occurredAt = null
}) {
  try {

  // Ensure a human-readable title/reason is present for frontend timeline display.
  // If caller did not supply metadata.title, derive one from category + action.
  if (metadata && typeof metadata === 'object' && !metadata.title) {
    const base = `${eventCategory || ''} ${eventAction || ''}`.trim();
    // Transform snake_case or dotted segments into spaced Capitalized words.
    const pretty = base
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    metadata.title = pretty || 'Activity Event';
  }
  const safeMeta = sanitizeMetadata(metadata);
  const rawIp = HASH_IP ? hashIp(ip) : ip;
    const { success, data, error } = await callProcedure('logUserActivity', [
      userId,
      userIdentifier,
      eventCategory,
      eventAction,
      outcome,
      entityType,
      entityId,
      sessionToken,
      rawIp,
      userAgent || null,
      JSON.stringify(safeMeta),
      occurredAt
    ]);

    if (!success) {
      console.error('User activity log error:', error.message);
    }

  } catch (e) {
    console.error('User activity log error:', e.message);
  }
}

module.exports = { logUserActivity };
