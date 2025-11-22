import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const centers = await prisma.culturalCenter.findMany({
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(centers)
  } catch (error) {
    console.error('Error fetching cultural centers:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy danh sách nhà văn hóa' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, capacity, location, building, floor, room, amenities } = await request.json()

    if (!name || !capacity || !building) {
      return NextResponse.json(
        { message: 'Tên, sức chứa và tòa nhà là bắt buộc' },
        { status: 400 }
      )
    }

    const center = await prisma.culturalCenter.create({
      data: {
        name,
        description: description || null,
        capacity: parseInt(capacity),
        location: location || '',
        building,
        floor: floor ? parseInt(floor) : null,
        room: room || null,
        amenities: amenities ? JSON.stringify(amenities) : null
      },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      }
    })

    return NextResponse.json(center, { status: 201 })
  } catch (error) {
    console.error('Error creating cultural center:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi tạo nhà văn hóa' },
      { status: 500 }
    )
  }
}
