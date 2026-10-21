import "dotenv/config";
import app from "./app.js";
import prisma from "./db/prisma.js";

const PORT = Number(process.env.PORT) || 3333;

async function iniciarServidor() {
  try {
    await prisma.$connect();

    console.log("Banco de dados conectado com sucesso!");

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
}

iniciarServidor();