const { formatBRL } = require('../utils/money');
const { formatarDataBR } = require('../utils/datas');
const { erros } = require('../utils/errors');

const TIPOS = ['contato', 'proposta', 'reagendamento', 'confirmacao', 'cancelamento', 'recusa'];

const TIPO_POR_STATUS = {
  PENDENTE: 'contato',
  ACEITO_POR_JUNIOR: 'proposta',
  REAGENDADO: 'reagendamento',
  CONFIRMADO: 'confirmacao',
  CANCELADO: 'cancelamento',
  RECUSADO: 'recusa',
};

const TURNO = { MANHA: 'manhã', TARDE: 'tarde' };

const brl = (v) => formatBRL(v).replace(/ /g, ' ');

function tipoPadrao(status) {
  return TIPO_POR_STATUS[status] || 'contato';
}

function montarLink(whatsapp, mensagem) {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

function bloqueioValores(p) {
  if (p.valor_previsto === null) {
    throw erros.regra(
      'Defina o valor previsto do serviço antes de gerar esta mensagem.',
      'VALOR_OBRIGATORIO',
    );
  }
  const taxa = p.taxa_deslocamento_final ?? p.taxa_deslocamento_estimada;
  const total = p.valor_previsto + taxa;
  return [
    `• Serviço: ${brl(p.valor_previsto)}`,
    `• Taxa de deslocamento (${p.cidade.nome}): ${brl(taxa)}`,
    `• Total previsto: ${brl(total)}`,
  ].join('\n');
}

/** Gera a mensagem pré-formatada (RF11) para o pedido já serializado. */
function gerarMensagem(p, tipo) {
  const nome = p.cliente.nome.split(' ')[0];
  const ref = `pedido #${p.id} (${p.servico.nome})`;
  const assinatura = 'JR Refrigerações';

  switch (tipo) {
    case 'contato':
      return `Olá, ${nome}! Aqui é o Júnior da ${assinatura}. Recebi sua solicitação de ${ref} e já estou analisando. Em breve retorno com a proposta.`;

    case 'proposta': {
      const valores = bloqueioValores(p);
      const data = formatarDataBR(p.data_preferida);
      return [
        `Olá, ${nome}! Aqui é o Júnior da ${assinatura}.`,
        `Analisei seu ${ref} e segue a proposta:`,
        valores,
        `• Data/turno solicitado: ${data} (${TURNO[p.turno_preferido]})`,
        '',
        'Você aceita os valores e as condições? Responda *SIM* para confirmar ou *NÃO* para cancelar.',
      ].join('\n');
    }

    case 'reagendamento': {
      if (!p.nova_data || !p.novo_turno) {
        throw erros.regra('Informe a nova data e turno antes de gerar esta mensagem.', 'REAGENDAMENTO_INCOMPLETO');
      }
      const linhas = [
        `Olá, ${nome}! Aqui é o Júnior da ${assinatura}.`,
        `Não consigo atender seu ${ref} em ${formatarDataBR(p.data_preferida)} (${TURNO[p.turno_preferido]}).`,
        `Posso ir em ${formatarDataBR(p.nova_data)} (${TURNO[p.novo_turno]}). Esse horário funciona para você?`,
      ];
      if (p.valor_previsto !== null) {
        linhas.push('', 'Valores previstos:', bloqueioValores(p));
      }
      linhas.push('', 'Responda *SIM* para confirmar ou *NÃO* para cancelar.');
      return linhas.join('\n');
    }

    case 'confirmacao': {
      const data = formatarDataBR(p.nova_data || p.data_preferida);
      const turno = TURNO[p.novo_turno || p.turno_preferido];
      return `Combinado, ${nome}! Seu ${ref} está *confirmado* para ${data} (${turno}), em ${p.endereco}. Até lá! — ${assinatura}`;
    }

    case 'cancelamento':
      return `Olá, ${nome}! Registrei o cancelamento do seu ${ref}. Se mudar de ideia, é só fazer uma nova solicitação. — ${assinatura}`;

    case 'recusa':
      return `Olá, ${nome}! Infelizmente não conseguirei realizar o atendimento do seu ${ref}${p.motivo ? ` (${p.motivo})` : ''}. Agradeço o contato e peço desculpas pelo transtorno. — ${assinatura}`;

    default:
      throw erros.regra(`Tipo de mensagem inválido. Use: ${TIPOS.join(', ')}.`, 'TIPO_INVALIDO');
  }
}

function gerarLink(pedido, tipo) {
  const t = tipo || tipoPadrao(pedido.status);
  const mensagem = gerarMensagem(pedido, t);
  return { tipo: t, mensagem, url: montarLink(pedido.cliente.whatsapp, mensagem) };
}

module.exports = { TIPOS, tipoPadrao, gerarMensagem, gerarLink, montarLink };
