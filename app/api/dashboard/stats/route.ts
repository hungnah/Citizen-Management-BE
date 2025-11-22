import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncAll } from '@/lib/sync'

export async function GET() {
  try {
    // Auto-sync before returning stats
    await syncAll()

    const [
      totalHouseholds,
      totalPersons,
      totalDistricts,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalBookings,
      activeBookings,
      pendingBookings,
      approvedBookings,
      rejectedBookings,
      totalCulturalCenters,
      recentActivity
    ] = await Promise.all([
      prisma.household.count(),
      prisma.person.count(),
      prisma.district.count(),
      prisma.request.count(),
      prisma.request.count({
        where: { status: 'PENDING' }
      }),
      prisma.request.count({
        where: { status: 'APPROVED' }
      }),
      prisma.request.count({
        where: { status: 'REJECTED' }
      }),
      prisma.culturalCenterBooking.count(),
      prisma.culturalCenterBooking.count({
        where: {
          status: 'APPROVED',
          startTime: { gte: new Date() }
        }
      }),
      prisma.culturalCenterBooking.count({
        where: { status: 'PENDING' }
      }),
      prisma.culturalCenterBooking.count({
        where: { status: 'APPROVED' }
      }),
      prisma.culturalCenterBooking.count({
        where: { status: 'REJECTED' }
      }),
      prisma.culturalCenter.count(),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    ])

    // Get today's stats for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterdayStats = await prisma.systemStats.findFirst({
      where: {
        date: {
          lt: today
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json({
      totalHouseholds,
      totalPersons,
      totalDistricts,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalBookings,
      activeBookings,
      pendingBookings,
      approvedBookings,
      rejectedBookings,
      totalCulturalCenters,
      recentActivity,
      yesterdayStats: yesterdayStats ? {
        totalHouseholds: yesterdayStats.totalHouseholds,
        totalPersons: yesterdayStats.totalPersons,
        totalBookings: yesterdayStats.totalBookings,
        activeBookings: yesterdayStats.activeBookings
      } : null
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy thống kê' },
      { status: 500 }
    )
  }
}
