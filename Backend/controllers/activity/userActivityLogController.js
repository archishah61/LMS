const { callProcedure } = require('../../utils/procedure/callProcedure');
const sequelize = require('../../config/db');
const { callProcedureChallenge } = require('../../utils/procedure/callProcedureChallenge');

// Helper: validate & normalize date string to UTC MySQL compatible format
function normalizeDateToUTC(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'INVALID';
  // Format YYYY-MM-DD HH:MM:SS in UTC
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

// New: paginated distinct dates
exports.getActivityLogDates = async (req, res, next) => {
  try {
    const { user_id, start, end, limit = 30, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 30, 200);
    const off = parseInt(offset, 10) || 0;
    const normStart = normalizeDateToUTC(start);
    const normEnd = normalizeDateToUTC(end);
    if (normStart === 'INVALID' || normEnd === 'INVALID') return res.status(400).json({ message: 'Invalid date filter' });
    const params = [user_id ? Number(user_id) : null, normStart, normEnd, lim, off];
    const { success, data, error } = await callProcedure('getUserActivityLogDates', params);
    if (!success) return next(error);
    const rows = Array.isArray(data[0]) ? data[0] : data;
    res.status(200).json({ data: rows, pagination: { limit: lim, offset: off, count: rows.length } });
  } catch (e) { next(e); }
};

// New: logs for a specific date (descending) with course title and without IP
exports.getActivityLogsByDate = async (req, res, next) => {
  try {
    const { date } = req.params; // YYYY-MM-DD
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid or missing date (YYYY-MM-DD)' });
    }
    const { user_id, event_category, event_action, outcome, entity_type, limit = 200, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 200, 500);
    const off = parseInt(offset, 10) || 0;
    const params = [
      user_id ? Number(user_id) : null,
      date,
      event_category || null,
      event_action || null,
      outcome || null,
      entity_type || null,
      lim,
      off
    ];
    const { success, data, error } = await callProcedure('getUserActivityLogsByDate', params);
    if (!success) return next(error);
    const rows = Array.isArray(data[0]) ? data[0] : data;
    res.status(200).json({ data: rows, pagination: { limit: lim, offset: off, count: rows.length }, date });
  } catch (e) { next(e); }
};

// DISTINCT meta lists via stored procedure (3 result sets: categories, actions, metadata rows)
exports.getActivityLogMeta = async (req, res, next) => {
  try {
    const { user_id } = req.query;
    const uid = user_id ? Number(user_id) : null;
    const { success, data, error } = await callProcedureChallenge('getUserActivityLogMeta', [uid]);
    if (!success) return next(error);
    // The callProcedureChallenge returns an array where each result set may be either:
    // - a plain array of row objects OR
    // - an object with numeric indices as keys ({ '0': {...}, '1': {...}, ... })
    const toArray = (rs) => {
      if (!rs) return [];
      if (Array.isArray(rs)) return rs; // already array
      // If it's a plain object with numeric keys, convert
      const keys = Object.keys(rs);
      if (keys.every(k => /^\d+$/.test(k))) {
        return keys
          .sort((a,b)=>Number(a)-Number(b))
          .map(k => rs[k]);
      }
      return []; // unsupported shape
    };
    const categoriesRS = toArray(data[0]);
    const actionsRS = toArray(data[1]);
    const metaRowsRS = toArray(data[2]);
    const keySet = new Set();
    metaRowsRS.forEach(r => {
      if (!r) return;
      const val = r.metadata;
      if (val && typeof val === 'object') {
        Object.keys(val).forEach(k => { if (k !== 'title') keySet.add(k); });
      } else if (typeof val === 'string') {
        try { const obj = JSON.parse(val); Object.keys(obj).forEach(k => { if (k !== 'title') keySet.add(k); }); } catch(_){}
      }
    });
    return res.json({
      categories: categoriesRS.filter(r => r.v).map(r => r.v),
      actions: actionsRS.filter(r => r.v).map(r => r.v),
      metadata_keys: Array.from(keySet).slice(0,200)
    });
  } catch (e) { next(e); }
};

// Export logs as CSV with various scopes now using stored procedure exportUserActivityLogs
exports.exportActivityLogs = async (req, res, next) => {
  try {
    const {
      scope = 'all',
      user_id,
      date,
      month,
      year,
      start_date,
      end_date,
      event_category,
      event_action,
      outcome,
      entity_type,
      limit
    } = req.query;

    const pad = (n) => n.toString().padStart(2,'0');
    const validDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);

    let p_from = null, p_to = null, p_exact_date = null;
    if (scope === 'date') {
      if (!date || !validDate(date)) return res.status(400).json({ message: 'Invalid or missing date (YYYY-MM-DD)' });
      p_exact_date = date;
    } else if (scope === 'month') {
      if (!month || !/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ message: 'Invalid month (YYYY-MM)' });
      const [y,m] = month.split('-').map(Number);
      p_from = `${y}-${pad(m)}-01 00:00:00`;
      const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
      p_to = `${nextMonth.y}-${pad(nextMonth.m)}-01 00:00:00`;
    } else if (scope === 'year') {
      if (!year || !/^\d{4}$/.test(year)) return res.status(400).json({ message: 'Invalid year (YYYY)' });
      p_from = `${year}-01-01 00:00:00`;
      p_to = `${Number(year)+1}-01-01 00:00:00`;
    } else { // all / range
      if (start_date && validDate(start_date)) {
        p_from = `${start_date} 00:00:00`;
        if (end_date && validDate(end_date)) {
          const d = new Date(end_date + 'T00:00:00Z');
          const to = new Date(d.getTime() + 24*3600*1000);
          p_to = `${to.getUTCFullYear()}-${pad(to.getUTCMonth()+1)}-${pad(to.getUTCDate())} 00:00:00`;
        } else {
          const d = new Date(start_date + 'T00:00:00Z');
          const to = new Date(d.getTime() + 24*3600*1000);
          p_to = `${to.getUTCFullYear()}-${pad(to.getUTCMonth()+1)}-${pad(to.getUTCDate())} 00:00:00`;
        }
      }
    }

    const params = [
      user_id ? Number(user_id) : null,
      p_from,
      p_to,
      p_exact_date,
      event_category || null,
      event_action || null,
      outcome || null,
      entity_type || null,
      limit ? Number(limit) : null
    ];

    const { success, data, error } = await callProcedure('exportUserActivityLogs', params);
    if (!success) return next(error);
    const rs = Array.isArray(data[0]) ? data[0] : data;
    const rows = Array.isArray(rs) ? rs : [];

    const escape = (val) => {
      if (val === null || val === undefined) return '';
      let s = typeof val === 'object' ? JSON.stringify(val) : String(val);
      s = s.replace(/"/g,'""');
      if (/[,"\n]/.test(s)) s = `"${s}"`;
      return s;
    };
    const header = ['id','user_id','event_category','event_action','outcome','entity_type','entity_id','occurred_at','metadata'];
    const lines = [header.join(',')];
    rows.forEach(r => {
      lines.push([
        r.id, r.user_id, r.event_category, r.event_action, r.outcome, r.entity_type, r.entity_id, r.occurred_at, r.metadata
      ].map(escape).join(','));
    });
    const csv = lines.join('\n');
    const stamp = new Date().toISOString().replace(/[:T]/g,'-').slice(0,19);
    let scopePart = scope;
    if (scope === 'date') scopePart += `-${date}`;
    else if (scope === 'month') scopePart += `-${month}`;
    else if (scope === 'year') scopePart += `-${year}`;
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="activity-${scopePart}-${stamp}.csv"`);
    res.status(200).send(csv);
  } catch (e) { next(e); }
};
