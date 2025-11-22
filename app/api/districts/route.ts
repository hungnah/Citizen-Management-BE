import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const districts = await prisma.district.findMany({
      include: {
        _count: {
          select: {
            households: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(districts)
  } catch (error) {
    console.error('Error fetching districts:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy danh sách khu phố' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { message: 'Tên khu phố là bắt buộc' },
        { status: 400 }
      )
    }

    // Check if district name already exists
    const existingDistrict = await prisma.district.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existingDistrict) {
      return NextResponse.json(
        { message: 'Tên khu phố đã tồn tại' },
        { status: 400 }
      )
    }

    const district = await prisma.district.create({
      data: {
        name,
        description: description || null
      },
      include: {
        _count: {
          select: {
            households: true
          }
        }
      }
    })

    return NextResponse.json(district, { status: 201 })
  } catch (error) {
    console.error('Error creating district:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi tạo khu phố' },
      { status: 500 }
    )
  }
}
