import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Bắt đầu tạo dữ liệu mẫu...')

  // Tạo admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Quản trị viên',
      role: 'ADMIN'
    }
  })

  // Tạo user thường
  const userPassword = await bcrypt.hash('user123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Người dùng',
      role: 'USER'
    }
  })

  // Tạo khu phố
  const district1 = await prisma.district.upsert({
    where: { id: 'district-1' },
    update: {},
    create: {
      id: 'district-1',
      name: 'Khu phố 1',
      description: 'Khu phố trung tâm thành phố'
    }
  })

  const district2 = await prisma.district.upsert({
    where: { id: 'district-2' },
    update: {},
    create: {
      id: 'district-2',
      name: 'Khu phố 2',
      description: 'Khu phố phía đông'
    }
  })

  // Tạo hộ khẩu
  const household1 = await prisma.household.upsert({
    where: { id: 'household-1' },
    update: {},
    create: {
      id: 'household-1',
      householdId: 'HK001',
      address: '123 Đường ABC, Phường XYZ',
      districtId: district1.id
    }
  })

  const household2 = await prisma.household.upsert({
    where: { id: 'household-2' },
    update: {},
    create: {
      id: 'household-2',
      householdId: 'HK002',
      address: '456 Đường DEF, Phường UVW',
      districtId: district2.id
    }
  })

  // Gán user vào hộ khẩu
  await prisma.user.update({
    where: { id: user.id },
    data: { householdId: household1.id }
  })

  // Tạo nhân khẩu
  await prisma.person.upsert({
    where: { id: 'person-1' },
    update: {},
    create: {
      id: 'person-1',
      fullName: 'Nguyễn Văn A',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Nam',
      idNumber: '123456789',
      relationship: 'Chủ hộ',
      householdId: household1.id
    }
  })

  await prisma.person.upsert({
    where: { id: 'person-2' },
    update: {},
    create: {
      id: 'person-2',
      fullName: 'Trần Thị B',
      dateOfBirth: new Date('1992-05-15'),
      gender: 'Nữ',
      idNumber: '987654321',
      relationship: 'Vợ',
      householdId: household1.id
    }
  })

  // Tạo nhà văn hóa
  await prisma.culturalCenter.upsert({
    where: { id: 'center-1' },
    update: {},
    create: {
      id: 'center-1',
      name: 'Phòng họp A1',
      description: 'Phòng họp lớn tầng 1 tòa A',
      capacity: 50,
      location: 'Tầng 1, Tòa A',
      building: 'A',
      floor: 1,
      room: 'A101',
      amenities: JSON.stringify(['Máy chiếu', 'Âm thanh', 'Điều hòa'])
    }
  })

  await prisma.culturalCenter.upsert({
    where: { id: 'center-2' },
    update: {},
    create: {
      id: 'center-2',
      name: 'Phòng họp B1',
      description: 'Phòng họp tầng 1 tòa B',
      capacity: 30,
      location: 'Tầng 1, Tòa B',
      building: 'B',
      floor: 1,
      room: 'B101',
      amenities: JSON.stringify(['Máy chiếu', 'Điều hòa'])
    }
  })

  await prisma.culturalCenter.upsert({
    where: { id: 'center-3' },
    update: {},
    create: {
      id: 'center-3',
      name: 'Phòng họp C1',
      description: 'Phòng họp tầng 1 tòa C',
      capacity: 20,
      location: 'Tầng 1, Tòa C',
      building: 'C',
      floor: 1,
      room: 'C101',
      amenities: JSON.stringify(['Máy chiếu'])
    }
  })

  // Tạo lịch đặt mẫu
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  const endTime = new Date(tomorrow)
  endTime.setHours(11, 0, 0, 0)

  await prisma.culturalCenterBooking.upsert({
    where: { id: 'booking-1' },
    update: {},
    create: {
      id: 'booking-1',
      title: 'Họp tổ dân phố',
      description: 'Cuộc họp định kỳ tổ dân phố',
      startTime: tomorrow,
      endTime: endTime,
      visibility: 'PUBLIC',
      status: 'APPROVED',
      culturalCenterId: 'center-1',
      userId: user.id
    }
  })

  // Tạo yêu cầu mẫu
  await prisma.request.upsert({
    where: { id: 'request-1' },
    update: {},
    create: {
      id: 'request-1',
      type: 'HOUSEHOLD_UPDATE',
      description: 'Cập nhật địa chỉ hộ khẩu',
      data: JSON.stringify({
        oldAddress: '123 Đường ABC cũ',
        newAddress: '123 Đường ABC mới'
      }),
      userId: user.id,
      householdId: household1.id
    }
  })

  console.log('✅ Dữ liệu mẫu đã được tạo thành công!')
  console.log('👤 Admin: admin@example.com / admin123')
  console.log('👤 User: user@example.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi tạo dữ liệu mẫu:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
