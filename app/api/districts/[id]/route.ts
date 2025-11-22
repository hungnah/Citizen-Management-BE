import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { message: 'Tên khu phố là bắt buộc' },
        { status: 400 }
      )
    }

    // Check if district name already exists (excluding current district)
    const existingDistrict = await prisma.district.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        id: { not: params.id }
      }
    })

    if (existingDistrict) {
      return NextResponse.json(
        { message: 'Tên khu phố đã tồn tại' },
        { status: 400 }
      )
    }

    const district = await prisma.district.update({
      where: { id: params.id },
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

    return NextResponse.json(district)
  } catch (error) {
    console.error('Error updating district:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi cập nhật khu phố' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if district has households
    const district = await prisma.district.findUnique({
      where: { id: params.id },
      include: { households: true }
    })

    if (!district) {
      return NextResponse.json(
        { message: 'Không tìm thấy khu phố' },
        { status: 404 }
      )
    }

    if (district.households.length > 0) {
      return NextResponse.json(
        { message: 'Không thể xóa khu phố có hộ khẩu' },
        { status: 400 }
      )
    }

    await prisma.district.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Xóa khu phố thành công' })
  } catch (error) {
    console.error('Error deleting district:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi xóa khu phố' },
      { status: 500 }
    )
  }
}
