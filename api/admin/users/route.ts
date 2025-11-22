import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '..\..\..\lib\prisma.ts'
import { verifyToken } from '..\..\..\lib\auth.ts'
import { createUser } from '..\..\..\lib\auth.ts'

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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Chỉ admin mới có quyền xem danh sách người dùng' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    const where: any = {}
    if (role && role !== 'all') {
      where.role = role
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
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

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi lấy danh sách người dùng' },
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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Chỉ admin mới có quyền tạo tài khoản' },
        { status: 403 }
      )
    }

    const { name, email, password, role } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Tất cả các trường là bắt buộc' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    const newUser = await createUser(
      email,
      password,
      name,
      role === 'ADMIN' ? 'ADMIN' : 'USER'
    )

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'USER',
        entityId: newUser.id,
        userId: user.id,
        adminId: user.id,
        details: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        })
      }
    })

    return NextResponse.json({
      message: 'Tạo tài khoản thành công',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi tạo tài khoản' },
      { status: 500 }
    )
  }
}

