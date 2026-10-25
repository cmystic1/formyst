import crypto from 'node:crypto'
import { existsSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

if (existsSync('.env')) process.loadEnvFile()

const email = (process.env.INITIAL_ADMIN_EMAIL ?? process.env.BOOTSTRAP_EMAIL)?.trim().toLowerCase()
const password = process.env.INITIAL_ADMIN_PASSWORD ?? process.env.BOOTSTRAP_PASSWORD
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Set INITIAL_ADMIN_EMAIL to a valid email address.')
}
if (!password || password.length < 12 || password.length > 128) {
  throw new Error('Set INITIAL_ADMIN_PASSWORD to a 12–128 character password.')
}

const prisma = new PrismaClient()
try {
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (existingAdmin) {
    console.log('An administrator already exists. Seed skipped.')
  } else {
    const salt = crypto.randomBytes(16).toString('hex')
    const digest = crypto.scryptSync(password, salt, 64).toString('hex')
    await prisma.user.create({
      data: {
        email, name: 'Administrator', role: 'admin',
        passwordHash: `scrypt:${salt}:${digest}`,
      },
    })
    console.log('Created the administrator account.')
  }
} finally {
  await prisma.$disconnect()
}
