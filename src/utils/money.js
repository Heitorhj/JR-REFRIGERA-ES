// Valores monetários são armazenados em centavos (INTEGER) para evitar erros
// de ponto flutuante. A API recebe e devolve valores em reais (number).

function toCents(reais) {
  if (reais === null || reais === undefined) return null;
  return Math.round(Number(reais) * 100);
}

function fromCents(cents) {
  if (cents === null || cents === undefined) return null;
  return cents / 100;
}

function formatBRL(reais) {
  return Number(reais).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

module.exports = { toCents, fromCents, formatBRL };
