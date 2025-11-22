import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { title, description, startTime, endTime, culturalCenterId, visibility } = await request.json()

    if (!title || !startTime || !endTime || !culturalCenterId) {
      return NextResponse.json(
        { message: 'Tất cả các trường bắt buộc phải được điền' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      return NextResponse.json(
        { message: 'Thời gian kết thúc phải sau thời gian bắt đầu' },
        { status: 400 }
      )
    }

    if (start < new Date()) {
      return NextResponse.json(
        { message: 'Không thể đặt lịch trong quá khứ' },
        { status: 400 }
      )
    }

    // Check if booking exists and user has permission
    const existingBooking = await prisma.culturalCenterBooking.findUnique({
      where: { id: params.id }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { message: 'Không tìm thấy lịch đặt' },
        { status: 404 }
      )
    }

    if (existingBooking.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Bạn không có quyền chỉnh sửa lịch đặt này' },
        { status: 403 }
      )
    }

    // Check for overlapping bookings (excluding current booking)
    const overlappingBooking = await prisma.culturalCenterBooking.findFirst({
      where: {
        culturalCenterId,
        status: 'APPROVED',
        id: { not: params.id },
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } }
            ]
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } }
            ]
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } }
            ]
          }
        ]
      }
    })

    if (overlappingBooking) {
      return NextResponse.json(
        { message: 'Thời gian này đã được đặt bởi người khác' },
        { status: 400 }
      )
    }

    const booking = await prisma.culturalCenterBooking.update({
      where: { id: params.id },
      data: {
        title,
        description: description || null,
        startTime: start,
        endTime: end,
        culturalCenterId,
        visibility: visibility || 'PUBLIC'
      },
      include: {
        culturalCenter: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true,
            room: true,
            capacity: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi cập nhật lịch đặt' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const booking = await prisma.culturalCenterBooking.findUnique({
      where: { id: params.id }
    })

    if (!booking) {
      return NextResponse.json(
        { message: 'Không tìm thấy lịch đặt' },
        { status: 404 }
      )
    }

    if (booking.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Bạn không có quyền xóa lịch đặt này' },
        { status: 403 }
      )
    }

    await prisma.culturalCenterBooking.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Xóa lịch đặt thành công' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi xóa lịch đặt' },
      { status: 500 }
    )
  }
}
