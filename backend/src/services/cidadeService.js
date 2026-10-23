import cidadeRepository from "../repositories/cidadeRepository.js";
import taxaDeslocamentoRepository from "../repositories/taxaDeslocamentoRepository.js";
import AppError from "../errors/AppError.js";

class cidadeService {
    async listarCidades() {
        const cidades = cidadeRepository.listarCidadesAtivas();

        return cidades;
    }

    async listarTodasCidades() {
        return cidadeRepository.listarTodas();
    }

    async cadastrarCidade(nome, nivel, regiao) {
        // Verifica se a cidade já está cadastrada
        const cidadeExistente = await cidadeRepository.buscarPorNome(nome);

        if (cidadeExistente) {
            throw new AppError(
                "Já existe uma cidade cadastrada com esse nome.",
                409
            );
        }

        // Verifica se existe uma taxa configurada para o nível
        const taxa = await taxaDeslocamentoRepository.buscarPorNivel(nivel);

        if (!taxa) {
            throw new AppError(
                "Não existe uma taxa de deslocamento configurada para esse nível.",
                400
            );
        }

        // Cadastra a cidade associada ao nível informado
        const novaCidade = await cidadeRepository.cadastrarCidade(
            nome,
            nivel,
            regiao
        );

        return novaCidade;
    }

    async desativarCidade(id) {
        const cidade = await cidadeRepository.buscarPorId(id);

        if (!cidade) {
            throw new AppError("Cidade não encontrada.", 404);
        }

        if (!cidade.ativa) {
            throw new AppError("A cidade já está desativada.", 409);
        }

        return cidadeRepository.desativarCidade(id);
    }

    async reativarCidade(id) {
        const cidade = await cidadeRepository.buscarPorId(id);

        if (!cidade) {
            throw new AppError("Cidade não encontrada.", 404);
        }

        if (cidade.ativa === true) {
            throw new AppError("Cidade já está ativa.", 409);
        }

        return cidadeRepository.reativarCidade(id);
    }

    // Editar os dados de uma cidade
async editarCidade(id, dados) {
    const { nome, nivel, regiao } = dados;

    // Verifica se a cidade existe.
    const cidadeExistente = await cidadeRepository.buscarPorId(id);

    if (!cidadeExistente) {
        throw new AppError("Cidade não encontrada.", 404);
    }

    // Se o nome foi enviado, verifica se já pertence a outra cidade.
    if (nome !== undefined && nome !== cidadeExistente.nome) {
        const cidadeMesmoNome = await cidadeRepository.buscarPorNome(nome);

        if (cidadeMesmoNome && cidadeMesmoNome.id !== id) {
            throw new AppError(
                "Já existe uma cidade cadastrada com esse nome.",
                409
            );
        }
    }

    // Se o nível foi enviado, verifica se existe uma taxa configurada.
    if (nivel !== undefined && nivel !== cidadeExistente.nivel) {
        const taxa = await taxaDeslocamentoRepository.buscarPorNivel(nivel);

        if (!taxa) {
            throw new AppError(
                "Não existe uma taxa de deslocamento configurada para esse nível.",
                400
            );
        }
    }

    // Os dados já foram validados, filtrados e normalizados pelo Validator.
    return await cidadeRepository.editarCidade(id, dados);
}
}

export default new cidadeService();
