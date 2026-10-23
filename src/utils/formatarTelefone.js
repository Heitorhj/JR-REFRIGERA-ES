
const formatarTelefone = (whatsapp) => {
    // Remove caracteres que não são números.
    // Exemplo: "(81) 99999-9999" -> "81999999999"
    const numeroNormalizado = whatsapp.replace(/\D/g, "");

    // Verifica se o telefone possui apenas DDD + número.
    // 10 dígitos: telefone fixo.
    // 11 dígitos: telefone celular.
    const possuiDDD = [10, 11].includes(numeroNormalizado.length);

    // Verifica se o telefone já possui o DDI brasileiro (55).
    const possuiDDI =
        numeroNormalizado.startsWith("55") &&
        [12, 13].includes(numeroNormalizado.length);

    // Se o formato não for aceito, retorna null.
    // O Validator será responsável por retornar o erro HTTP.
    if (!possuiDDD && !possuiDDI) {
        return null;
    }

    // Padroniza o número com o DDI brasileiro.
    // Exemplo: "81999999999" -> "5581999999999"
    const whatsappFinal = possuiDDD
        ? `55${numeroNormalizado}`
        : numeroNormalizado;

    return whatsappFinal;
};

export default formatarTelefone;
