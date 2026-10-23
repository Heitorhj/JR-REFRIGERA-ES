
import pedidoRepository from "../repositories/pedidoRepository.js";
import AppError from "../errors/AppError.js";

class PedidoService {
    async listarPedidos(filtros) {
        const resultado = await pedidoRepository.listarPedidos(filtros);

        return {
            pedidos: resultado.pedidos,
            paginacao: {
                paginaAtual: filtros.page,
                limite: filtros.limit,
                total: resultado.total,
                totalPaginas: Math.ceil(resultado.total / filtros.limit)
            }
        };
    }

    async cadastrarPedido(dados) {
        const {
            nome,
            whatsapp,
            cidadeId,
            servicoId,
            endereco,
            descricaoProblema,
            dataPreferida,
            turnoPreferido
        } = dados;

        // 1. Verifica se a cidade existe e está ativa.
        // Também consulta o valor vigente da taxa de deslocamento.
        const cidade = await pedidoRepository.buscarCidadePorId(cidadeId);

        if (!cidade || !cidade.ativa) {
            throw new AppError("Cidade não encontrada ou inativa.", 400);
        }

        // 2. Verifica se o serviço existe e está ativo.
        const servico = await pedidoRepository.buscarServicoPorId(servicoId);

        if (!servico || !servico.ativo) {
            throw new AppError("Serviço não encontrado ou inativo.", 400);
        }

        // 3. Obtém o valor da taxa associada ao nível da cidade.
        // Esse valor será registrado no pedido e não será alterado
        // quando a taxa vigente for atualizada futuramente.
        const taxaDeslocamentoEstimada = cidade.taxaDeslocamento.valor;

        // 4. Prepara os dados para criar o pedido.
        // O cliente será localizado ou criado pelo Repository,
        // utilizando o WhatsApp normalizado como identificador.
        const dadosPedido = {
            nome,
            whatsapp,
            cidadeId,
            servicoId,
            endereco,
            descricaoProblema,
            dataPreferida,
            turnoPreferido,
            taxaDeslocamentoEstimada,
            status: "PENDENTE"
        };

        // 5. Cria o pedido e registra seu primeiro histórico.
        // O Repository fará essas operações dentro de uma transação,
        // evitando registros incompletos se ocorrer alguma falha.
        const pedido = await pedidoRepository.criarPedido(dadosPedido);

        return pedido;
    }
}

export default new PedidoService();
