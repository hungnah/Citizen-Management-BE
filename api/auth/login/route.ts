import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken } from '..\..\..\lib\auth.ts'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json(
        { message: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })

    const response = NextResponse.json({
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      role: user.role
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    console.log('Cookie set:', token.substring(0, 20) + '...')
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra trong quá trình đăng nhập' },
      { status: 500 }
    )
  }
}
