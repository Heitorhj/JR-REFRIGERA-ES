
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/db/prisma.js";

const BCRYPT_ROUNDS = 12;

const cidades = [
  { nome: "Recife", nivel: 0, regiao: "Base principal", taxa: 0 },
  { nome: "Olinda", nivel: 1, regiao: "Região Metropolitana - Nível 1", taxa: 30 },
  { nome: "Jaboatão dos Guararapes", nivel: 1, regiao: "Região Metropolitana - Nível 1", taxa: 30 },
  { nome: "Camaragibe", nivel: 2, regiao: "Região Metropolitana - Nível 2", taxa: 50 },
  { nome: "São Lourenço da Mata", nivel: 2, regiao: "Região Metropolitana - Nível 2", taxa: 50 },
  { nome: "Carpina", nivel: 3, regiao: "Zona da Mata / Entorno - Nível 3", taxa: 90 },
];

const servicos = [
  {
    slug: "instalacao-split",
    nome: "Instalação de Ar-Condicionado Split",
    descricao: "Montagem, tubulação, vácuo e carga.",
  },
  {
    slug: "higienizacao-preventiva",
    nome: "Higienização Profissional e Manutenção Preventiva",
    descricao: "Limpeza profunda e sanitização.",
  },
  {
    slug: "corretiva-carga-gas",
    nome: "Manutenção Corretiva e Carga de Gás",
    descricao: "Diagnóstico de vazamento e recarga de fluido.",
  },
  {
    slug: "refrigeracao-comercial",
    nome: "Refrigeração Comercial e Balcões",
    descricao: "Atendimento para geladeiras comerciais, expositores e câmaras frias.",
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.ADMIN_PASSWORD;

  if (!email || !senha || senha.length < 8) {
    throw new Error("Configure ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 8 caracteres) no .env.");
  }

  // Cadastra cidades sem duplicá-las
  for (const cidade of cidades) {
    await prisma.cidade.upsert({
      where: { 
        nome: cidade.nome 
      },
      update: {},
      create: {
        nome: cidade.nome,
        nivel: cidade.nivel,
        regiao: cidade.regiao,
        taxaDeslocamento: Math.round(cidade.taxa * 100),
      },
    });
  }

  // Cadastra serviços sem duplicá-los
  for (const servico of servicos) {
    await prisma.servico.upsert({
      where: { slug: servico.slug },
      update: {},
      create: servico,
    });
  }

  // Cria o administrador somente se não existir
  const adminExistente = await prisma.administrador.findUnique({
    where: { email },
  });

  if (!adminExistente) {
    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

    await prisma.administrador.create({
      data: {
        nome: "Júnior",
        email,
        senhaHash,
      },
    });

    console.log("Administrador criado com sucesso.");
  } else {
    console.log("Administrador já existe. Senha preservada.");
  }

  console.log("Cidades e serviços cadastrados.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
