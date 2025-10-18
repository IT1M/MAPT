# دليل تكامل قاعدة البيانات - شرح مفصل خطوة بخطوة

## 📋 جدول المحتويات
1. [معلومات تسجيل الدخول للأدمن](#معلومات-تسجيل-الدخول-للأدمن)
2. [نظرة عامة على البنية](#نظرة-عامة-على-البنية)
3. [إعداد قاعدة البيانات](#إعداد-قاعدة-البيانات)
4. [شرح تكامل Prisma](#شرح-تكامل-prisma)
5. [نظام المصادقة (Authentication)](#نظام-المصادقة)
6. [تدفق البيانات](#تدفق-البيانات)
7. [الأمثلة العملية](#الأمثلة-العملية)

---

## 🔐 معلومات تسجيل الدخول للأدمن

### حسابات المستخدمين الافتراضية

بعد تشغيل أمر `npm run db:seed`، سيتم إنشاء 5 حسابات مستخدمين:

#### 1. حساب الأدمن (المدير العام)
```
البريد الإلكتروني: admin@mais.sa
كلمة المرور: Password123!
الصلاحيات: ج 
# إنشاء مستخدم جديد (اختياري)
CREATE USER mais_user WITH PASSWORD 'your_secure_password';

# منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE medical_inventory TO mais_user;

# الخروج
\q
```

### الخطوة 3: تكوين ملف .env

قم بتحديث ملف `.env` في جذر المشروع:

```env
# اتصال قاعدة البيانات
DATABASE_URL="postgresql://username:password@localhost:5432/medical_inventory?schema=public"

# مثال:
# DATABASE_URL="postgresql://mais_user:your_secure_password@localhost:5432/medical_inventory?schema=public"

# مفتاح NextAuth (مطلوب)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# مفتاح Gemini AI (مطلوب)
GEMINI_API_KEY="your-gemini-api-key"

# البيئة
NODE_ENV="development"
```

### الخطوة 4: تشغيل الترحيلات (Migrations)

```bash
# توليد عميل Prisma
npm run db:generate

# تطبيق الترحيلات على قاعدة البيانات
npm run db:push

# أو استخدام الترحيلات مع التاريخ
npm run db:migrate

# ملء قاعدة البيانات بالبيانات الأولية
npm run db:seed
```

---

## 🔗 شرح تكامل Prisma

### ما هو Prisma؟

Prisma هو ORM (Object-Relational Mapping) حديث يسهل التعامل مع قاعدة البيانات من خلال:
- كتابة استعلامات آمنة من الأنواع (Type-safe)
- إدارة الترحيلات تلقائياً
- توليد عميل قاعدة البيانات

### كيف يعمل Prisma في المشروع؟

#### 1. ملف Schema (prisma/schema.prisma)

هذا الملف يحدد:
- نوع قاعدة البيانات (PostgreSQL)
- الجداول (Models)
- العلاقات بين الجداول
- الفهارس (Indexes)

```prisma
// مثال: جدول المستخدمين
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String
  passwordHash String
  role         UserRole
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  // العلاقات
  inventoryItems InventoryItem[]
  auditLogs      AuditLog[]
  
  @@index([email])
  @@map("users")
}
```

**الشرح:**
- `@id`: المفتاح الأساسي
- `@unique`: قيمة فريدة (لا يمكن تكرارها)
- `@default`: القيمة الافتراضية
- `@@index`: فهرس لتسريع البحث
- `@@map`: اسم الجدول في قاعدة البيانات

#### 2. عميل Prisma (src/services/prisma.ts)

```typescript
import { PrismaClient } from '@prisma/client'

// إنشاء نسخة واحدة من Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**الشرح:**
- يتم إنشاء نسخة واحدة فقط من `PrismaClient` لتجنب استهلاك الموارد
- في التطوير، يتم حفظ النسخة في `global` لتجنب إعادة الإنشاء عند Hot Reload
- يتم تسجيل الاستعلامات والأخطاء للمساعدة في التطوير

#### 3. استخدام Prisma في الكود

```typescript
import { prisma } from '@/services/prisma'

// مثال 1: جلب جميع المستخدمين
const users = await prisma.user.findMany()

// مثال 2: جلب مستخدم واحد بالبريد الإلكتروني
const user = await prisma.user.findUnique({
  where: { email: 'admin@mais.sa' }
})

// مثال 3: إنشاء مستخدم جديد
const newUser = await prisma.user.create({
  data: {
    email: 'newuser@mais.sa',
    name: 'New User',
    passwordHash: hashedPassword,
    role: 'DATA_ENTRY'
  }
})

// مثال 4: تحديث مستخدم
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { name: 'Updated Name' }
})

// مثال 5: حذف مستخدم
await prisma.user.delete({
  where: { id: userId }
})

// مثال 6: استعلام معقد مع علاقات
const userWithItems = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    inventoryItems: true,
    auditLogs: {
      take: 10,
      orderBy: { timestamp: 'desc' }
    }
  }
})
```

---

## 🔐 نظام المصادقة (Authentication)

### كيف يعمل نظام تسجيل الدخول؟

#### 1. المستخدم يدخل البريد الإلكتروني وكلمة المرور

```typescript
// src/app/[locale]/login/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // محاولة تسجيل الدخول
  const result = await signIn('credentials', {
    email: formData.email,
    password: formData.password,
    redirect: false,
  })
  
  if (result?.ok) {
    // نجح تسجيل الدخول - الانتقال إلى Dashboard
    router.push(`/${locale}/dashboard`)
  } else {
    // فشل تسجيل الدخول - عرض رسالة خطأ
    toast.error('خطأ في معلومات الدخول')
  }
}
```

#### 2. NextAuth يتحقق من البيانات

```typescript
// src/services/auth.ts
async authorize(credentials) {
  // 1. البحث عن المستخدم في قاعدة البيانات
  const user = await prisma.user.findUnique({
    where: { email: credentials.email }
  })
  
  if (!user) {
    return null // المستخدم غير موجود
  }
  
  // 2. التحقق من كلمة المرور
  const isPasswordValid = await compare(
    credentials.password,
    user.passwordHash
  )
  
  if (!isPasswordValid) {
    return null // كلمة المرور خاطئة
  }
  
  // 3. إرجاع بيانات المستخدم (بدون كلمة المرور)
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
```

#### 3. إنشاء الجلسة (Session)

```typescript
// يتم إنشاء JWT Token يحتوي على:
{
  id: "user_id",
  email: "admin@mais.sa",
  name: "Administrator",
  role: "ADMIN",
  permissions: ["inventory:read", "inventory:write", ...]
}
```

#### 4. حماية الصفحات

```typescript
// src/app/[locale]/dashboard/page.tsx
export default async function DashboardPage() {
  // التحقق من الجلسة
  const session = await auth()
  
  if (!session) {
    // المستخدم غير مسجل - إعادة التوجيه لصفحة تسجيل الدخول
    redirect('/login')
  }
  
  // المستخدم مسجل - عرض المحتوى
  return <div>Welcome {session.user.name}</div>
}
```

### نظام الصلاحيات (Permissions)

```typescript
// src/services/auth.ts
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'inventory:read',
    'inventory:write',
    'inventory:delete',
    'reports:view',
    'users:manage',
    'settings:manage',
    'audit:view',
  ],
  DATA_ENTRY: [
    'inventory:read',
    'inventory:write',
  ],
  // ... باقي الأدوار
}
```

**كيفية التحقق من الصلاحيات:**

```typescript
// في أي صفحة أو مكون
const session = await auth()

if (session?.user.permissions.includes('inventory:write')) {
  // المستخدم لديه صلاحية الكتابة
  // عرض زر "إضافة عنصر جديد"
}
```

---

## 🔄 تدفق البيانات

### مثال كامل: إضافة عنصر مخزون جديد

#### 1. المستخدم يملأ النموذج

```typescript
// src/components/forms/DataEntryForm.tsx
const [formData, setFormData] = useState({
  itemName: '',
  batch: '',
  quantity: 0,
  destination: 'MAIS'
})
```

#### 2. إرسال البيانات إلى API

```typescript
const handleSubmit = async () => {
  const response = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
  
  if (response.ok) {
    toast.success('تم إضافة العنصر بنجاح')
  }
}
```

#### 3. API يحفظ البيانات في قاعدة البيانات

```typescript
// src/app/api/inventory/route.ts
export async function POST(request: Request) {
  // 1. التحقق من الجلسة
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. قراءة البيانات
  const data = await request.json()
  
  // 3. حفظ في قاعدة البيانات
  const item = await prisma.inventoryItem.create({
    data: {
      itemName: data.itemName,
      batch: data.batch,
      quantity: data.quantity,
      destination: data.destination,
      enteredById: session.user.id
    }
  })
  
  // 4. تسجيل في سجل التدقيق
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'InventoryItem',
      entityId: item.id,
      newValue: data
    }
  })
  
  // 5. إرجاع النتيجة
  return Response.json(item)
}
```

#### 4. تحديث واجهة المستخدم

```typescript
// يتم تحديث القائمة تلقائياً باستخدام SWR أو إعادة التحميل
router.refresh()
```

---

## 💡 الأمثلة العملية

### مثال 1: جلب جميع عناصر المخزون

```typescript
// في Server Component
const items = await prisma.inventoryItem.findMany({
  where: {
    destination: 'MAIS',
    deletedAt: null // العناصر غير المحذوفة
  },
  include: {
    enteredBy: {
      select: {
        name: true,
        email: true
      }
    }
  },
  orderBy: {
    createdAt: 'desc'
  }
})
```

### مثال 2: البحث في المخزون

```typescript
const searchResults = await prisma.inventoryItem.findMany({
  where: {
    OR: [
      { itemName: { contains: searchTerm, mode: 'insensitive' } },
      { batch: { contains: searchTerm, mode: 'insensitive' } },
      { category: { contains: searchTerm, mode: 'insensitive' } }
    ],
    deletedAt: null
  }
})
```

### مثال 3: إحصائيات Dashboard

```typescript
// عدد العناصر الإجمالي
const totalItems = await prisma.inventoryItem.count({
  where: { deletedAt: null }
})

// العناصر حسب الوجهة
const itemsByDestination = await prisma.inventoryItem.groupBy({
  by: ['destination'],
  _count: true,
  _sum: {
    quantity: true
  }
})

// العناصر المضافة اليوم
const today = new Date()
today.setHours(0, 0, 0, 0)

const todayItems = await prisma.inventoryItem.count({
  where: {
    createdAt: { gte: today }
  }
})
```

### مثال 4: تحديث عنصر مخزون

```typescript
const updatedItem = await prisma.inventoryItem.update({
  where: { id: itemId },
  data: {
    quantity: newQuantity,
    notes: newNotes,
    updatedAt: new Date()
  }
})

// تسجيل التغيير في سجل التدقيق
await prisma.auditLog.create({
  data: {
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'InventoryItem',
    entityId: itemId,
    oldValue: { quantity: oldQuantity },
    newValue: { quantity: newQuantity }
  }
})
```

---

## 🔧 استكشاف الأخطاء

### مشكلة: لا يمكن الاتصال بقاعدة البيانات

```bash
# تحقق من أن PostgreSQL يعمل
# macOS/Linux:
pg_isready

# Windows:
pg_ctl status

# تحقق من DATABASE_URL في .env
echo $DATABASE_URL
```

### مشكلة: خطأ في تسجيل الدخول

1. تحقق من أن البيانات موجودة:
```bash
npm run db:seed
```

2. تحقق من NEXTAUTH_SECRET في .env

3. افتح Prisma Studio للتحقق من البيانات:
```bash
npm run db:studio
```

### مشكلة: الترحيلات لا تعمل

```bash
# إعادة تعيين قاعدة البيانات (تحذير: يحذف جميع البيانات)
npx prisma migrate reset

# إعادة توليد العميل
npm run db:generate

# تطبيق الترحيلات
npm run db:push
```

---

## 📚 موارد إضافية

### الوثائق الرسمية
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

### أوامر مفيدة

```bash
# فتح Prisma Studio (واجهة رسومية لقاعدة البيانات)
npm run db:studio

# التحقق من حالة الترحيلات
npm run migrate:status

# إنشاء نسخة احتياطية من قاعدة البيانات
npm run backup:database

# التحقق من اتصال قاعدة البيانات
npm run test:db
```

---

## ✅ قائمة التحقق للإعداد

- [ ] تثبيت PostgreSQL
- [ ] إنشاء قاعدة البيانات
- [ ] تكوين ملف .env
- [ ] تشغيل `npm install`
- [ ] تشغيل `npm run db:generate`
- [ ] تشغيل `npm run db:push`
- [ ] تشغيل `npm run db:seed`
- [ ] تشغيل `npm run dev`
- [ ] تسجيل الدخول باستخدام admin@mais.sa / Password123!
- [ ] التحقق من Dashboard

---

## 🎯 الخلاصة

هذا النظام يستخدم:
1. **PostgreSQL** كقاعدة بيانات
2. **Prisma** كـ ORM للتعامل مع قاعدة البيانات
3. **NextAuth** للمصادقة والجلسات
4. **bcrypt** لتشفير كلمات المرور
5. **Next.js App Router** للصفحات والـ API

التدفق الكامل:
```
المستخدم → صفحة Login → NextAuth → Prisma → PostgreSQL
                ↓
            Dashboard ← Session ← JWT Token
```

جميع البيانات محمية ومشفرة، وكل عملية مسجلة في سجل التدقيق (Audit Log).
