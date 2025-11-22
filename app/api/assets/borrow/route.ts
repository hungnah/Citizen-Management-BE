import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// POST - Mượn tài sản
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

    const { assetId, bookingId, quantity, conditionBefore, notes } = await request.json()

    if (!assetId || !quantity) {
      return NextResponse.json(
        { message: 'Tài sản và số lượng là bắt buộc' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { message: 'Số lượng phải lớn hơn 0' },
        { status: 400 }
      )
    }

    // Kiểm tra tài sản có tồn tại và có sẵn không
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    })

    if (!asset) {
      return NextResponse.json(
        { message: 'Không tìm thấy tài sản' },
        { status: 404 }
      )
    }

    if (asset.status !== 'GOOD') {
      return NextResponse.json(
        { message: `Tài sản đang ở trạng thái ${asset.status}, không thể mượn` },
        { status: 400 }
      )
    }

    // Kiểm tra số lượng đang được mượn
    const activeBorrows = await prisma.assetBorrowLog.findMany({
      where: {
        assetId,
        status: 'BORROWED'
      }
    })

    const borrowedQuantity = activeBorrows.reduce((sum, log) => sum + log.quantity, 0)
    const availableQuantity = asset.available - borrowedQuantity

    if (quantity > availableQuantity) {
      return NextResponse.json(
        { message: `Chỉ còn ${availableQuantity} tài sản có sẵn` },
        { status: 400 }
      )
    }

    // Kiểm tra booking nếu có
    if (bookingId) {
      const booking = await prisma.culturalCenterBooking.findUnique({
        where: { id: bookingId }
      })

      if (!booking) {
        return NextResponse.json(
          { message: 'Không tìm thấy lịch đặt' },
          { status: 404 }
        )
      }

      if (booking.userId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json(
          { message: 'Bạn không có quyền mượn tài sản cho lịch đặt này' },
          { status: 403 }
        )
      }
    }

    const borrowLog = await prisma.assetBorrowLog.create({
      data: {
        assetId,
        bookingId: bookingId || null,
        borrowedBy: user.id,
        quantity,
        conditionBefore: conditionBefore || null,
        notes: notes || null
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true
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

    return NextResponse.json(borrowLog, { status: 201 })
  } catch (error) {
    console.error('Error borrowing asset:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi mượn tài sản' },
      { status: 500 }
    )
  }
}

