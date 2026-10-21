import servicoRepository from "../repositories/servicoRepository.js";

const listar = async () => {
    const servicos = await servicoRepository.listarServicosAtivos();

    return servicos;
};

export default {
    listar
};