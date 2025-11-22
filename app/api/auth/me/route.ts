import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { addCorsHeaders, handleCorsPreflight } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  let response: NextResponse

  try {
    const token = request.cookies.get('auth-token')?.value
    console.log('Auth me - token found:', !!token)
    console.log('All cookies:', request.cookies.getAll())

    if (!token) {
      console.log('No token found in cookies')
      return NextResponse.json(
        { message: 'Không tìm thấy token' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    console.log('Token verification result:', !!user)

    if (!user) {
      console.log('Token is invalid')
      return NextResponse.json(
        { message: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    console.log('User authenticated successfully:', user.email)
    response = NextResponse.json(user)
  } catch (error) {
    console.error('Auth me error:', error)
    response = NextResponse.json(
      { message: 'Có lỗi xảy ra khi xác thực' },
      { status: 500 }
    )
  }

  return addCorsHeaders(response, origin)
}
