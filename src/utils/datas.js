const FUSO = 'America/Recife';

/** Data de hoje (AAAA-MM-DD) no fuso de Recife. */
function hojeRecife(agora = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}

/** Valida formato AAAA-MM-DD e se a data realmente existe (ex.: recusa 2026-02-30). */
function dataValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

/** Formata AAAA-MM-DD como DD/MM/AAAA. */
function formatarDataBR(texto) {
  const [a, m, d] = texto.split('-');
  return `${d}/${m}/${a}`;
}

module.exports = { hojeRecife, dataValida, formatarDataBR, FUSO };
