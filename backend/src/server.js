import "dotenv/config";
import app from "./app.js";
import prisma from "./db/prisma.js";
import { agendarExpurgo } from "./jobs/expurgo.js";

const PORT = Number(process.env.PORT) || 3333;
const retencaoDias = Number(process.env.RETENCAO_DIAS || 7);

if (!Number.isSafeInteger(retencaoDias) || retencaoDias <= 0) {
  throw new Error("RETENCAO_DIAS deve ser um número inteiro positivo.");
}

async function iniciarServidor() {
  try {
    await prisma.$connect();

    console.log("Banco de dados conectado com sucesso!");

    agendarExpurgo(prisma, { retencaoDias });

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
}

iniciarServidor();