// Máquina de estados do pedido (seção 3 do escopo)

const STATUS = [
  'PENDENTE',
  'ACEITO_POR_JUNIOR',
  'REAGENDADO',
  'CONFIRMADO',
  'CANCELADO',
  'RECUSADO',
];

// Estados que vão para a área de descarte (removidos após a retenção — RF12)
const TERMINAIS = ['CANCELADO', 'RECUSADO'];

const TRANSICOES = {
  PENDENTE: ['ACEITO_POR_JUNIOR', 'REAGENDADO', 'RECUSADO'],
  ACEITO_POR_JUNIOR: ['CONFIRMADO', 'REAGENDADO', 'CANCELADO', 'RECUSADO'],
  REAGENDADO: ['CONFIRMADO', 'REAGENDADO', 'CANCELADO', 'RECUSADO'],
  CONFIRMADO: ['REAGENDADO', 'CANCELADO', 'RECUSADO'],
  CANCELADO: [],
  RECUSADO: [],
};

function podeTransicionar(de, para) {
  return (TRANSICOES[de] || []).includes(para);
}

function ehTerminal(status) {
  return TERMINAIS.includes(status);
}

module.exports = { STATUS, TERMINAIS, TRANSICOES, podeTransicionar, ehTerminal };
