import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

    const userWithHousehold = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        household: true
      }
    })

    if (!userWithHousehold?.household) {
      return NextResponse.json([])
    }

    const persons = await prisma.person.findMany({
      where: {
        householdId: userWithHousehold.household.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(persons)
  } catch (error) {
    console.error('Error fetching household persons:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy danh sách nhân khẩu' },
      { status: 500 }
    )
  }
}
