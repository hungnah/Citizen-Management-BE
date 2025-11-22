import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const building = searchParams.get('building')
    const showPrivate = searchParams.get('showPrivate') === 'true'

    if (!date) {
      return NextResponse.json(
        { message: 'Ngày là bắt buộc' },
        { status: 400 }
      )
    }

    const startDate = new Date(date)
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)

    const whereClause: any = {
      startTime: {
        gte: startDate,
        lt: endDate
      },
      status: 'APPROVED'
    }

    if (building && building !== 'all') {
      whereClause.culturalCenter = {
        building
      }
    }

    if (!showPrivate) {
      whereClause.visibility = 'PUBLIC'
    }

    const bookings = await prisma.culturalCenterBooking.findMany({
      where: whereClause,
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
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching calendar bookings:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy lịch đặt' },
      { status: 500 }
    )
  }
}
