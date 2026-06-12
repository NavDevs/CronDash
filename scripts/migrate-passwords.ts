/**
 * One-time migration script to hash existing plain text passwords
 * 
 * Usage: npx ts-node scripts/migrate-passwords.ts
 * Or: node -r ts-node/register scripts/migrate-passwords.ts
 * 
 * Run this ONCE to migrate existing users to bcrypt hashed passwords.
 * After running, existing users will be able to login normally.
 */

import { PrismaClient } from '@prisma/client'
import { hash, genSalt } from 'bcryptjs'

const prisma = new PrismaClient()

async function migratePasswords() {
  console.log('[MIGRATION] Starting password hash migration...')

  const users = await prisma.user.findMany()

  let migrated = 0
  let skipped = 0

  for (const user of users) {
    if (!user.password) {
      console.log(`[SKIP] ${user.email} - no password (OAuth user)`)
      skipped++
      continue
    }
    // Check if password is already hashed (bcrypt hashes start with $2)
    if (user.password.startsWith('$2')) {
      console.log(`[SKIP] ${user.email} - already hashed`)
      skipped++
      continue
    }

    // Hash the plain text password
    const salt = await genSalt(12)
    const hashedPassword = await hash(user.password!, salt)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    console.log(`[MIGRATED] ${user.email}`)
    migrated++
  }

  console.log(`\n[MIGRATION] Complete!`)
  console.log(`  Migrated: ${migrated}`)
  console.log(`  Skipped:  ${skipped}`)
  console.log(`  Total:    ${users.length}`)

  await prisma.$disconnect()
}

migratePasswords().catch((error) => {
  console.error('[MIGRATION] Error:', error)
  prisma.$disconnect()
  process.exit(1)
})