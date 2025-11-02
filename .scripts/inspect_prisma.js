const { PrismaClient } = require('../mrazota-site/node_modules/@prisma/client');
(async ()=>{
  const p = new PrismaClient();
  console.log(Object.keys(p).sort());
  await p.$disconnect();
})();
