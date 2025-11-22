# Citizen Management - Backend API

Backend API cho hệ thống quản lý nhân khẩu và nhà văn hóa, được xây dựng bằng Next.js 14 API Routes, Prisma ORM và SQLite/PostgreSQL.

## 🚀 Tính năng

- **Authentication**: JWT-based authentication với bcryptjs
- **Household Management**: CRUD operations cho hộ khẩu
- **Person Management**: Quản lý nhân khẩu
- **District Management**: Quản lý khu phố
- **Cultural Center Management**: Quản lý nhà văn hóa
- **Booking System**: Hệ thống đặt lịch với validation
- **Request System**: Hệ thống yêu cầu và duyệt
- **Notification System**: Thông báo cho người dùng

## 🛠️ Công nghệ

- **Framework**: Next.js 14 (API Routes)
- **Language**: TypeScript
- **Database**: SQLite (Development), PostgreSQL (Production)
- **ORM**: Prisma
- **Authentication**: JWT với bcryptjs
- **Validation**: Input validation và error handling

## 📦 Cài đặt

### Yêu cầu hệ thống

- Node.js 18+
- npm hoặc yarn
- SQLite (development) hoặc PostgreSQL (production)

### Bước 1: Clone repository

```bash
git clone <backend-repo-url>
cd citizen-management-backend
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình database

Tạo file `.env.local`:

```env
# JWT Secret Key
JWT_SECRET=your-secret-key-here-change-in-production

# Database URL
# SQLite (Development)
DATABASE_URL="file:../database/dev.db"

# PostgreSQL (Production)
# DATABASE_URL="postgresql://user:password@localhost:5432/citizen_management?schema=public"

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Bước 4: Setup database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio để xem database
npm run db:studio
```

### Bước 5: Chạy server

```bash
npm run dev
```

API server sẽ chạy tại `http://localhost:3001`

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Households
- `GET /api/households` - Danh sách hộ khẩu
- `POST /api/households` - Tạo hộ khẩu
- `PUT /api/households/[id]` - Cập nhật hộ khẩu
- `DELETE /api/households/[id]` - Xóa hộ khẩu

### Districts
- `GET /api/districts` - Danh sách khu phố
- `POST /api/districts` - Tạo khu phố
- `PUT /api/districts/[id]` - Cập nhật khu phố
- `DELETE /api/districts/[id]` - Xóa khu phố

### Cultural Centers
- `GET /api/cultural-centers` - Danh sách nhà văn hóa
- `POST /api/cultural-centers` - Tạo nhà văn hóa
- `PUT /api/cultural-centers/[id]` - Cập nhật nhà văn hóa
- `DELETE /api/cultural-centers/[id]` - Xóa nhà văn hóa

### Bookings
- `GET /api/bookings` - Danh sách lịch đặt
- `POST /api/bookings` - Tạo lịch đặt
- `PUT /api/bookings/[id]` - Cập nhật lịch đặt
- `DELETE /api/bookings/[id]` - Xóa lịch đặt
- `PATCH /api/bookings/[id]/status` - Duyệt/từ chối lịch đặt
- `GET /api/bookings/calendar` - Lịch theo ngày/tòa nhà

### Requests
- `GET /api/requests` - Danh sách yêu cầu (Admin)
- `POST /api/requests` - Tạo yêu cầu
- `PATCH /api/requests/[id]/status` - Duyệt/từ chối yêu cầu
- `GET /api/my-requests` - Yêu cầu của user

Xem thêm trong file README.md chính để biết đầy đủ API documentation.

## 🏗️ Cấu trúc dự án

```
backend/
├── api/                   # API Routes
│   ├── auth/             # Authentication endpoints
│   ├── households/       # Household endpoints
│   ├── bookings/         # Booking endpoints
│   └── ...
├── lib/
│   ├── auth.ts          # Authentication utilities
│   ├── prisma.ts        # Prisma client
│   └── sync.ts          # Sync utilities
├── scripts/
│   └── seed.ts          # Database seeding
└── package.json
```

## 🔒 Bảo mật

- **JWT Authentication**: Tất cả protected routes yêu cầu JWT token
- **Password Hashing**: Sử dụng bcryptjs
- **Input Validation**: Kiểm tra và validate tất cả input
- **SQL Injection Protection**: Sử dụng Prisma ORM
- **CORS**: Cấu hình CORS để chỉ cho phép frontend kết nối

## 🚀 Deploy

### Production Build

```bash
npm run build
npm start
```

### Environment Variables cho Production

```env
JWT_SECRET=your-production-secret-key
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=3001
NODE_ENV=production
```

### CORS Configuration

Đảm bảo cấu hình CORS để cho phép frontend kết nối:

```typescript
// Trong middleware hoặc API route
const allowedOrigins = [
  'http://localhost:3000',           // Development
  'https://staging.project.com',      // Staging
  'https://project.com'               // Production
]
```

## 📝 Ghi chú

- Backend cung cấp API ổn định cho frontend
- Backend không chứa code frontend
- Database schema được quản lý bằng Prisma
- Tất cả API responses đều có error handling

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

MIT License

