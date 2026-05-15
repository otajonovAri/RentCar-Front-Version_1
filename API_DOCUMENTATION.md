# RentCar API — Frontend Qo'llanmasi

> **Base URL:** `https://localhost:7101`  
> **Swagger UI:** `https://localhost:7101` (root URL)  
> **Auth:** JWT Bearer — barcha `🔒` belgilangan endpointlarga `Authorization: Bearer <token>` sarlavhasi kerak

---

## Umumiy qoidalar

### Autentifikatsiya
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Rolllar (Role hierarchy)
| Role | Qiymat | Huquq |
|------|--------|-------|
| `Customer` | 1 | Ijara olish, rezervatsiya |
| `Owner` | 2 | CarListing, o'z mashinalari |
| `Manager` | 3 | Ijaralarni boshqarish |
| `Admin` | 4 | To'liq boshqaruv |
| `SuperAdmin` | 5 | Hamma narsani boshqarish |

### Muvaffaqiyatli javob formati
```json
{ ...ma'lumotlar... }
```

### Xato javob formati (barcha xatolar)
```json
{
  "status": 400,
  "title": "Validation Error",
  "errors": {
    "Email": ["Email formati noto'g'ri."],
    "Password": ["Parol kamida 6 ta belgidan iborat bo'lishi kerak."]
  }
}
```
```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "User (42) topilmadi."
}
```
```json
{
  "status": 400,
  "title": "Business Rule Error",
  "detail": "Email yoki parol noto'g'ri."
}
```

### Pagination javob formati
```json
{
  "items": [...],
  "totalCount": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

---

## 1. AUTH — Autentifikatsiya

**Base path:** `/api/auth`

---

### POST `/api/auth/register`
Yangi foydalanuvchi ro'yxatdan o'tkazish. Email tasdiqlash xati yuboriladi.

**Request body:**
```json
{
  "firstName": "Jasur",
  "lastName": "Toshmatov",
  "middleName": null,
  "email": "jasur@example.com",
  "password": "Qwerty123!",
  "phoneNumber": "+998901234567",
  "dateOfBirth": "1995-05-15"
}
```

**Response `200`:**
```json
{
  "message": "Ro'yxatdan o'tish muvaffaqiyatli. jasur@example.com manziliga tasdiqlash xati yuborildi.",
  "email": "jasur@example.com"
}
```

> ⚠️ Login qilish uchun avval email tasdiqlanishi kerak!

---

### POST `/api/auth/confirm-email`
Email havolasidan kelgan token bilan tasdiqlash. Muvaffaqiyatda JWT qaytariladi.

**Request body:**
```json
{
  "email": "jasur@example.com",
  "token": "abc123xyz..."
}
```

**Response `200`:** → [AuthResponseDto](#authresponsedto)

---

### POST `/api/auth/resend-confirmation`
Tasdiqlash emailini qayta yuborish.

**Request body:**
```json
{
  "email": "jasur@example.com"
}
```

**Response `204`:** *(body yo'q)*

---

### POST `/api/auth/login`
Login. JWT + RefreshToken qaytariladi.

**Request body:**
```json
{
  "email": "jasur@example.com",
  "password": "Qwerty123!"
}
```

**Response `200`:** → [AuthResponseDto](#authresponsedto)

---

### POST `/api/auth/refresh-token`
Access token yangilash (muddati tugaganda).

**Request body:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "dGhpcyBpcyBh..."
}
```

**Response `200`:** → [AuthResponseDto](#authresponsedto)

---

### GET `/api/auth/me` 🔒
Joriy login bo'lgan foydalanuvchi ma'lumotlari.

**Response `200`:** → [UserDto](#userdto)

---

#### AuthResponseDto
```json
{
  "userId": 1,
  "fullName": "Jasur Toshmatov",
  "email": "jasur@example.com",
  "role": "Customer",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "accessTokenExpiry": "2026-05-04T10:30:00Z"
}
```

---

## 2. USERS — Foydalanuvchilar

**Base path:** `/api/users`  
**Auth:** 🔒 Kerak

---

### GET `/api/users` 🔒 `Admin, SuperAdmin`
Foydalanuvchilar ro'yxati (pagination + search + role filter).

**Query params:**
| Param | Type | Default | Izoh |
|-------|------|---------|------|
| `page` | int | 1 | Sahifa raqami |
| `pageSize` | int | 20 | Sahifadagi elementlar soni |
| `search` | string | — | Ism, familya, email, telefon bo'yicha qidirish |
| `role` | string | — | `Customer`, `Owner`, `Manager`, `Admin`, `SuperAdmin` |

**Response `200`:** → Pagination<[UserDto](#userdto)>

---

### GET `/api/users/{id}` 🔒
Foydalanuvchi ma'lumotlari ID bo'yicha.

**Response `200`:** → [UserDto](#userdto)

---

### PUT `/api/users/{userId}/profile` 🔒
Profil ma'lumotlarini yangilash.

**Request body:**
```json
{
  "firstName": "Jasur",
  "lastName": "Toshmatov",
  "middleName": null,
  "phoneNumber": "+998901234567",
  "address": "Toshkent, Yunusobod",
  "dateOfBirth": "1995-05-15"
}
```

**Response `204`:** *(body yo'q)*

---

### PUT `/api/users/{userId}/license` 🔒
Haydovchilik guvohnomasi ma'lumotlarini yangilash.

**Request body:**
```json
{
  "licenseNumber": "AA1234567",
  "licenseExpirationDate": "2028-12-31",
  "driverLicenseImageUrl": "https://cdn.example.com/license.jpg"
}
```

**Response `204`:** *(body yo'q)*

---

### PATCH `/api/users/{userId}/role` 🔒 `Admin, SuperAdmin`
Foydalanuvchi rolini o'zgartirish.

**Request body:**
```json
{
  "role": "Manager"
}
```
> Qiymatlar: `Customer` | `Owner` | `Manager` | `Admin` | `SuperAdmin`

**Response `204`:** *(body yo'q)*

---

#### UserDto
```json
{
  "id": 1,
  "fullName": "Jasur Toshmatov",
  "email": "jasur@example.com",
  "phoneNumber": "+998901234567",
  "role": "Customer",
  "dateOfBirth": "1995-05-15",
  "address": "Toshkent, Yunusobod",
  "licenseNumber": "AA1234567",
  "emailConfirmed": true,
  "lastActive": "2026-05-04T08:00:00Z",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

## 3. LOOKUPS — Ro'yxatlar (selectbox uchun)

**Base path:** `/api/lookups`  
**Auth:** Kerak emas

---

### GET `/api/lookups/brands`
Avtomobil brendlari.

**Response:**
```json
[
  { "id": 1, "name": "Toyota" },
  { "id": 2, "name": "Chevrolet" }
]
```

---

### GET `/api/lookups/models?brandId=1`
Brand bo'yicha modellar.

**Query:** `brandId` (int, majburiy)

**Response:** `[{ "id": 1, "name": "Camry" }, ...]`

---

### GET `/api/lookups/categories`
Mashina kategoriyalari (SUV, Sedan, ...).

**Response:** `[{ "id": 1, "name": "Sedan" }, ...]`

---

### GET `/api/lookups/fuel-types`
Yoqilg'i turlari.

**Response:** `[{ "id": 1, "name": "Benzin" }, ...]`

---

### GET `/api/lookups/car-features`
Mashina qo'shimcha xususiyatlari (konditsioner, ...).

**Response:** `[{ "id": 1, "name": "Konditsioner" }, ...]`

---

### GET `/api/lookups/regions`
Viloyatlar ro'yxati.

**Response:** `[{ "id": 1, "name": "Toshkent" }, ...]`

---

### GET `/api/lookups/cities?regionId=1`
Viloyat bo'yicha shaharlar.

**Query:** `regionId` (int, majburiy)

**Response:** `[{ "id": 1, "name": "Toshkent shahri" }, ...]`

---

### GET `/api/lookups/rental-addons`
Ijara qo'shimchalari (GPS, bolalar o'rindig'i va boshqalar).

**Response:**
```json
[
  { "id": 1, "name": "GPS Navigator", "dailyPrice": 15000.00, "description": "Navigatsiya qurilmasi" }
]
```

---

## 4. CARS — Mashinalar

**Base path:** `/api/cars`

---

### GET `/api/cars`
Mashinalar ro'yxati (filter + pagination).

**Query params:**
| Param | Type | Default | Izoh |
|-------|------|---------|------|
| `page` | int | 1 | |
| `pageSize` | int | 20 | |
| `brandId` | int | — | Brend bo'yicha filter |
| `categoryId` | int | — | Kategoriya bo'yicha |
| `branchId` | int | — | Filial bo'yicha |
| `minDailyRate` | decimal | — | Minimal kunlik narx |
| `maxDailyRate` | decimal | — | Maksimal kunlik narx |
| `status` | string | — | `Available`, `Rented`, `Maintenance`, `Reserved` |

**Response `200`:** → Pagination<CarListItemDto>

```json
{
  "items": [
    {
      "id": 1,
      "brand": "Toyota",
      "model": "Camry",
      "year": 2022,
      "licensePlate": "01A123BC",
      "color": "Oq",
      "dailyRate": 250000.00,
      "status": "Available",
      "categoryName": "Sedan",
      "branchName": "Toshkent Markaz",
      "mainImageUrl": "https://cdn.example.com/car1.jpg",
      "seatCount": 5,
      "transmissionType": "Automatic"
    }
  ],
  "totalCount": 50,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

---

### GET `/api/cars/{id}`
Mashina to'liq ma'lumotlari.

**Response `200`:** → CarDetailDto
```json
{
  "id": 1,
  "brand": "Toyota",
  "model": "Camry",
  "year": 2022,
  "licensePlate": "01A123BC",
  "color": "Oq",
  "mileage": 45000,
  "dailyRate": 250000.00,
  "seatCount": 5,
  "description": "Yaxshi holat, konditsioner bor",
  "status": "Available",
  "transmissionType": "Automatic",
  "fuelTypeName": "Benzin",
  "categoryName": "Sedan",
  "branchName": "Toshkent Markaz",
  "features": ["Konditsioner", "GPS"],
  "images": [
    { "id": 1, "url": "https://cdn.example.com/car1.jpg", "isMain": true, "displayOrder": 0 }
  ]
}
```

---

### POST `/api/cars` 🔒 `Admin, SuperAdmin, Manager`
Yangi mashina qo'shish.

**Request body:**
```json
{
  "brandId": 1,
  "carModelId": 2,
  "categoryId": 1,
  "fuelTypeId": 1,
  "branchId": 1,
  "year": 2022,
  "licensePlate": "01A123BC",
  "color": "Oq",
  "seatCount": 5,
  "mileage": 0,
  "transmissionType": "Automatic",
  "dailyRate": 250000.00,
  "description": "Yangi mashina",
  "featureIds": [1, 2]
}
```
> `transmissionType` qiymatlari: `Manual` | `Automatic` | `SemiAutomatic`

**Response `201`:** `{ "id": 5 }`

---

### PUT `/api/cars/{id}` 🔒 `Admin, SuperAdmin, Manager`
Mashina ma'lumotlarini yangilash.

**Request body:**
```json
{
  "color": "Qora",
  "mileage": 50000,
  "dailyRate": 270000.00,
  "description": "Yangilangan tavsif",
  "branchId": 2
}
```

**Response `204`:** *(body yo'q)*

---

### GET `/api/cars/{id}/images`
Mashina rasmlari ro'yxati.

**Response `200`:**
```json
[
  { "id": 1, "carId": 1, "url": "https://...", "isMain": true, "displayOrder": 0, "altText": "Old ko'rinish" }
]
```

---

### POST `/api/cars/{id}/images` 🔒 `Admin, SuperAdmin, Manager, Owner`
Mashina rasmi qo'shish.

**Request body:**
```json
{
  "url": "https://cdn.example.com/car1_front.jpg",
  "isMain": false,
  "displayOrder": 1,
  "altText": "Old ko'rinish"
}
```

**Response `201`:** `{ "id": 3 }`

---

### PATCH `/api/cars/{id}/images/{imageId}/set-main` 🔒 `Admin, SuperAdmin, Manager, Owner`
Asosiy rasmni belgilash.

**Response `204`:** *(body yo'q)*

---

### DELETE `/api/cars/{id}/images/{imageId}` 🔒 `Admin, SuperAdmin, Manager, Owner`
Mashina rasmini o'chirish.

**Response `204`:** *(body yo'q)*

---

## 5. BRANCHES — Filiallar

**Base path:** `/api/branches`

---

### GET `/api/branches`
Filiallar ro'yxati.

**Query:** `cityId` (int, ixtiyoriy)

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Toshkent Markaz",
    "address": "Amir Temur ko'chasi, 1",
    "phoneNumber": "+998712345678",
    "cityName": "Toshkent shahri",
    "regionName": "Toshkent viloyati",
    "carCount": 12
  }
]
```

---

### GET `/api/branches/{id}`
Filial ma'lumotlari.

**Response `200`:** → BranchDto (yuqoridagi kabi)

---

### POST `/api/branches` 🔒 `Admin, SuperAdmin`
Yangi filial yaratish.

**Request body:**
```json
{
  "name": "Samarqand Filial",
  "address": "Registon ko'chasi, 5",
  "phoneNumber": "+998662345678",
  "email": "samarkand@rentcar.uz",
  "cityId": 3,
  "latitude": 39.654522,
  "longitude": 66.975505
}
```

**Response `201`:** `{ "id": 3 }`

---

### PUT `/api/branches/{id}` 🔒 `Admin, SuperAdmin`
Filial ma'lumotlarini yangilash.

**Request body:**
```json
{
  "name": "Samarqand Filial (Yangi)",
  "address": "Yangi manzil, 10",
  "phoneNumber": "+998662345679",
  "email": "samarkand-new@rentcar.uz",
  "latitude": 39.654522,
  "longitude": 66.975505
}
```

**Response `204`:** *(body yo'q)*

---

## 6. DRIVERS — Haydovchilar

**Base path:** `/api/drivers`  
**Auth:** 🔒 Kerak

---

### GET `/api/drivers`
Haydovchilar ro'yxati.

**Query:** `branchId` (int, ixtiyoriy)

**Response `200`:**
```json
[
  {
    "id": 1,
    "fullName": "Akbar Raximov",
    "phoneNumber": "+998901234567",
    "dailyRate": 100000.00,
    "branchName": "Toshkent Markaz"
  }
]
```

---

### GET `/api/drivers/{id}`
Haydovchi to'liq ma'lumotlari.

**Response `200`:**
```json
{
  "id": 1,
  "fullName": "Akbar Raximov",
  "phoneNumber": "+998901234567",
  "licenseNumber": "AB1234567",
  "licenseExpirationDate": "2028-01-01",
  "dailyRate": 100000.00,
  "photoUrl": "https://cdn.example.com/driver1.jpg",
  "branchName": "Toshkent Markaz",
  "hasLinkedUser": false
}
```

---

### POST `/api/drivers` 🔒 `Admin, SuperAdmin, Manager`
Yangi haydovchi qo'shish.

**Request body:**
```json
{
  "firstName": "Akbar",
  "lastName": "Raximov",
  "phoneNumber": "+998901234567",
  "licenseNumber": "AB1234567",
  "licenseExpirationDate": "2028-01-01",
  "dailyRate": 100000.00,
  "branchId": 1,
  "userId": null,
  "photoUrl": null,
  "notes": null
}
```

**Response `201`:** `{ "id": 3 }`

---

### PUT `/api/drivers/{id}` 🔒 `Admin, SuperAdmin, Manager`
Haydovchi ma'lumotlarini yangilash.

**Request body:**
```json
{
  "firstName": "Akbar",
  "lastName": "Raximov",
  "phoneNumber": "+998901234568",
  "dailyRate": 120000.00,
  "branchId": 2
}
```

**Response `204`:** *(body yo'q)*

---

## 7. RESERVATIONS — Rezervatsiyalar

**Base path:** `/api/reservations`  
**Auth:** 🔒 Kerak

---

### GET `/api/reservations`
Rezervatsiyalar ro'yxati.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `page` | int | |
| `pageSize` | int | |
| `userId` | int | Foydalanuvchi bo'yicha filter |
| `status` | string | `Pending`, `Confirmed`, `Cancelled`, `Completed` |

**Response `200`:** → Pagination<ReservationDto>
```json
{
  "items": [
    {
      "id": 1,
      "customerName": "Jasur Toshmatov",
      "carBrand": "Toyota",
      "carModel": "Camry",
      "licensePlate": "01A123BC",
      "startDate": "2026-05-10",
      "endDate": "2026-05-15",
      "totalDays": 5,
      "estimatedAmount": 1250000.00,
      "status": "Pending",
      "pickupBranch": "Toshkent Markaz",
      "returnBranch": null,
      "driverName": null,
      "createdAt": "2026-05-04T10:00:00Z"
    }
  ]
}
```

---

### POST `/api/reservations`
Yangi rezervatsiya yaratish.

**Request body:**
```json
{
  "carId": 1,
  "userId": 5,
  "startDate": "2026-05-10",
  "endDate": "2026-05-15",
  "pickupBranchId": 1,
  "returnBranchId": null,
  "driverId": null,
  "notes": null
}
```

**Response `201`:** `{ "id": 10 }`

---

### PATCH `/api/reservations/{id}/cancel` 🔒
Rezervatsiyani bekor qilish.

**Request body:**
```json
{
  "reason": "Rejalar o'zgardi"
}
```

**Response `204`:** *(body yo'q)*

---

## 8. RENTALS — Ijaralar

**Base path:** `/api/rentals`  
**Auth:** 🔒 Kerak

---

### GET `/api/rentals`
Ijaralar ro'yxati.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `page` | int | |
| `pageSize` | int | |
| `userId` | int | Foydalanuvchi bo'yicha |
| `carId` | int | Mashina bo'yicha |
| `status` | string | `Pending`, `Active`, `Completed`, `Cancelled` |
| `fromDate` | datetime | Boshlanish sanadan |
| `toDate` | datetime | Tugash sanagacha |

**Response `200`:** → Pagination<RentalDto>
```json
{
  "items": [
    {
      "id": 1,
      "customerName": "Jasur Toshmatov",
      "carBrand": "Toyota",
      "carModel": "Camry",
      "licensePlate": "01A123BC",
      "startDate": "2026-05-10T00:00:00Z",
      "endDate": "2026-05-15T00:00:00Z",
      "actualReturnDate": null,
      "totalDays": 5,
      "baseAmount": 1250000.00,
      "addonAmount": 75000.00,
      "discountAmount": 0.00,
      "totalAmount": 1325000.00,
      "status": "Pending",
      "pickupBranch": "Toshkent Markaz",
      "returnBranch": null,
      "driverName": null,
      "promotionCode": null,
      "createdAt": "2026-05-04T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/rentals/{id}`
Ijara to'liq ma'lumotlari.

**Response `200`:** → RentalDto (yuqoridagi kabi)

---

### POST `/api/rentals`
Yangi ijara yaratish.

**Request body:**
```json
{
  "carId": 1,
  "userId": 5,
  "startDate": "2026-05-10",
  "endDate": "2026-05-15",
  "pickupBranchId": 1,
  "returnBranchId": null,
  "driverId": null,
  "promotionCode": "SUMMER10",
  "addonIds": [1, 2],
  "notes": null
}
```

**Response `201`:** `{ "id": 7 }`

---

### PATCH `/api/rentals/{id}/activate` 🔒 `Admin, SuperAdmin, Manager`
Ijarani faollashtirish — mashina mijozga topshirildi (Pending → Active).

**Response `204`:** *(body yo'q)*

---

### PATCH `/api/rentals/{id}/complete` 🔒 `Admin, SuperAdmin, Manager`
Ijarani yakunlash — mashina qaytarildi (Active → Completed).

**Request body:**
```json
{
  "actualReturnDate": "2026-05-15T14:30:00Z",
  "notes": "Mashina yaxshi holatda qaytarildi"
}
```

**Response `204`:** *(body yo'q)*

---

### PATCH `/api/rentals/{id}/cancel` 🔒
Ijarani bekor qilish.

**Request body:**
```json
{
  "reason": "Mijoz rad etdi"
}
```

**Response `204`:** *(body yo'q)*

---

## 9. PAYMENTS — To'lovlar

**Base path:** `/api/payments`  
**Auth:** 🔒 Kerak

---

### GET `/api/payments/by-rental/{rentalId}`
Ijara uchun to'lov ma'lumotlari.

**Response `200`:**
```json
{
  "id": 1,
  "rentalId": 7,
  "amount": 1325000.00,
  "method": "Cash",
  "status": "Paid",
  "transactionId": "TXN20260504001",
  "createdAt": "2026-05-04T11:00:00Z"
}
```
> `null` qaytsa — to'lov hali amalga oshirilmagan (404 qaytadi)

---

### POST `/api/payments`
To'lov amalga oshirish.

**Request body:**
```json
{
  "rentalId": 7,
  "method": "Card",
  "transactionId": "TXN20260504001"
}
```
> `method` qiymatlari: `Cash` | `Card` | `BankTransfer` | `Online`

**Response `201`:** `{ "id": 5 }`

---

## 10. INSPECTIONS — Texnik ko'riklar

**Base path:** `/api/inspections`  
**Auth:** 🔒 `Admin, SuperAdmin, Manager`

---

### GET `/api/inspections`
Ko'riklar ro'yxati.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `rentalId` | int | Ijara bo'yicha |
| `type` | string | `PreRental`, `PostRental`, `Periodic` |
| `page` | int | |
| `pageSize` | int | |

**Response `200`:** → Pagination<InspectionDto>
```json
{
  "items": [
    {
      "id": 1,
      "rentalId": 7,
      "type": "PreRental",
      "inspectedAt": "2026-05-10T09:00:00Z",
      "fuelLevelPercent": 80,
      "mileageAtInspection": 45000,
      "exteriorCondition": "A'lo",
      "interiorCondition": "Yaxshi",
      "hasDamage": false,
      "notes": null,
      "inspectedBy": "Sardor Karimov"
    }
  ]
}
```

---

### POST `/api/inspections`
Yangi texnik ko'rik yaratish.

**Request body:**
```json
{
  "rentalId": 7,
  "inspectedByUserId": 3,
  "type": "PreRental",
  "fuelLevelPercent": 80,
  "mileageAtInspection": 45000,
  "exteriorCondition": "A'lo",
  "interiorCondition": "Yaxshi",
  "hasDamage": false,
  "notes": null
}
```
> `type` qiymatlari: `PreRental` | `PostRental` | `Periodic` | `Damage`

**Response `201`:** `{ "id": 3 }`

---

## 11. FINES — Jarimalar

**Base path:** `/api/fines`  
**Auth:** 🔒 Kerak

---

### GET `/api/fines`
Jarimalar ro'yxati.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `rentalId` | int | Ijara bo'yicha |
| `status` | string | `Pending`, `Paid`, `Cancelled` |
| `page` | int | |
| `pageSize` | int | |

**Response `200`:** → Pagination<FineDto>
```json
{
  "items": [
    {
      "id": 1,
      "rentalId": 7,
      "customerName": "Jasur Toshmatov",
      "description": "Kechiktirilgan qaytarish",
      "amount": 50000.00,
      "status": "Pending",
      "issuedDate": "2026-05-16T10:00:00Z",
      "paidDate": null,
      "issuedBy": "Sardor Karimov",
      "notes": null
    }
  ]
}
```

---

### POST `/api/fines` 🔒 `Admin, SuperAdmin, Manager`
Yangi jarima yaratish.

**Request body:**
```json
{
  "rentalId": 7,
  "issuedByUserId": 3,
  "description": "Kechiktirilgan qaytarish — 1 kun",
  "amount": 50000.00,
  "notes": null
}
```

**Response `201`:** `{ "id": 4 }`

---

### PATCH `/api/fines/{id}/pay` 🔒 `Admin, SuperAdmin, Manager`
Jarimani to'langan deb belgilash.

**Response `204`:** *(body yo'q)*

---

## 12. DAMAGE REPORTS — Zarar hisobotlari

**Base path:** `/api/damage-reports`  
**Auth:** 🔒 Kerak

---

### GET `/api/damage-reports`
Zarar hisobotlari ro'yxati.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `inspectionId` | int | Ko'rik bo'yicha |
| `status` | string | `Reported`, `UnderReview`, `Repaired`, `Closed` |
| `page` | int | |
| `pageSize` | int | |

**Response `200`:** → Pagination<DamageReportDto>
```json
{
  "items": [
    {
      "id": 1,
      "inspectionId": 2,
      "description": "Chap eshikda chuqurcha",
      "estimatedRepairCost": 200000.00,
      "actualRepairCost": null,
      "status": "Reported",
      "photoUrls": "[\"https://cdn.example.com/damage1.jpg\"]",
      "repairedDate": null,
      "notes": null,
      "reportedByName": "Sardor Karimov",
      "createdAt": "2026-05-16T10:00:00Z"
    }
  ]
}
```

---

### POST `/api/damage-reports` 🔒 `Admin, SuperAdmin, Manager`
Yangi zarar hisoboti yaratish.

**Request body:**
```json
{
  "inspectionId": 2,
  "reportedByUserId": 3,
  "description": "Chap eshikda chuqurcha",
  "estimatedRepairCost": 200000.00,
  "photoUrls": "[\"https://cdn.example.com/damage1.jpg\"]",
  "notes": null
}
```

**Response `201`:** `{ "id": 5 }`

---

### PATCH `/api/damage-reports/{id}` 🔒 `Admin, SuperAdmin, Manager`
Hisobot statusini yangilash.

**Request body:**
```json
{
  "status": "Repaired",
  "actualRepairCost": 180000.00,
  "notes": "Ustaxonada ta'mirlandi"
}
```
> `status` qiymatlari: `Reported` | `UnderReview` | `Repaired` | `Closed`

**Response `204`:** *(body yo'q)*

---

## 13. MAINTENANCE — Texnik xizmat

**Base path:** `/api/maintenance`  
**Auth:** 🔒 `Admin, SuperAdmin, Manager`

---

### GET `/api/maintenance`
Texnik xizmatlar ro'yxati.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `carId` | int | Mashina bo'yicha |
| `status` | string | `Scheduled`, `InProgress`, `Completed`, `Cancelled` |
| `type` | string | `Routine`, `Repair`, `Emergency`, `Inspection` |
| `page` | int | |
| `pageSize` | int | |

**Response `200`:** → Pagination<MaintenanceDto>
```json
{
  "items": [
    {
      "id": 1,
      "carId": 1,
      "carPlate": "01A123BC",
      "title": "Moy almashtirish",
      "description": null,
      "type": "Routine",
      "status": "Scheduled",
      "scheduledDate": "2026-06-01T09:00:00Z",
      "completedDate": null,
      "cost": 150000.00,
      "mileageAtService": 50000,
      "serviceProvider": "Avto-Servis Markaz",
      "notes": null
    }
  ]
}
```

---

### POST `/api/maintenance`
Yangi texnik xizmat rejalashtirish.

**Request body:**
```json
{
  "carId": 1,
  "title": "Moy almashtirish",
  "description": null,
  "type": "Routine",
  "scheduledDate": "2026-06-01T09:00:00Z",
  "cost": 150000.00,
  "mileageAtService": 50000,
  "serviceProvider": "Avto-Servis Markaz",
  "notes": null
}
```
> `type`: `Routine` | `Repair` | `Emergency` | `Inspection`

**Response `201`:** `{ "id": 4 }`

---

### PATCH `/api/maintenance/{id}/complete` 🔒 `Admin, SuperAdmin, Manager`
Texnik xizmatni yakunlangan deb belgilash.

**Request body:**
```json
{
  "actualCost": 140000.00
}
```

**Response `204`:** *(body yo'q)*

---

## 14. INVOICES — Hisob-fakturalar

**Base path:** `/api/invoices`  
**Auth:** 🔒 Kerak

---

### GET `/api/invoices/by-rental/{rentalId}`
Ijara uchun hisob-faktura olish.

**Response `200`:**
```json
{
  "id": 1,
  "invoiceNumber": "INV-2026-0001",
  "rentalId": 7,
  "issueDate": "2026-05-15T10:00:00Z",
  "dueDate": "2026-05-22T10:00:00Z",
  "subTotal": 1325000.00,
  "taxAmount": 159000.00,
  "totalAmount": 1484000.00,
  "status": "Issued",
  "notes": null
}
```

---

### POST `/api/invoices` 🔒 `Admin, SuperAdmin, Manager`
Hisob-faktura yaratish.

**Request body:**
```json
{
  "rentalId": 7,
  "taxPercent": 12,
  "notes": null
}
```

**Response `201`:** → InvoiceDto (yuqoridagi kabi)

---

## 15. OWNER PAYOUTS — Owner to'lovlari

**Base path:** `/api/owner-payouts`  
**Auth:** 🔒 `Admin, SuperAdmin, Manager`

---

### GET `/api/owner-payouts`
Owner to'lovlari ro'yxati.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `ownerId` | int | Owner bo'yicha |
| `status` | string | `Pending`, `Processing`, `Paid`, `Failed`, `OnHold` |
| `page` | int | |
| `pageSize` | int | |

**Response `200`:** → Pagination<OwnerPayoutDto>
```json
{
  "items": [
    {
      "id": 1,
      "ownerId": 5,
      "ownerName": "Bahrom Yusupov",
      "carId": 1,
      "carPlate": "01A123BC",
      "rentalId": 7,
      "rentalTotalAmount": 1325000.00,
      "ownerRevenuePercent": 70.00,
      "payoutAmount": 927500.00,
      "status": "Pending",
      "paidAt": null,
      "transactionId": null,
      "notes": null,
      "createdAt": "2026-05-15T10:00:00Z"
    }
  ]
}
```

---

### POST `/api/owner-payouts`
Owner to'lovini hisoblash (rental yakunlangandan keyin).

**Request body:**
```json
{
  "rentalId": 7,
  "ownerRevenuePercent": 70.00,
  "notes": null
}
```

**Response `201`:** `{ "id": 3 }`

---

### PATCH `/api/owner-payouts/{id}/mark-paid`
To'lovni amalga oshirilgan deb belgilash.

**Request body:**
```json
{
  "transactionId": "BANK-TXN-2026-001"
}
```

**Response `204`:** *(body yo'q)*

---

## 16. PRICING TIERS — Narxlar jadvali

**Base path:** `/api/pricing-tiers`

---

### GET `/api/pricing-tiers`
Narxlar ro'yxati.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `carId` | int | Mashina bo'yicha |
| `categoryId` | int | Kategoriya bo'yicha |
| `activeOnly` | bool | Faqat amaldagilarni ko'rsatish |

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Haftalik tarif",
    "dailyRate": 220000.00,
    "weeklyRate": 200000.00,
    "monthlyRate": 180000.00,
    "minDays": 7,
    "maxDays": 29,
    "validFrom": "2026-01-01T00:00:00Z",
    "validTo": null,
    "categoryId": 1,
    "categoryName": "Sedan",
    "carId": null,
    "carPlate": null
  }
]
```

---

### POST `/api/pricing-tiers` 🔒 `Admin, SuperAdmin`
Yangi narx qo'shish.

**Request body:**
```json
{
  "name": "Haftalik tarif",
  "dailyRate": 220000.00,
  "weeklyRate": 200000.00,
  "monthlyRate": 180000.00,
  "minDays": 7,
  "maxDays": 29,
  "validFrom": "2026-01-01T00:00:00Z",
  "validTo": null,
  "categoryId": 1,
  "carId": null
}
```
> `categoryId` yoki `carId` dan biri majburiy!

**Response `201`:** `{ "id": 5 }`

---

### PUT `/api/pricing-tiers/{id}` 🔒 `Admin, SuperAdmin`
Narxni yangilash.

**Request body:**
```json
{
  "name": "Haftalik tarif (yangilangan)",
  "dailyRate": 230000.00,
  "weeklyRate": 210000.00,
  "monthlyRate": 190000.00,
  "minDays": 7,
  "maxDays": 29,
  "validFrom": "2026-01-01T00:00:00Z",
  "validTo": null
}
```

**Response `204`:** *(body yo'q)*

---

### DELETE `/api/pricing-tiers/{id}` 🔒 `Admin, SuperAdmin`
Narxni o'chirish.

**Response `204`:** *(body yo'q)*

---

## 17. INSURANCE — Sug'urta

**Base path:** `/api/insurance`  
**Auth:** 🔒 `Admin, SuperAdmin, Manager` (kompaniyalar ro'yxati ochiq)

---

### GET `/api/insurance/companies`
Sug'urta kompaniyalari ro'yxati (autentifikatsiyasiz ham ishlaydi).

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Uzingosurkh",
    "contactPhone": "+998712345678",
    "email": "info@uzingosurkh.uz",
    "website": "https://uzingosurkh.uz",
    "address": "Toshkent, Shayxontohur"
  }
]
```

---

### POST `/api/insurance/companies` 🔒 `Admin, SuperAdmin, Manager`
Yangi sug'urta kompaniyasi qo'shish.

**Request body:**
```json
{
  "name": "Alfa Insurance",
  "contactPhone": "+998712345679",
  "email": "info@alfa.uz",
  "website": "https://alfa.uz",
  "address": "Toshkent"
}
```

**Response `201`:** `{ "id": 2 }`

---

### GET `/api/insurance/policies` 🔒 `Admin, SuperAdmin, Manager`
Sug'urta polislari ro'yxati.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `carId` | int | Mashina bo'yicha |
| `insuranceCompanyId` | int | Kompaniya bo'yicha |
| `activeOnly` | bool | Faqat amaldagilar |

**Response `200`:**
```json
[
  {
    "id": 1,
    "carId": 1,
    "carPlate": "01A123BC",
    "insuranceCompanyId": 1,
    "companyName": "Uzingosurkh",
    "policyNumber": "POL-2026-001",
    "coverageType": "KASKO",
    "premiumAmount": 1200000.00,
    "coverageAmount": 50000000.00,
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "notes": null,
    "isActive": true
  }
]
```

---

### POST `/api/insurance/policies` 🔒 `Admin, SuperAdmin, Manager`
Yangi sug'urta polisi qo'shish.

**Request body:**
```json
{
  "carId": 1,
  "insuranceCompanyId": 1,
  "policyNumber": "POL-2026-001",
  "coverageType": "KASKO",
  "premiumAmount": 1200000.00,
  "coverageAmount": 50000000.00,
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "notes": null
}
```

**Response `201`:** `{ "id": 4 }`

---

## 18. NOTIFICATIONS — Bildirishnomalar

**Base path:** `/api/notifications`  
**Auth:** 🔒 Kerak

---

### GET `/api/notifications`
Foydalanuvchi bildirishnomalari.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `userId` | int | **Majburiy** — foydalanuvchi ID |
| `page` | int | |
| `pageSize` | int | |
| `unreadOnly` | bool | Faqat o'qilmaganlarni ko'rsatish |

**Response `200`:** → Pagination<NotificationDto>
```json
{
  "items": [
    {
      "id": 1,
      "title": "Ijara tasdiqlandi",
      "body": "Sizning ijarangiz #7 tasdiqlandi.",
      "type": "RentalConfirmed",
      "isRead": false,
      "createdAt": "2026-05-04T10:30:00Z"
    }
  ]
}
```

---

### PATCH `/api/notifications/{id}/read` 🔒
Bildirishnomani o'qilgan deb belgilash.

**Response `204`:** *(body yo'q)*

---

### PATCH `/api/notifications/read-all` 🔒
Barcha bildirishnomalarni o'qilgan deb belgilash.

**Response `204`:** *(body yo'q)*

---

## 19. PROMOTIONS — Promokodlar

**Base path:** `/api/promotions`

---

### GET `/api/promotions`
Promokodlar ro'yxati.

**Query:** `activeOnly=true` (bool, ixtiyoriy)

**Response `200`:**
```json
[
  {
    "id": 1,
    "code": "SUMMER10",
    "description": "Yozgi chegirma",
    "discountType": "Percentage",
    "discountValue": 10.00,
    "minRentalAmount": 500000.00,
    "validFrom": "2026-06-01",
    "validTo": "2026-08-31",
    "maxUses": 100,
    "usedCount": 23,
    "isActive": true
  }
]
```
> `discountType`: `Percentage` | `FixedAmount`

---

### GET `/api/promotions/validate/{code}`
Promokodni tekshirish.

**Response `200`:** → PromotionDto (yuqoridagi kabi)  
**Response `404`:** `{ "message": "Promokod yaroqsiz yoki muddati o'tgan." }`

---

### POST `/api/promotions` 🔒 `Admin, SuperAdmin`
Yangi promokod yaratish.

**Request body:**
```json
{
  "code": "SUMMER10",
  "description": "Yozgi chegirma",
  "discountType": "Percentage",
  "discountValue": 10.00,
  "minRentalAmount": 500000.00,
  "validFrom": "2026-06-01",
  "validTo": "2026-08-31",
  "maxUses": 100
}
```

**Response `201`:** `{ "id": 5 }`

---

## 20. CAR LISTINGS — Owner so'rovlari

**Base path:** `/api/car-listings`  
**Auth:** 🔒 Kerak

---

### GET `/api/car-listings`
Listing so'rovlar ro'yxati.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `page` | int | |
| `pageSize` | int | |
| `ownerId` | int | Owner bo'yicha filter |
| `status` | string | `Pending`, `Approved`, `Rejected` |

**Response `200`:** → Pagination<CarListingDto>
```json
{
  "items": [
    {
      "id": 1,
      "ownerName": "Bahrom Yusupov",
      "brand": "Toyota",
      "model": "Camry",
      "year": 2021,
      "licensePlate": "01B456DE",
      "color": "Kumush",
      "requestedDailyRate": 300000.00,
      "ownerRevenuePercent": null,
      "status": "Pending",
      "rejectionReason": null,
      "createdAt": "2026-05-01T09:00:00Z"
    }
  ]
}
```

---

### POST `/api/car-listings`
Owner: mashina ro'yxatdan o'tkazish so'rovi.

**Request body:**
```json
{
  "ownerId": 5,
  "brandId": 1,
  "carModelId": 2,
  "categoryId": 1,
  "fuelTypeId": 1,
  "branchId": 1,
  "year": 2021,
  "licensePlate": "01B456DE",
  "color": "Kumush",
  "seatCount": 5,
  "mileage": 30000,
  "transmissionType": "Automatic",
  "requestedDailyRate": 300000.00,
  "description": "Yaxshi holatda, konditsioner bor"
}
```

**Response `201`:** `{ "id": 8 }`

---

### PATCH `/api/car-listings/{id}/approve` 🔒 `Admin, SuperAdmin`
Admin: so'rovni tasdiqlash va avtomatik mashina yaratish.

**Request body:**
```json
{
  "ownerRevenuePercent": 70.00,
  "approvedDailyRate": 280000.00,
  "adminNotes": "Tasdiqlandi, narx kelishildi"
}
```

**Response `200`:** `{ "carId": 15 }`

> ✅ Owner avtomatik `Owner` roliga o'tkaziladi!

---

### PATCH `/api/car-listings/{id}/reject` 🔒 `Admin, SuperAdmin`
Admin: so'rovni rad etish.

**Request body:**
```json
{
  "rejectionReason": "Mashina yoshi eski, 2010 yildan keski emas"
}
```

**Response `204`:** *(body yo'q)*

---

## 21. CONVERSATIONS — Suhbatlar

**Base path:** `/api/conversations`  
**Auth:** 🔒 Kerak

---

### GET `/api/conversations`
Suhbatlar ro'yxati.

**Query params:**
| Param | Type | Izoh |
|-------|------|------|
| `userId` | int | Foydalanuvchi suhbatlari |
| `rentalId` | int | Ijara bo'yicha |
| `status` | string | `Open`, `Closed` |
| `page` | int | |
| `pageSize` | int | |

**Response `200`:** → Pagination<ConversationDto>
```json
{
  "items": [
    {
      "id": 1,
      "subject": "Ijara #7 haqida savol",
      "status": "Open",
      "rentalId": 7,
      "createdByUserId": 5,
      "createdByName": "Jasur Toshmatov",
      "createdAt": "2026-05-04T10:00:00Z",
      "resolvedAt": null,
      "participantCount": 2,
      "messageCount": 5
    }
  ]
}
```

---

### POST `/api/conversations`
Yangi suhbat boshlash.

**Request body:**
```json
{
  "createdByUserId": 5,
  "subject": "Ijara #7 haqida savol",
  "rentalId": 7,
  "participantUserIds": [5, 3]
}
```

**Response `201`:** `{ "id": 3 }`

---

### GET `/api/conversations/{id}/messages`
Suhbat xabarlarini olish.

**Query:** `page`, `pageSize` (default: 50)

**Response `200`:** → Pagination<MessageDto>
```json
{
  "items": [
    {
      "id": 1,
      "conversationId": 3,
      "senderId": 5,
      "senderName": "Jasur Toshmatov",
      "body": "Salom, mashina qaytarish vaqtini o'zgartirsam bo'ladimi?",
      "status": "Sent",
      "sentAt": "2026-05-04T10:05:00Z",
      "isEdited": false,
      "isDeleted": false
    }
  ]
}
```

---

### POST `/api/conversations/{id}/messages`
Xabar yuborish.

**Request body:**
```json
{
  "senderId": 5,
  "body": "Salom, mashina qaytarish vaqtini o'zgartirsam bo'ladimi?"
}
```

**Response `201`:** → MessageDto (yuqoridagi kabi)

---

### PATCH `/api/conversations/{id}/close` 🔒 `Admin, SuperAdmin, Manager`
Suhbatni yopish.

**Response `204`:** *(body yo'q)*

---

## HTTP Status Kodlari

| Kod | Ma'no |
|-----|-------|
| `200` | Muvaffaqiyatli |
| `201` | Yaratildi |
| `204` | Muvaffaqiyatli (javob yo'q) |
| `400` | Xato ma'lumotlar / Biznes qoidasi buzildi |
| `401` | Token yo'q yoki yaroqsiz |
| `403` | Ruxsat yo'q (rol mos emas) |
| `404` | Ma'lumot topilmadi |
| `422` | Validatsiya xatosi |
| `500` | Server xatosi |

---

## Frontend tipik Flow-lar

### 1. Ro'yxatdan o'tish va login
```
POST /api/auth/register
  → email keladi
  → user emaildagi havolani bosadi
POST /api/auth/confirm-email { email, token }
  → AuthResponseDto (JWT token)
  → localStorage.setItem('token', result.accessToken)
```

### 2. Mashina ijara olish
```
GET /api/lookups/brands          → brandlar
GET /api/lookups/models?brandId  → modellar
GET /api/cars?status=Available   → mavjud mashinalar
POST /api/reservations           → rezervatsiya qilish
POST /api/rentals                → ijara yaratish
POST /api/payments               → to'lov
```

### 3. Owner mashina qo'shish
```
POST /api/car-listings           → so'rov yuborish
  (Admin tasdiqlashi kutiladi)
PATCH /api/car-listings/{id}/approve  → Admin tomonidan
  → Owner roli avtomatik beriladi
  → Mashina yaratiladi
```

### 4. Token yangilash (axios interceptor)
```js
// 401 response kelganda
POST /api/auth/refresh-token { accessToken, refreshToken }
  → yangi tokenlar
  → so'rovni qayta yuborish
```

---

## Enum qiymatlari (to'liq ro'yxat)

| Enum | Qiymatlar |
|------|-----------|
| `UserRole` | `Customer`, `Owner`, `Manager`, `Admin`, `SuperAdmin` |
| `CarStatus` | `Available`, `Rented`, `Maintenance`, `Reserved`, `Inactive` |
| `RentalStatus` | `Pending`, `Active`, `Completed`, `Cancelled` |
| `ReservationStatus` | `Pending`, `Confirmed`, `Cancelled`, `Completed` |
| `PaymentStatus` | `Pending`, `Paid`, `Failed`, `Refunded` |
| `PaymentMethod` | `Cash`, `Card`, `BankTransfer`, `Online` |
| `FineStatus` | `Pending`, `Paid`, `Cancelled` |
| `InspectionType` | `PreRental`, `PostRental`, `Periodic`, `Damage` |
| `DamageStatus` | `Reported`, `UnderReview`, `Repaired`, `Closed` |
| `MaintenanceType` | `Routine`, `Repair`, `Emergency`, `Inspection` |
| `MaintenanceStatus` | `Scheduled`, `InProgress`, `Completed`, `Cancelled` |
| `InvoiceStatus` | `Draft`, `Issued`, `Paid`, `Overdue`, `Voided` |
| `OwnerPayoutStatus` | `Pending`, `Processing`, `Paid`, `Failed`, `OnHold` |
| `CarListingStatus` | `Pending`, `Approved`, `Rejected` |
| `TransmissionType` | `Manual`, `Automatic`, `SemiAutomatic` |
| `DiscountType` | `Percentage`, `FixedAmount` |
| `ConversationStatus` | `Open`, `Closed` |
| `MessageStatus` | `Sent`, `Delivered`, `Read` |
| `NotificationType` | `RentalConfirmed`, `PaymentReceived`, `FineIssued`, `General`, ... |
