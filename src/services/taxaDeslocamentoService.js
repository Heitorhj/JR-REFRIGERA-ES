
import taxaDeslocamentoRepository from "../repositories/taxaDeslocamentoRepository.js";
import AppError from "../errors/AppError.js";

class TaxaDeslocamentoService {

    async listarTaxas() {
        return await taxaDeslocamentoRepository.listarTaxas();
    }

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

    // Editar o valor de uma taxa de deslocamento
    async editarTaxa(nivel, valor) {

        // Verifica se existe uma taxa cadastrada para esse nível.
        const taxaExistente = await taxaDeslocamentoRepository.buscarPorNivel(nivel);

        if (!taxaExistente) {
            throw new AppError(
                "Taxa de deslocamento não encontrada.",
                404
            );
        }

        // Atualiza somente o valor da taxa.
        return await taxaDeslocamentoRepository.editarTaxa(nivel, valor);
    }

}

export default new TaxaDeslocamentoService();
