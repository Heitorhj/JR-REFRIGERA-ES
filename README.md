# JR Refrigerações — API

Back-end do sistema web de agendamento, validação de orçamentos e gestão de atendimentos da **JR Refrigerações** (projeto acadêmico — Uninassau, Ciência da Computação, disciplina *Maturidade em Desenvolvimento de Software*).

**Stack:** Node.js + Express · SQLite · JWT + bcrypt · express-rate-limit · node-cron

## Como rodar

```bash
npm install
cp .env.example .env     # ajuste JWT_SECRET e a senha do admin
npm run seed             # cria tabelas, cidades, serviços e o usuário admin
npm run dev              # http://localhost:3333
npm test
```

> A documentação completa dos endpoints será adicionada ao longo do desenvolvimento.
