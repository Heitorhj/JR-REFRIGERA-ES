/*
  Warnings:

  - You are about to drop the column `taxaDeslocamento` on the `Cidade` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "TaxaDeslocamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nivel" INTEGER NOT NULL,
    "valor" INTEGER NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cidade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "regiao" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Cidade_nivel_fkey" FOREIGN KEY ("nivel") REFERENCES "TaxaDeslocamento" ("nivel") ON DELETE RESTRICT ON UPDATE RESTRICT
);
INSERT INTO "new_Cidade" ("ativa", "id", "nivel", "nome", "regiao") SELECT "ativa", "id", "nivel", "nome", "regiao" FROM "Cidade";
DROP TABLE "Cidade";
ALTER TABLE "new_Cidade" RENAME TO "Cidade";
CREATE UNIQUE INDEX "Cidade_nome_key" ON "Cidade"("nome");
CREATE INDEX "Cidade_nivel_idx" ON "Cidade"("nivel");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TaxaDeslocamento_nivel_key" ON "TaxaDeslocamento"("nivel");
