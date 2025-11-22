import { PrismaClient } from '@prisma/client'
import path from 'path'

// Khi tách repo, database có thể ở ../database hoặc ./database
const getDatabasePath = () => {
  // Nếu DATABASE_URL đã được set, sử dụng nó
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  
  // Kiểm tra xem database có ở ../database không (khi tách repo)
  const dbPathRelative = path.join(process.cwd(), '../database/dev.db')
  const dbPathLocal = path.join(process.cwd(), 'database/dev.db')
  
  // Mặc định sử dụng ../database/dev.db khi tách repo
  const DEFAULT_DB_URL = 'file:../database/dev.db'
  
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Prisma] DATABASE_URL chưa được cấu hình. Đang sử dụng mặc định:', DEFAULT_DB_URL)
    console.warn('[Prisma] Vui lòng set DATABASE_URL trong .env.local')
  }
  
  return DEFAULT_DB_URL
}

if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'file:./prisma/dev.db') {
  process.env.DATABASE_URL = getDatabasePath()
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
