import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const households = await prisma.household.findMany({
      include: {
        district: true,
        members: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(households)
  } catch (error) {
    console.error('Error fetching households:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy danh sách hộ khẩu' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { householdId, address, districtId } = await request.json()

    if (!householdId || !address || !districtId) {
      return NextResponse.json(
        { message: 'Tất cả các trường là bắt buộc' },
        { status: 400 }
      )
    }

    // Check if household ID already exists
    const existingHousehold = await prisma.household.findUnique({
      where: { householdId }
    })

    if (existingHousehold) {
      return NextResponse.json(
        { message: 'Số hộ khẩu đã tồn tại' },
        { status: 400 }
      )
    }

    const household = await prisma.household.create({
      data: {
        householdId,
        address,
        districtId
      },
      include: {
        district: true,
        members: true
      }
    })

    return NextResponse.json(household, { status: 201 })
  } catch (error) {
    console.error('Error creating household:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi tạo hộ khẩu' },
      { status: 500 }
    )
  }
}
