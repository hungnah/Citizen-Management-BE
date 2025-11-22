import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '..\..\..\lib\auth.ts'
import { prisma } from '..\..\..\lib\prisma.ts'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

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

    const user = await createUser(email, password, name, 'USER')

    return NextResponse.json({
      message: 'Đăng ký thành công',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra trong quá trình đăng ký' },
      { status: 500 }
    )
  }
}
