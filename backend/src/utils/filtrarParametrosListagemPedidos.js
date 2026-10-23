import { StatusPedido } from "@prisma/client";

const converterInteiroPositivo = (valor, valorPadrao, valorMaximo) => {
    if (valor === undefined) {
        return valorPadrao;
    }

    if (typeof valor !== "string" || valor.length === 0) {
        return null;
    }

    for (const caractere of valor) {
        if (caractere < "0" || caractere > "9") {
            return null;
        }
    }

    const numero = Number(valor);

    if (
        !Number.isSafeInteger(numero) ||
        numero <= 0 ||
        (valorMaximo !== undefined && numero > valorMaximo)
    ) {
        return null;
    }

    return numero;
};

const filtrarParametrosListagemPedidos = (query) => {
    const parametros = query ?? {};
    const parametrosPermitidos = ["page", "limit", "status"];
    const parametrosInvalidos = Object.keys(parametros).filter(
        (parametro) => !parametrosPermitidos.includes(parametro)
    );

    if (parametrosInvalidos.length > 0) {
        return null;
    }

    const page = converterInteiroPositivo(parametros.page, 1);
    const limit = converterInteiroPositivo(parametros.limit, 10, 50);

    if (
        page === null ||
        limit === null ||
        !Number.isSafeInteger(page * limit)
    ) {
        return null;
    }

    if (
        parametros.status !== undefined &&
        (
            typeof parametros.status !== "string" ||
            !Object.values(StatusPedido).includes(parametros.status)
        )
    ) {
        return null;
    }

    const filtros = {
        page,
        limit
    };

    if (parametros.status !== undefined) {
        filtros.status = parametros.status;
    }

    return filtros;
};

export default filtrarParametrosListagemPedidos;
