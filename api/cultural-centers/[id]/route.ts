import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '..\..\..\lib\prisma.ts'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, capacity, location, building, floor, room, amenities } = await request.json()

    if (!name || !capacity || !building) {
      return NextResponse.json(
        { message: 'Tên, sức chứa và tòa nhà là bắt buộc' },
        { status: 400 }
      )
    }

    const center = await prisma.culturalCenter.update({
      where: { id: params.id },
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

    return NextResponse.json(center)
  } catch (error) {
    console.error('Error updating cultural center:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi cập nhật nhà văn hóa' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if center has bookings
    const center = await prisma.culturalCenter.findUnique({
      where: { id: params.id },
      include: { bookings: true }
    })

    if (!center) {
      return NextResponse.json(
        { message: 'Không tìm thấy nhà văn hóa' },
        { status: 404 }
      )
    }

    if (center.bookings.length > 0) {
      return NextResponse.json(
        { message: 'Không thể xóa nhà văn hóa có lịch đặt' },
        { status: 400 }
      )
    }

    await prisma.culturalCenter.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Xóa nhà văn hóa thành công' })
  } catch (error) {
    console.error('Error deleting cultural center:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi xóa nhà văn hóa' },
      { status: 500 }
    )
  }
}
