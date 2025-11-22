import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'

export async function PATCH(
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
        { message: 'Chỉ admin mới có quyền cập nhật người dùng' },
        { status: 403 }
      )
    }

    const { name, email, role, password } = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { message: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (role && ['ADMIN', 'USER'].includes(role)) updateData.role = role
    if (password && password.length >= 6) {
      updateData.password = await hashPassword(password)
    }

    // Check email uniqueness if changing email
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })
      if (emailExists) {
        return NextResponse.json(
          { message: 'Email đã được sử dụng' },
          { status: 400 }
        )
      }
      updateData.email = email
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity: 'USER',
        entityId: params.id,
        userId: params.id,
        adminId: user.id,
        details: JSON.stringify({
          changes: updateData
        })
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi cập nhật người dùng' },
      { status: 500 }
    )
  }
}

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
        { message: 'Chỉ admin mới có quyền xóa người dùng' },
        { status: 403 }
      )
    }

    if (user.id === params.id) {
      return NextResponse.json(
        { message: 'Không thể xóa chính tài khoản của bạn' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { message: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entity: 'USER',
        entityId: params.id,
        userId: params.id,
        adminId: user.id,
        details: JSON.stringify({
          email: existingUser.email,
          name: existingUser.name
        })
      }
    })

    return NextResponse.json({ message: 'Xóa người dùng thành công' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi xóa người dùng' },
      { status: 500 }
    )
  }
}

