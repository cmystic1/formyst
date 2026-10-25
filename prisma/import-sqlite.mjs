import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

if (existsSync('.env')) process.loadEnvFile()

const sqlitePath = resolve(process.argv[2] ?? 'prisma/dev.db')
const ownerEmail = process.argv[3]?.trim().toLowerCase()
if (!ownerEmail) throw new Error('Usage: node prisma/import-sqlite.mjs <sqlite-file> <owner-email>')
if (!process.env.DATABASE_URL?.startsWith('mysql://')) {
  throw new Error('DATABASE_URL must point to the destination MySQL database.')
}

const prisma = new PrismaClient()
const owner = await prisma.user.findUnique({ where: { email: ownerEmail } })
if (!owner) throw new Error('Create the owner account first with npm run db:seed.')
const formId = 'legacy' + crypto.createHash('sha256').update(owner.id).digest('hex').slice(0, 20)
const exporter = spawn(process.env.PYTHON ?? 'python', [resolve('prisma/export-sqlite.py'), sqlitePath], {
  stdio: ['ignore', 'pipe', 'inherit'],
})
const exit = new Promise((resolveExit, reject) => {
  exporter.on('error', reject)
  exporter.on('close', code => code === 0 ? resolveExit() : reject(new Error(`SQLite export exited with code ${code}`)))
})
let formSeen = false
let submissions = 0
let settings = 0
try {
  for await (const line of createInterface({ input: exporter.stdout, crlfDelay: Infinity })) {
    const { table, row } = JSON.parse(line)
    if (table === 'Form') {
      formSeen = true
      const fields = row.fields || '[]'
      const data = {
        id: formId, ownerId: owner.id,
        title: row.title || 'Untitled form',
        description: row.description || '',
        submitLabel: row.submitLabel || 'Submit',
        logo: row.logo || '', cover: row.cover || '', background: row.background || '',
        poweredBy: row.poweredBy !== 0,
        successTitle: row.successTitle ?? 'Thank you!',
        successMessage: row.successMessage ?? 'Your response has been recorded.',
        successButton: row.successButton ?? 'Submit another response',
        theme: row.theme || '{}', fields,
        published: JSON.parse(fields).length > 0,
      }
      await prisma.form.upsert({ where: { id: formId }, create: data, update: {} })
    } else if (table === 'Submission') {
      if (!formSeen) throw new Error('Legacy form was not found.')
      await prisma.submission.createMany({
        data: [{
          id: row.id, formId, answers: row.answers || '{}',
          createdAt: new Date(row.createdAt),
        }],
        skipDuplicates: true,
      })
      submissions++
    } else if (table === 'Setting') {
      if (!formSeen) throw new Error('Legacy form was not found.')
      await prisma.setting.upsert({
        where: { formId_key: { formId, key: row.key } },
        create: { formId, key: row.key, value: row.value },
        update: {},
      })
      settings++
    }
  }
  await exit
  if (!formSeen) throw new Error('No form was found in the SQLite database.')
  console.log(`Imported legacy form ${formId}; processed ${submissions} submissions and ${settings} settings.`)
} finally {
  await prisma.$disconnect()
}
