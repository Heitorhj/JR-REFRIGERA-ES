
import taxaDeslocamentoRepository from "../repositories/taxaDeslocamentoRepository.js";
import AppError from "../errors/AppError.js";

class TaxaDeslocamentoService {

    async cadastrar( nivel, valor ) {
        const taxaExistente = await taxaDeslocamentoRepository.buscarPorNivel(nivel);

        if (taxaExistente) {
            throw new AppError(
                "Já existe uma taxa de deslocamento cadastrada para esse nível.",
                409
            );
        }

        const novaTaxa = await taxaDeslocamentoRepository.cadastrar(
            nivel,
            valor
        );

        return novaTaxa;
    }

}

export default new TaxaDeslocamentoService();
