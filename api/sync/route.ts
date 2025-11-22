import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '..\..\lib\auth.ts'
import { syncAll } from '..\..\lib\sync.ts'

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
        { message: 'Chỉ admin mới có quyền thực hiện đồng bộ' },
        { status: 403 }
      )
    }

    const result = await syncAll()

    return NextResponse.json({
      message: 'Đồng bộ thành công',
      result
    })
  } catch (error) {
    console.error('Error syncing:', error)
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi đồng bộ' },
      { status: 500 }
    )
  }
}

