
import servicoRepository from "../repositories/servicoRepository.js";
import AppError from "../errors/AppError.js";

const listar = async () => {
    const servicos = await servicoRepository.listarAtivos();

    return servicos;
};

const CriarServico = async (nome, slug, descricao) => {
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
};

export default {
    listar,
    CriarServico
};
