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
        household: {
          include: {
            district: true,
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    })

    if (!userWithHousehold?.household) {
      return NextResponse.json(null)
    }

    return NextResponse.json(userWithHousehold.household)
  } catch (error) {
    console.error('Error fetching user household:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy thông tin hộ khẩu' },
      { status: 500 }
    )
  }
}
