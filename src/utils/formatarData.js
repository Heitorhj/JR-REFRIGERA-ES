
const formatarData = (dataPreferida) => {
    // Remove espaços do começo e do final da data.
    const dataNormalizada = dataPreferida.trim();

    // Divide a string em três partes.
    // "2026-10-28" -> ["2026", "10", "28"]
    const partes = dataNormalizada.split("-");

    // Verifica o formato YYYY-MM-DD.
    // Ano com 4 dígitos, mês com 2 e dia com 2.
    // O every verifica se todas as partes são diferentes
    // de vazio e podem ser convertidas em números inteiros.
    if (
        partes.length !== 3 ||
        partes[0].length !== 4 ||
        partes[1].length !== 2 ||
        partes[2].length !== 2 ||
        !partes.every(parte =>
            parte !== "" &&
            Number.isInteger(Number(parte))
        )
    ) {
        return null;
    }

    // Converte as partes de strings para números.
    // ["2026", "10", "28"] -> [2026, 10, 28]
    const [ano, mes, dia] = partes.map(Number);

    // Cria uma data em UTC com os valores recebidos.
    // Subtraímos 1 do mês porque o Date usa meses de 0 a 11.
    // Janeiro = 0; Outubro = 9; Dezembro = 11.
    const data = new Date(Date.UTC(ano, mes - 1, dia));

    // Confere se o JavaScript não ajustou automaticamente
    // alguma data impossível, como 30 de fevereiro.
    if (
        data.getUTCFullYear() !== ano ||
        data.getUTCMonth() !== mes - 1 ||
        data.getUTCDate() !== dia
    ) {
        return null;
    }

    // Obtém a data atual considerando o horário de Recife.
    // formatToParts separa o resultado em componentes
    // identificados como year, month e day.
    const partesHoje = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Recife",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    // Localiza cada componente da data atual.
    const anoHoje = partesHoje.find(parte => parte.type === "year").value;
    const mesHoje = partesHoje.find(parte => parte.type === "month").value;
    const diaHoje = partesHoje.find(parte => parte.type === "day").value;

    // Monta a data atual no mesmo formato YYYY-MM-DD.
    // Exemplo: "2026-10-22"
    const hoje = `${anoHoje}-${mesHoje}-${diaHoje}`;

    // Impede datas anteriores ao dia atual em Recife.
    // Como ambas seguem YYYY-MM-DD, podemos comparar as strings.
    if (dataNormalizada < hoje) {
        return null;
    }

    // Retorna a data validada e normalizada.
    // Mantemos o dia escolhido pelo cliente, não a data atual.
    return dataNormalizada;
};

export default formatarData;
