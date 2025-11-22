import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Lấy lịch hoạt động theo dạng calendar (theo ngày/tháng)
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
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const culturalCenterId = searchParams.get('culturalCenterId')

    const startDate = year && month 
      ? new Date(parseInt(year), parseInt(month) - 1, 1)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    
    const endDate = year && month
      ? new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59)

    const where: any = {
      status: 'ACTIVE',
      OR: [
        {
          AND: [
            { startTime: { gte: startDate } },
            { startTime: { lte: endDate } }
          ]
        },
        {
          AND: [
            { endTime: { gte: startDate } },
            { endTime: { lte: endDate } }
          ]
        },
        {
          AND: [
            { startTime: { lte: startDate } },
            { endTime: { gte: endDate } }
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
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Nhóm theo ngày để dễ hiển thị trên calendar
    const calendarData: Record<string, any[]> = {}
    activities.forEach(activity => {
      const dateKey = activity.startTime.toISOString().split('T')[0]
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = []
      }
      calendarData[dateKey].push(activity)
    })

    return NextResponse.json({
      activities,
      calendarData,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    })
  } catch (error) {
    console.error('Error fetching calendar activities:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy lịch hoạt động' },
      { status: 500 }
    )
  }
}

