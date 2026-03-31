import { supabase, requireAuth, formatSoles, formatFecha } from '../supabase.js';

init();

async function init() {
  const user = await requireAuth();

  setUserUI(user);
  setupLogout();
  await cargarCuentas(user);
  await cargarTransacciones(user);
}

// ── UI usuario ─────────────────────────────────────────
function setUserUI(user) {
  const nombreDisplay =
    user.user_metadata?.full_name?.split(' ')[0] || user.email;

  document.getElementById('userName').textContent = nombreDisplay;
  document.getElementById('welcomeName').textContent = nombreDisplay;

  document.getElementById('fechaHoy').textContent =
    new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
}

// ── Logout ─────────────────────────────────────────────
function setupLogout() {
  document.getElementById('btnLogout')
    .addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.replace('/index.html');
    });
}

// ── Cuentas ────────────────────────────────────────────
async function cargarCuentas(user) {
  const { data: cuentas } = await supabase
    .from('cuentas')
    .select('*')
    .eq('user_id', user.id)
    .order('tipo');

  const container = document.getElementById('cuentasContainer');

  if (!cuentas || cuentas.length === 0) {
    container.innerHTML = `
      <div class="col-12 fade-in-up delay-1">
        <div class="alert alert-info border-0 shadow-sm"><i class="bi bi-info-circle me-2"></i>No se encontraron cuentas asociadas.</div>
      </div>`;
    return;
  }

  container.innerHTML = cuentas.map((c, idx) => `
    <div class="col-12 col-md-6 col-xl-4 fade-in-up" style="animation-delay: ${0.1 * (idx + 1)}s">
      <div class="card p-4 card-saldo-fx ${c.tipo} h-100">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <span class="badge ${c.tipo === 'corriente' ? 'bg-primary' : 'bg-success'} mb-2 px-2 py-1 shadow-sm">
              <i class="bi ${c.tipo === 'corriente' ? 'bi-briefcase' : 'bi-piggy-bank'} me-1"></i>
              ${c.tipo === 'corriente' ? 'Cuenta Corriente' : 'Cuenta de Ahorro'}
            </span>
            <div class="cuenta-numero font-monospace text-muted mt-1">${maskCuenta(c.numero_cuenta)}</div>
          </div>
          <div class="rounded-circle d-flex align-items-center justify-content-center bg-white shadow-sm" style="width:45px;height:45px">
             <i class="bi ${c.tipo === 'corriente' ? 'bi-credit-card' : 'bi-safe'} fs-4 ${c.tipo === 'corriente' ? 'text-primary' : 'text-success'}"></i>
          </div>
        </div>
        <div class="monto mt-auto pt-2 fs-2 fw-bold text-dark">${formatSoles(c.saldo)}</div>
        <div class="text-secondary mt-1 d-flex justify-content-between align-items-end">
            <span style="font-size:0.85rem">${c.moneda} · Saldo disponible</span>
            <i class="bi bi-arrow-right-circle-fill text-primary opacity-50 fs-5"></i>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Transacciones ──────────────────────────────────────
async function cargarTransacciones(user) {
  const { data: txns } = await supabase
    .from('transacciones')
    .select('*')
    .eq('user_id', user.id)
    .order('fecha', { ascending: false })
    .limit(5);

  const txnEl = document.getElementById('txnRecientes');

  if (!txns || txns.length === 0) {
    txnEl.innerHTML = `
      <div class="text-center py-5 fade-in-up delay-2">
        <i class="bi bi-inbox text-muted fs-1 d-block mb-3"></i>
        <p class="text-muted fw-medium">Sin movimientos recientes.</p>
      </div>`;
    return;
  }

  txnEl.innerHTML = `
    <div class="table-responsive fade-in-up delay-2">
      <table class="table table-borderless table-hover mb-0 align-middle">
        <tbody>
          ${txns.map(t => `
            <tr class="txn-row">
              <td class="ps-3 py-3">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-circle d-flex align-items-center justify-content-center shadow-sm
                    ${t.tipo === 'debito' ? 'bg-danger' : 'bg-success'} bg-opacity-10" style="width:42px;height:42px">
                    <i class="bi ${
                      t.tipo === 'debito'
                        ? 'bi-arrow-down-right text-danger'
                        : 'bi-arrow-up-right text-success'
                    } fs-5"></i>
                  </div>
                  <div>
                    <div class="fw-bold text-dark mb-1">${t.descripcion}</div>
                    <div class="text-secondary d-flex align-items-center gap-1" style="font-size:0.8rem">
                      <i class="bi bi-calendar-event"></i> ${formatFecha(t.fecha)}
                    </div>
                  </div>
                </div>
              </td>
              <td class="text-end pe-4">
                <span class="${t.tipo === 'debito' ? 'text-danger' : 'text-success'} fs-6 fw-bold">
                  ${t.tipo === 'debito' ? '-' : '+'} ${formatSoles(t.monto)}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Util ───────────────────────────────────────────────
function maskCuenta(num) {
  if (!num) return '****';

  const parts = num.split('-');

  return parts.length > 1
    ? `••• - •••••• - ${parts[parts.length - 1].slice(-4)}`
    : `•••• •••• ${num.slice(-4)}`;
}
