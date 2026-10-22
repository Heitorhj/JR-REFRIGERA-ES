import cidadeRepository from "../repositories/cidadeRepository.js";

class cidadeService {
    async listarCidades() {
        const cidades = cidadeRepository.listarCidadesAtivas();

        return cidades;
    }
}

export default new cidadeService();
