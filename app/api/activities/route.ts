import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Lấy danh sách lịch hoạt động
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
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const culturalCenterId = searchParams.get('culturalCenterId')

    const where: any = {
      status: 'ACTIVE'
    }

    if (type) {
      where.type = type
    }

    if (startDate && endDate) {
      where.OR = [
        {
          AND: [
            { startTime: { gte: new Date(startDate) } },
            { startTime: { lte: new Date(endDate) } }
          ]
        },
        {
          AND: [
            { endTime: { gte: new Date(startDate) } },
            { endTime: { lte: new Date(endDate) } }
          ]
        },
        {
          AND: [
            { startTime: { lte: new Date(startDate) } },
            { endTime: { gte: new Date(endDate) } }
          ]
        }
      ]
    }

    if (culturalCenterId) {
      where.culturalCenterId = culturalCenterId
    }

    const activities = await prisma.activityCalendar.findMany({
      where,
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
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy danh sách lịch hoạt động' },
      { status: 500 }
    )
  }
}

// POST - Tạo lịch hoạt động (chỉ Admin)
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

    // Chỉ Admin mới có quyền tạo lịch hoạt động
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Chỉ admin mới có quyền tạo lịch hoạt động' },
        { status: 403 }
      )
    }

    const { title, description, type, clubType, startTime, endTime, location, culturalCenterId } = await request.json()

    if (!title || !type || !startTime || !endTime) {
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

    // Kiểm tra trùng lặp với các hoạt động khác
    const overlappingActivity = await prisma.activityCalendar.findFirst({
      where: {
        status: 'ACTIVE',
        culturalCenterId: culturalCenterId || undefined,
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

    // Kiểm tra trùng lặp với booking đã được duyệt
    if (culturalCenterId) {
      const overlappingBooking = await prisma.culturalCenterBooking.findFirst({
        where: {
          culturalCenterId,
          status: 'APPROVED',
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
          { message: 'Thời gian này đã có lịch đặt được duyệt' },
          { status: 400 }
        )
      }
    }

    const activity = await prisma.activityCalendar.create({
      data: {
        title,
        description: description || null,
        type,
        clubType: clubType || null,
        startTime: start,
        endTime: end,
        location: location || null,
        culturalCenterId: culturalCenterId || null,
        createdBy: user.id
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

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi tạo lịch hoạt động' },
      { status: 500 }
    )
  }
}

