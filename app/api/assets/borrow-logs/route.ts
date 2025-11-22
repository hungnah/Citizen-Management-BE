import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Lấy nhật ký mượn/trả tài sản
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { message: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { message: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')
    const bookingId = searchParams.get('bookingId')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: any = {}

    // User chỉ xem được nhật ký của mình, Admin xem được tất cả
    if (user.role !== 'ADMIN') {
      where.borrowedBy = user.id
    } else if (userId) {
      where.borrowedBy = userId
    }

    if (assetId) {
      where.assetId = assetId
    }

    if (bookingId) {
      where.bookingId = bookingId
    }

    if (status) {
      where.status = status
    }

    const logs = await prisma.assetBorrowLog.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true,
            status: true
          }
        },
        borrower: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        booking: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: {
        borrowedAt: 'desc'
      }
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching borrow logs:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy nhật ký mượn/trả' },
      { status: 500 }
    )
  }
}

