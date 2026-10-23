import servicoRepository from "../repositories/servicoRepository.js";
import AppError from "../errors/AppError.js";

class ServicoService {
    async listar() {
        const servicos = await servicoRepository.listarAtivos();

        return servicos;
    }

    async listarTodos() {
        return servicoRepository.listarTodos();
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

        if (!servico.ativo) {
            throw new AppError("Esse serviço já está desativado.", 409);
        }

        await servicoRepository.DesativarServico(id);
    }

    async ReativarServico(id) {
        const servico = await servicoRepository.buscarPorId(id);

        if (!servico) {
            throw new AppError("Serviço não encontrado.", 404);
        }

        if (servico.ativo) {
            throw new AppError("Esse serviço já está ativo.", 409);
        }

        return servicoRepository.ReativarServico(id);
    }

    async EditarServico(id, dados) {
        const servico = await servicoRepository.buscarPorId(id);

        if (!servico) {
            throw new AppError("Serviço não encontrado.", 404);
        }

        if (dados.slug !== undefined && dados.slug !== servico.slug) {
            const jaExiste = await servicoRepository.buscarPorSlug(dados.slug);
            if (jaExiste && jaExiste.id !== id) {
                throw new AppError("Já existe um serviço com esse slug.", 409);
            }
        }

        return servicoRepository.EditarServico(id, dados);
    }
}

export default new ServicoService();
