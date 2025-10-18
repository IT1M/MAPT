# مخطط تدفق البيانات والاتصال 🔄

## 1. هيكل النظام الكامل

```
┌─────────────────────────────────────────────────────────────────┐
│                         المستخدم (User)                         │
│                    المتصفح (Browser)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Login Page   │  │  Dashboard   │  │  Forms       │          │
│  │ /login       │  │ /dashboard   │  │ /inventory   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /api/auth    │  │ /api/inventory│ │ /api/reports │          │
│  │ NextAuth     │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Services Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ auth.ts      │  │ prisma.ts    │  │ audit.ts     │          │
│  │ (NextAuth)   │  │ (ORM Client) │  │ (Logging)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Prisma ORM                                    │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  Prisma Client (Auto-generated)                      │       │
│  │  - Type-safe queries                                 │       │
│  │  - Connection pooling                                │       │
│  │  - Query optimization                                │       │
│  └──────────────────────────────────────────────────────┘       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ users        │  │ inventory    │  │ audit_logs   │          │
│  │ sessions     │  │ transactions │  │ reports      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. تدفق تسجيل الدخول (Login Flow)

```
┌──────────────┐
│ المستخدم     │
│ يدخل البيانات│
└──────┬───────┘
       │ email: admin@mais.sa
       │ password: Password123!
       ▼
┌──────────────────────────────────────┐
│ Login Page                           │
│ src/app/[locale]/login/page.tsx      │
│                                      │
│ 1. التحقق من صحة البيانات (Zod)     │
│ 2. استدعاء signIn()                 │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ NextAuth Handler                     │
│ src/services/auth.ts                 │
│                                      │
│ 1. استقبال البيانات                 │
│ 2. استدعاء authorize()              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Prisma Query                         │
│                                      │
│ const user = await prisma.user       │
│   .findUnique({                      │
│     where: { email }                 │
│   })                                 │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ PostgreSQL                           │
│                                      │
│ SELECT * FROM users                  │
│ WHERE email = 'admin@mais.sa'        │
└──────┬───────────────────────────────┘
       │
       │ ◄─── إرجاع بيانات المستخدم
       ▼
┌──────────────────────────────────────┐
│ Password Verification                │
│                                      │
│ const isValid = await compare(       │
│   password,                          │
│   user.passwordHash                  │
│ )                                    │
└──────┬───────────────────────────────┘
       │
       │ ✅ كلمة المرور صحيحة
       ▼
┌──────────────────────────────────────┐
│ Create JWT Token                     │
│                                      │
│ {                                    │
│   id: "user_id",                     │
│   email: "admin@mais.sa",            │
│   role: "ADMIN",                     │
│   permissions: [...]                 │
│ }                                    │
└──────┬───────────────────────────────┘
       │
       │ ◄─── حفظ في Cookie
       ▼
┌──────────────────────────────────────┐
│ Redirect to Dashboard                │
│                                      │
│ router.push('/dashboard')            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────┐
│ Dashboard    │
│ يتم عرضه     │
└──────────────┘
```

---

## 3. تدفق إضافة عنصر مخزون (Add Inventory Item)

```
┌──────────────┐
│ المستخدم     │
│ يملأ النموذج │
└──────┬───────┘
       │ itemName: "Surgical Gloves"
       │ batch: "SG2024-001"
       │ quantity: 500
       ▼
┌──────────────────────────────────────┐
│ DataEntryForm Component              │
│ src/components/forms/                │
│                                      │
│ 1. التحقق من البيانات                │
│ 2. إرسال POST request                │
└──────┬───────────────────────────────┘
       │
       │ POST /api/inventory
       │ Body: { itemName, batch, ... }
       ▼
┌──────────────────────────────────────┐
│ API Route Handler                    │
│ src/app/api/inventory/route.ts       │
│                                      │
│ 1. التحقق من Session                │
│ 2. التحقق من الصلاحيات               │
└──────┬───────────────────────────────┘
       │
       │ ✅ المستخدم لديه صلاحية
       ▼
┌──────────────────────────────────────┐
│ Prisma Create                        │
│                                      │
│ const item = await prisma            │
│   .inventoryItem.create({            │
│     data: {                          │
│       itemName,                      │
│       batch,                         │
│       quantity,                      │
│       enteredById: session.user.id   │
│     }                                │
│   })                                 │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ PostgreSQL                           │
│                                      │
│ INSERT INTO inventory_items          │
│ (id, item_name, batch, ...)          │
│ VALUES (...)                         │
│                                      │
│ RETURNING *                          │
└──────┬───────────────────────────────┘
       │
       │ ◄─── إرجاع العنصر المُنشأ
       ▼
┌──────────────────────────────────────┐
│ Create Audit Log                     │
│                                      │
│ await prisma.auditLog.create({       │
│   data: {                            │
│     userId: session.user.id,         │
│     action: 'CREATE',                │
│     entityType: 'InventoryItem',     │
│     entityId: item.id,               │
│     newValue: data                   │
│   }                                  │
│ })                                   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ PostgreSQL                           │
│                                      │
│ INSERT INTO audit_logs               │
│ (user_id, action, ...)               │
│ VALUES (...)                         │
└──────┬───────────────────────────────┘
       │
       │ ◄─── تأكيد الحفظ
       ▼
┌──────────────────────────────────────┐
│ Return Response                      │
│                                      │
│ Response.json({                      │
│   success: true,                     │
│   data: item                         │
│ })                                   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Update UI                            │
│                                      │
│ - عرض رسالة نجاح                    │
│ - تحديث القائمة                      │
│ - إغلاق النموذج                      │
└──────────────────────────────────────┘
```

---

## 4. العلاقات بين الجداول (Database Relations)

```
┌─────────────────────┐
│      User           │
│ ─────────────────── │
│ id (PK)             │
│ email               │
│ name                │
│ passwordHash        │
│ role                │
└──────┬──────────────┘
       │
       │ 1:N (One to Many)
       │
       ├──────────────────────────────┐
       │                              │
       ▼                              ▼
┌─────────────────────┐    ┌─────────────────────┐
│  InventoryItem      │    │    AuditLog         │
│ ─────────────────── │    │ ─────────────────── │
│ id (PK)             │    │ id (PK)             │
│ itemName            │    │ userId (FK)         │
│ batch               │    │ action              │
│ quantity            │    │ entityType          │
│ enteredById (FK) ───┼────│ entityId            │
│ destination         │    │ timestamp           │
└─────────────────────┘    └─────────────────────┘
       │
       │ 1:N
       │
       ▼
┌─────────────────────┐
│   Transaction       │
│ ─────────────────── │
│ id (PK)             │
│ inventoryItemId(FK) │
│ type                │
│ quantity            │
│ performedBy         │
└─────────────────────┘
```

**شرح العلاقات:**

1. **User → InventoryItem**: مستخدم واحد يمكنه إدخال عدة عناصر
2. **User → AuditLog**: مستخدم واحد يمكن أن يكون له عدة سجلات تدقيق
3. **InventoryItem → Transaction**: عنصر واحد يمكن أن يكون له عدة معاملات

---

## 5. تدفق الصلاحيات (Permissions Flow)

```
┌──────────────────────────────────────┐
│ User Login                           │
│ Role: ADMIN                          │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ JWT Token Created                    │
│                                      │
│ {                                    │
│   role: "ADMIN",                     │
│   permissions: [                     │
│     "inventory:read",                │
│     "inventory:write",               │
│     "inventory:delete",              │
│     "reports:view",                  │
│     "users:manage",                  │
│     "settings:manage",               │
│     "audit:view"                     │
│   ]                                  │
│ }                                    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ User Tries to Access Feature         │
│ Example: Delete Inventory Item       │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Permission Check                     │
│                                      │
│ if (session.user.permissions         │
│     .includes('inventory:delete')) { │
│   // Allow                           │
│ } else {                             │
│   // Deny                            │
│ }                                    │
└──────┬───────────────────────────────┘
       │
       ├─── ✅ Has Permission
       │
       ▼
┌──────────────────────────────────────┐
│ Execute Action                       │
│ Delete inventory item                │
└──────────────────────────────────────┘
```

---

## 6. مثال على استعلام Prisma معقد

```typescript
// جلب عناصر المخزون مع معلومات المستخدم والمعاملات
const items = await prisma.inventoryItem.findMany({
  where: {
    destination: 'MAIS',
    deletedAt: null,
    quantity: {
      lt: 100  // أقل من 100
    }
  },
  include: {
    enteredBy: {
      select: {
        name: true,
        email: true,
        role: true
      }
    },
    auditLogs: {
      take: 5,
      orderBy: {
        timestamp: 'desc'
      }
    }
  },
  orderBy: {
    createdAt: 'desc'
  },
  take: 20
})
```

**يتم تحويله إلى SQL:**

```sql
SELECT 
  i.*,
  u.name, u.email, u.role,
  (SELECT json_agg(al.*) 
   FROM audit_logs al 
   WHERE al.entity_id = i.id 
   ORDER BY al.timestamp DESC 
   LIMIT 5) as audit_logs
FROM inventory_items i
LEFT JOIN users u ON i.entered_by_id = u.id
WHERE 
  i.destination = 'MAIS' 
  AND i.deleted_at IS NULL
  AND i.quantity < 100
ORDER BY i.created_at DESC
LIMIT 20;
```

---

## 7. دورة حياة الطلب الكاملة (Request Lifecycle)

```
1. Browser Request
   │
   ▼
2. Next.js Middleware
   │ - Check authentication
   │ - Check locale
   │
   ▼
3. Page/API Route
   │ - Validate session
   │ - Check permissions
   │
   ▼
4. Service Layer
   │ - Business logic
   │ - Data validation
   │
   ▼
5. Prisma Client
   │ - Build query
   │ - Connection pooling
   │
   ▼
6. PostgreSQL
   │ - Execute query
   │ - Return results
   │
   ▼
7. Response Processing
   │ - Format data
   │ - Add metadata
   │
   ▼
8. Send Response
   │ - JSON/HTML
   │ - Status code
   │
   ▼
9. Browser Renders
   - Update UI
   - Show feedback
```

---

## 8. الأمان والتشفير (Security Flow)

```
┌──────────────────────────────────────┐
│ User Password: "Password123!"        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ bcrypt.hash(password, 12)            │
│                                      │
│ Salt Rounds: 12                      │
│ Time: ~300ms                         │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Hashed Password (stored in DB)       │
│                                      │
│ $2b$12$abcdef...xyz123               │
│ (60 characters)                      │
└──────────────────────────────────────┘

عند تسجيل الدخول:
┌──────────────────────────────────────┐
│ User enters: "Password123!"          │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ bcrypt.compare(                      │
│   "Password123!",                    │
│   "$2b$12$abcdef...xyz123"           │
│ )                                    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Returns: true ✅                     │
│ Password matches!                    │
└──────────────────────────────────────┘
```

---

## الخلاصة

هذا النظام يستخدم معماريات حديثة وآمنة:

✅ **Separation of Concerns**: فصل واضح بين الطبقات
✅ **Type Safety**: أمان الأنواع مع TypeScript و Prisma
✅ **Security**: تشفير كلمات المرور وحماية الجلسات
✅ **Scalability**: استخدام Connection Pooling
✅ **Auditability**: تسجيل جميع العمليات
✅ **Performance**: استعلامات محسّنة مع Indexes

كل طبقة لها مسؤولية واضحة ومحددة، مما يجعل النظام سهل الصيانة والتطوير.
