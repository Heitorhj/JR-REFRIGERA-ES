import servicoRepository from "../repositories/servicoRepository.js";
import AppError from "../errors/AppError.js";

class ServicoService {
    async listar() {
        const servicos = await servicoRepository.listarAtivos();

        return servicos;
    }

    async criar(nome, slug, descricao) {
        const servicoExistente = await servicoRepository.buscarPorSlug(slug);

        if (servicoExistente) {
            throw new AppError("Já existe um serviço com esse slug.", 409);
        }

        const novoServico = await servicoRepository.CriarServico(
            nome,
            slug,
            descricao
        );

        return novoServico;
    }

    async DesativarServico(id) {
        const servico = await servicoRepository.buscarPorId(id);

        if (!servico) {
            throw new AppError("Serviço não encontrado.", 404);
        }

        await servicoRepository.DesativarServico(id);
    }
}

export default new ServicoService();
