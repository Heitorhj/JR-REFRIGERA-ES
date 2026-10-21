/**
 * Normaliza um telefone brasileiro para somente dígitos com DDI 55.
 * Aceita "(81) 99999-9999", "81999999999", "+55 81 99999-9999" etc.
 * Retorna null se não parecer um número brasileiro válido.
 */
function normalizarWhatsapp(entrada) {
  let digitos = String(entrada ?? '').replace(/\D/g, '');

  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
    digitos = digitos.slice(2);
  }
  // DDD (2 dígitos, 11-99) + 8 ou 9 dígitos
  if (!/^[1-9][1-9]\d{8,9}$/.test(digitos)) return null;

  return `55${digitos}`;
}

module.exports = { normalizarWhatsapp };
