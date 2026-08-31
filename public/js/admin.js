// admin.js — Merchant console: audit log table and policy limits.

import { getAuditLogs } from './api.js';
import { escHtml, formatDate } from './utils.js';

const FALLBACK_ROWS = [
  { time: '09:41:02', action: 'Search',        detail: 'iphone 15 case',      ok: true  },
  { time: '09:41:15', action: 'Gate check',     detail: '₹798 within ₹5,000', ok: true  },
  { time: '09:41:22', action: 'Razorpay order', detail: 'order_TVCAcVy',       ok: true  },
  { time: '09:41:24', action: 'Verified',       detail: 'signature match',     ok: true  },
  { time: '09:52:08', action: 'Gate check',     detail: '₹29,999 · declined',  ok: false },
];

export async function loadAdminData() {
  renderAuditTable(null);   // show loading state

  try {
    const logs = await getAuditLogs();
    renderAuditTable(logs);
  } catch (_) {
    renderAuditTable([]);   // fall back to sample data
  }
}

function renderAuditTable(logs) {
  const container = document.getElementById('auditTable');

  // Loading state
  if (logs === null) {
    container.innerHTML = '<div class="admin-loading">Loading audit logs…</div>';
    return;
  }

  // Use fallback sample rows when no real logs exist yet
  const rows = logs.length ? logs : null;

  if (rows) {
    const trRows = rows.map(l => {
      const time  = new Date(l.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      const isOk    = !/fail|invalid|error/i.test(l.action);
      const detail  = escHtml(String(l.reason || l.detail || '').slice(0, 40));

      return `<tr>
        <td class="mono">${time}</td>
        <td>${escHtml(l.action.replace(/_/g, ' '))}</td>
        <td class="mono">${detail}</td>
        <td><span class="pill ${isOk ? 'ok' : 'error'}" style="font-size:10px">${isOk ? 'OK' : 'Error'}</span></td>
      </tr>`;
    }).join('');

    container.innerHTML = `<table>
      <thead><tr><th>Time</th><th>Action</th><th>Detail</th><th>Result</th></tr></thead>
      <tbody>${trRows}</tbody>
    </table>`;
  } else {
    // Render static sample rows
    const trRows = FALLBACK_ROWS.map(r => `<tr>
      <td class="mono">${r.time}</td>
      <td>${r.action}</td>
      <td class="mono">${r.detail}</td>
      <td><span class="pill ${r.ok ? 'ok' : 'error'}" style="font-size:10px">${r.ok ? 'OK' : 'Error'}</span></td>
    </tr>`).join('');

    container.innerHTML = `<table>
      <thead><tr><th>Time</th><th>Action</th><th>Detail</th><th>Result</th></tr></thead>
      <tbody>${trRows}</tbody>
    </table>`;
  }
}
