import cidadeRepository from "../repositories/cidadeRepository.js";
import taxaDeslocamentoRepository from "../repositories/taxaDeslocamentoRepository.js";
import AppError from "../errors/AppError.js";

class cidadeService {
    async listarCidades() {
        const cidades = cidadeRepository.listarCidadesAtivas();

        return cidades;
    }

    async cadastrarCidades(nome, nivel, regiao) {
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
        const novaCidade = await cidadeRepository.cadastrar(
            nome,
            nivel,
            regiao
        );

        return novaCidade;
    }
}

export default new cidadeService();
