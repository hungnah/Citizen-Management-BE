import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Lấy chi tiết tài sản
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        borrowLogs: {
          include: {
            borrower: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            booking: {
              select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true
              }
            }
          },
          orderBy: {
            borrowedAt: 'desc'
          }
        }
      }
    })

    if (!asset) {
      return NextResponse.json(
        { message: 'Không tìm thấy tài sản' },
        { status: 404 }
      )
    }

    return NextResponse.json(asset)
  } catch (error) {
    console.error('Error fetching asset:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy thông tin tài sản' },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật tài sản (chỉ Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { message: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Chỉ admin mới có quyền cập nhật tài sản' },
        { status: 403 }
      )
    }

    const { name, category, description, quantity, available, status, location, notes } = await request.json()

    const existingAsset = await prisma.asset.findUnique({
      where: { id: params.id }
    })

    if (!existingAsset) {
      return NextResponse.json(
        { message: 'Không tìm thấy tài sản' },
        { status: 404 }
      )
    }

    // Kiểm tra số lượng available không vượt quá quantity
    const finalAvailable = available !== undefined ? available : existingAsset.available
    const finalQuantity = quantity !== undefined ? quantity : existingAsset.quantity

    if (finalAvailable > finalQuantity) {
      return NextResponse.json(
        { message: 'Số lượng có sẵn không thể vượt quá tổng số lượng' },
        { status: 400 }
      )
    }

    const asset = await prisma.asset.update({
      where: { id: params.id },
      data: {
        name: name || existingAsset.name,
        category: category || existingAsset.category,
        description: description !== undefined ? description : existingAsset.description,
        quantity: finalQuantity,
        available: finalAvailable,
        status: status || existingAsset.status,
        location: location !== undefined ? location : existingAsset.location,
        notes: notes !== undefined ? notes : existingAsset.notes
      }
    })

    return NextResponse.json(asset)
  } catch (error) {
    console.error('Error updating asset:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi cập nhật tài sản' },
      { status: 500 }
    )
  }
}

// DELETE - Xóa tài sản (chỉ Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { message: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Chỉ admin mới có quyền xóa tài sản' },
        { status: 403 }
      )
    }

    // Kiểm tra xem có đang được mượn không
    const activeBorrows = await prisma.assetBorrowLog.findFirst({
      where: {
        assetId: params.id,
        status: 'BORROWED'
      }
    })

    if (activeBorrows) {
      return NextResponse.json(
        { message: 'Không thể xóa tài sản đang được mượn' },
        { status: 400 }
      )
    }

    await prisma.asset.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Đã xóa tài sản' })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi xóa tài sản' },
      { status: 500 }
    )
  }
}

