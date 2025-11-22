import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '..\..\lib\prisma.ts'
import { verifyToken } from '..\..\lib\auth.ts'

// GET - Lấy danh sách tài sản
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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        borrowLogs: {
          where: {
            status: 'BORROWED'
          },
          select: {
            id: true,
            quantity: true,
            borrowedAt: true,
            borrower: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Tính số lượng đang được mượn
    const assetsWithBorrowed = assets.map(asset => {
      const borrowedQuantity = asset.borrowLogs.reduce((sum, log) => sum + log.quantity, 0)
      return {
        ...asset,
        borrowedQuantity,
        availableQuantity: asset.available - borrowedQuantity
      }
    })

    return NextResponse.json(assetsWithBorrowed)
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy danh sách tài sản' },
      { status: 500 }
    )
  }
}

// POST - Tạo tài sản (chỉ Admin)
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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Chỉ admin mới có quyền tạo tài sản' },
        { status: 403 }
      )
    }

    const { name, category, description, quantity, status, location, notes } = await request.json()

    if (!name || !category) {
      return NextResponse.json(
        { message: 'Tên và danh mục là bắt buộc' },
        { status: 400 }
      )
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        category,
        description: description || null,
        quantity: quantity || 1,
        available: quantity || 1,
        status: status || 'GOOD',
        location: location || null,
        notes: notes || null
      }
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi tạo tài sản' },
      { status: 500 }
    )
  }
}

