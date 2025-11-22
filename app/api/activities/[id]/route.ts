import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Lấy chi tiết lịch hoạt động
export async function GET(
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

    const activity = await prisma.activityCalendar.findUnique({
      where: { id: params.id },
      include: {
        culturalCenter: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true,
            room: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!activity) {
      return NextResponse.json(
        { message: 'Không tìm thấy lịch hoạt động' },
        { status: 404 }
      )
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy thông tin lịch hoạt động' },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật lịch hoạt động (chỉ Admin)
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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Chỉ admin mới có quyền cập nhật lịch hoạt động' },
        { status: 403 }
      )
    }

    const { title, description, type, clubType, startTime, endTime, location, culturalCenterId, status } = await request.json()

    const existingActivity = await prisma.activityCalendar.findUnique({
      where: { id: params.id }
    })

    if (!existingActivity) {
      return NextResponse.json(
        { message: 'Không tìm thấy lịch hoạt động' },
        { status: 404 }
      )
    }

    const start = startTime ? new Date(startTime) : existingActivity.startTime
    const end = endTime ? new Date(endTime) : existingActivity.endTime

    if (start >= end) {
      return NextResponse.json(
        { message: 'Thời gian kết thúc phải sau thời gian bắt đầu' },
        { status: 400 }
      )
    }

    // Kiểm tra trùng lặp (trừ chính nó)
    if (startTime || endTime || culturalCenterId) {
      const overlappingActivity = await prisma.activityCalendar.findFirst({
        where: {
          id: { not: params.id },
          status: 'ACTIVE',
          culturalCenterId: culturalCenterId || existingActivity.culturalCenterId || undefined,
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

      if (overlappingActivity) {
        return NextResponse.json(
          { message: 'Thời gian này đã có hoạt động khác' },
          { status: 400 }
        )
      }
    }

    const activity = await prisma.activityCalendar.update({
      where: { id: params.id },
      data: {
        title: title || existingActivity.title,
        description: description !== undefined ? description : existingActivity.description,
        type: type || existingActivity.type,
        clubType: clubType !== undefined ? clubType : existingActivity.clubType,
        startTime: start,
        endTime: end,
        location: location !== undefined ? location : existingActivity.location,
        culturalCenterId: culturalCenterId !== undefined ? culturalCenterId : existingActivity.culturalCenterId,
        status: status || existingActivity.status
      },
      include: {
        culturalCenter: {
          select: {
            id: true,
            name: true,
            building: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi cập nhật lịch hoạt động' },
      { status: 500 }
    )
  }
}

// DELETE - Xóa lịch hoạt động (chỉ Admin)
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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Chỉ admin mới có quyền xóa lịch hoạt động' },
        { status: 403 }
      )
    }

    const activity = await prisma.activityCalendar.findUnique({
      where: { id: params.id }
    })

    if (!activity) {
      return NextResponse.json(
        { message: 'Không tìm thấy lịch hoạt động' },
        { status: 404 }
      )
    }

    // Soft delete - chỉ đổi status
    await prisma.activityCalendar.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({ message: 'Đã xóa lịch hoạt động' })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi xóa lịch hoạt động' },
      { status: 500 }
    )
  }
}

