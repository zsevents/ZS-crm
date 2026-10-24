// One-command health check for the whole ZS Events setup: npm run health
import tls from 'node:tls';

const SITES = [
  { name: 'CRM', url: 'https://crm.zsevents.in/', host: 'crm.zsevents.in' },
  { name: 'Website', url: 'https://zsevents.in/', host: 'zsevents.in' },
];

const results = [];
const check = (name, ok, detail) => results.push({ name, ok, detail });

async function timed(url, init) {
  const t = performance.now();
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
  return { res, ms: Math.round(performance.now() - t) };
}

function certDaysLeft(host) {
  return new Promise((resolve) => {
    const socket = tls.connect(443, host, { servername: host }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve(Math.floor((new Date(cert.valid_to) - Date.now()) / 86400000));
    });
    socket.on('error', () => resolve(null));
    socket.setTimeout(10000, () => { socket.destroy(); resolve(null); });
  });
}

for (const site of SITES) {
  try {
    const { res, ms } = await timed(site.url);
    check(`${site.name} responds`, res.ok, `${res.status} in ${ms} ms`);
  } catch (e) {
    check(`${site.name} responds`, false, e.message);
  }
  const days = await certDaysLeft(site.host);
  check(`${site.name} certificate`, days !== null && days > 14, days === null ? 'could not read' : `${days} days left`);
}

try {
  const { res, ms } = await timed('https://crm.zsevents.in/api/health');
  const body = await res.clone().json().catch(() => ({}));
  check('CRM API health', res.ok, `${res.status} in ${ms} ms`);
  check('CRM database reachable', body.database === 'ok', body.database || 'no answer');
  const leads = await timed('https://crm.zsevents.in/api/leads');
  check('CRM sign-in wall (expect 401)', leads.res.status === 401, String(leads.res.status));
  const headers = res.headers;
  check('CRM security headers', !!headers.get('content-security-policy') && !!headers.get('x-frame-options'), 'CSP + X-Frame-Options');
} catch (e) {
  check('CRM API', false, e.message);
}

try {
  const { res } = await timed('https://crm.zsevents.in/api/website-inquiry');
  check('Enquiry endpoint online', res.ok, String(res.status));
} catch (e) {
  check('Enquiry endpoint online', false, e.message);
}

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'OK  ' : 'FAIL'}  ${r.name}: ${r.detail}`);
}
console.log(failed ? `\n${failed} problem(s) found.` : '\nAll good.');
process.exit(failed ? 1 : 0);
