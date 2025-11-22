/**
 * CORS Helper for Backend API
 * Sử dụng khi frontend và backend chạy trên domain khác nhau
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const allowedOrigins = [
  'http://localhost:3000',           // Development
  'http://localhost:3001',           // Development (same origin)
  'https://staging.project.com',      // Staging
  'https://project.com'              // Production
]

export function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return response
}

export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    const response = new NextResponse(null, { status: 204 })
    return addCorsHeaders(response, origin)
  }
  return null
}

