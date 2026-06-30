import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const administracao = await prisma.administracao.upsert({
    where: { cnpj: "72.836.414/0001-66" },
    update: {
      nome: "Valparaíso/SP",
      cidade: "Valparaíso",
      uf: "SP",
      responsavelPatrimonio: "Mateus Corazza Neto",
      regional: "Araçatuba/SP",
      ativa: true,
    },
    create: {
      nome: "Valparaíso/SP",
      cidade: "Valparaíso",
      uf: "SP",
      cnpj: "72.836.414/0001-66",
      responsavelPatrimonio: "Mateus Corazza Neto",
      regional: "Araçatuba/SP",
    },
  });

  const casas = [
    {
      codigoSiga: "22-1689",
      nome: "Central - Bento de Abreu",
      cidade: "Bento de Abreu",
      anciaoCooperador: "Osmar José Soares",
      responsavelPatrimonio: "João Batista Pereira",
    },
    {
      codigoSiga: "22-5262",
      nome: "Central Valparaíso",
      cidade: "Valparaíso",
      anciaoCooperador: "Adão Aparecido da Conceição",
      responsavelPatrimonio: "Josemar de Paula",
    },
    {
      codigoSiga: "22-0806",
      nome: "Central - Lavínia",
      cidade: "Lavínia",
      anciaoCooperador: "Paulo Juvêncio",
      responsavelPatrimonio: "Roosevelt Juvêncio",
    },
    {
      codigoSiga: "22-3532",
      nome: "Bairro Santa Casa",
      cidade: "Valparaíso",
      anciaoCooperador: "William Gustavo Alves Santana",
      responsavelPatrimonio: "Deisilene Daniela de Paula",
    },
  ];

  for (const casa of casas) {
    await prisma.casaOracao.upsert({
      where: { codigoSiga: casa.codigoSiga },
      update: { ...casa, administracaoId: administracao.id, ativa: true },
      create: { ...casa, administracaoId: administracao.id },
    });
  }

  await prisma.usuario.upsert({
    where: { email: "gestor@ccb.local" },
    update: {
      nome: "Gestor Patrimônio ADM",
      papel: "gestor_adm",
      administracaoId: administracao.id,
      casaOracaoId: null,
      ativo: true,
    },
    create: {
      nome: "Gestor Patrimônio ADM",
      email: "gestor@ccb.local",
      papel: "gestor_adm",
      administracaoId: administracao.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      administracaoId: administracao.id,
      action: "seed.executed",
      entity: "Sprint0",
      metadata: {
        administracao: administracao.nome,
        casas: casas.map((casa) => casa.codigoSiga),
        activeRoles: ["gestor_adm"],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
