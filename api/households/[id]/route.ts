import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '..\..\..\lib\prisma.ts'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const household = await prisma.household.findUnique({
      where: { id: params.id },
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
    })

    if (!household) {
      return NextResponse.json(
        { message: 'Không tìm thấy hộ khẩu' },
        { status: 404 }
      )
    }

    return NextResponse.json(household)
  } catch (error) {
    console.error('Error fetching household:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy thông tin hộ khẩu' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { householdId, address, districtId } = await request.json()

    if (!householdId || !address || !districtId) {
      return NextResponse.json(
        { message: 'Tất cả các trường là bắt buộc' },
        { status: 400 }
      )
    }

    // Check if household ID already exists (excluding current household)
    const existingHousehold = await prisma.household.findFirst({
      where: {
        householdId,
        id: { not: params.id }
      }
    })

    if (existingHousehold) {
      return NextResponse.json(
        { message: 'Số hộ khẩu đã tồn tại' },
        { status: 400 }
      )
    }

    const household = await prisma.household.update({
      where: { id: params.id },
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

    return NextResponse.json(household)
  } catch (error) {
    console.error('Error updating household:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi cập nhật hộ khẩu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if household has members
    const household = await prisma.household.findUnique({
      where: { id: params.id },
      include: { members: true }
    })

    if (!household) {
      return NextResponse.json(
        { message: 'Không tìm thấy hộ khẩu' },
        { status: 404 }
      )
    }

    if (household.members.length > 0) {
      return NextResponse.json(
        { message: 'Không thể xóa hộ khẩu có thành viên' },
        { status: 400 }
      )
    }

    await prisma.household.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Xóa hộ khẩu thành công' })
  } catch (error) {
    console.error('Error deleting household:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi xóa hộ khẩu' },
      { status: 500 }
    )
  }
}
