import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    const requests = await prisma.request.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        household: {
          select: {
            id: true,
            householdId: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy danh sách yêu cầu' },
      { status: 500 }
    )
  }
}

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

    const { type, description, data, householdId } = await request.json()

    if (!type || !description) {
      return NextResponse.json(
        { message: 'Loại yêu cầu và mô tả là bắt buộc' },
        { status: 400 }
      )
    }

    const requestData = await prisma.request.create({
      data: {
        type,
        description,
        data: data ? JSON.stringify(data) : null,
        userId: user.id,
        householdId: householdId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        household: {
          select: {
            id: true,
            householdId: true,
            address: true
          }
        }
      }
    })

    return NextResponse.json(requestData, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi tạo yêu cầu' },
      { status: 500 }
    )
  }
}
