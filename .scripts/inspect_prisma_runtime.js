const { PrismaClient } = require('../mrazota-site/node_modules/@prisma/client')
;(async ()=>{
  const p = new PrismaClient()
  console.log('Prisma client keys:', Object.keys(p))
  // print first-level models
  const modelKeys = Object.keys(p).filter(k=>!k.startsWith('$'))
  console.log('models:', modelKeys)
  await p.$disconnect()
})().catch(e=>{ console.error(e); process.exit(1) })
