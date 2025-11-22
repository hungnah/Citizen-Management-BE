import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// POST - Trả tài sản (chỉ Admin hoặc người mượn)
export async function POST(request: NextRequest) {
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

    const { borrowLogId, conditionAfter, notes } = await request.json()

    if (!borrowLogId) {
      return NextResponse.json(
        { message: 'ID nhật ký mượn là bắt buộc' },
        { status: 400 }
      )
    }

    const borrowLog = await prisma.assetBorrowLog.findUnique({
      where: { id: borrowLogId },
      include: {
        asset: true,
        borrower: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!borrowLog) {
      return NextResponse.json(
        { message: 'Không tìm thấy nhật ký mượn' },
        { status: 404 }
      )
    }

    if (borrowLog.status === 'RETURNED') {
      return NextResponse.json(
        { message: 'Tài sản đã được trả' },
        { status: 400 }
      )
    }

    // Chỉ người mượn hoặc admin mới có quyền trả
    if (borrowLog.borrowedBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Bạn không có quyền trả tài sản này' },
        { status: 403 }
      )
    }

    const status = conditionAfter === 'DAMAGED' ? 'DAMAGED' : 'RETURNED'

    const updatedLog = await prisma.assetBorrowLog.update({
      where: { id: borrowLogId },
      data: {
        status,
        returnedAt: new Date(),
        conditionAfter: conditionAfter || null,
        notes: notes || null,
        checkedBy: user.role === 'ADMIN' ? user.id : null
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        borrower: {
          select: {
            id: true,
            name: true
          }
        },
        booking: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Nếu tài sản bị hư hỏng, cập nhật trạng thái
    if (status === 'DAMAGED') {
      await prisma.asset.update({
        where: { id: borrowLog.assetId },
        data: { status: 'BROKEN' }
      })
    }

    return NextResponse.json(updatedLog)
  } catch (error) {
    console.error('Error returning asset:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi trả tài sản' },
      { status: 500 }
    )
  }
}

