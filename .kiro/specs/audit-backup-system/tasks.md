# Implementation Plan

هذا المستند يحدد مهام التنفيذ لنظام التدقيق والنسخ الاحتياطي. كل مهمة تبني بشكل تدريجي على العمل السابق.

## Task List

- [x] 1. إعداد قاعدة البيانات والنماذج الأساسية
  - توسيع Prisma schema بإضافة نماذج AuditLog, Backup, Report, ReportSchedule, BackupConfig
  - إضافة جميع الـ enums المطلوبة
  - إنشاء وتشغيل database migration
  - _Requirements: 1-30 (جميع المتطلبات تعتمد على نماذج البيانات)_

- [x] 2. بناء نظام التدقيق الكامل (Audit System)
  - [x] 2.1 تطوير AuditService مع التوقيع الرقمي
    - تنفيذ logAction() مع دعم queue غير محظور
    - تنفيذ queryLogs() مع الفلترة والترقيم
    - تنفيذ getStatistics() للإحصائيات
    - تنفيذ getEntryDetails() مع الإدخالات المرتبطة
    - تنفيذ revertChange() للمسؤولين فقط
    - تنفيذ exportLogs() بصيغ CSV, Excel, PDF
    - إضافة signEntry() و verifyEntry() باستخدام HMAC-SHA256
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 30_
  
  - [x] 2.2 إنشاء Audit API routes
    - GET /api/audit/logs - مع الفلترة والترقيم
    - GET /api/audit/stats - الإحصائيات
    - GET /api/audit/details/:id - التفاصيل الكاملة
    - POST /api/audit/revert - التراجع (ADMIN فقط)
    - POST /api/audit/export - التصدير
    - WebSocket /api/audit/live - التحديثات الفورية
    - إضافة role-based access control
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10_
  
  - [x] 2.3 بناء واجهة المستخدم للتدقيق
    - إنشاء AuditLogPage مع التحقق من الصلاحيات
    - إنشاء AuditLogTable مع الفرز والتوسيع
    - إنشاء AuditFilters مع جميع خيارات الفلترة
    - إنشاء AuditStatsPanel مع الرسوم البيانية
    - إنشاء AuditDetailsModal للتفاصيل الكاملة
    - إنشاء RevertChangeDialog للتراجع
    - إنشاء AuditExportDialog للتصدير
    - إنشاء LiveAuditIndicator للتحديثات الفورية
    - تطبيق التصميم المتجاوب للموبايل (MobileCardView, FilterDrawer)
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 28_

- [-] 3. بناء نظام النسخ الاحتياطي الكامل (Backup System)
  - [x] 3.1 تطوير BackupService مع التشفير
    - تنفيذ createBackup() مع دعم صيغ متعددة
    - تنفيذ restoreBackup() مع دعم transactions
    - تنفيذ validateBackup() مع فحوصات السلامة
    - تنفيذ encryptBackup() و decryptBackup() باستخدام AES-256-GCM
    - تنفيذ calculateChecksum() و verifyChecksum() باستخدام SHA-256
    - تنفيذ applyRetentionPolicies() لإدارة الاحتفاظ
    - تنفيذ getHealthMetrics() لمراقبة الصحة
    - _Requirements: 11, 12, 13, 15, 17, 18, 19, 20, 29, 30_
  
  - [x] 3.2 إنشاء Backup API routes
    - GET /api/backup/list - قائمة النسخ الاحتياطية
    - POST /api/backup/create - إنشاء نسخة احتياطية
    - POST /api/backup/restore - الاستعادة (ADMIN فقط)
    - GET /api/backup/download/:id - التحميل
    - DELETE /api/backup/:id - الحذف (ADMIN فقط)
    - POST /api/backup/validate - التحقق من السلامة
    - GET /api/backup/health - مقاييس الصحة
    - GET/PUT /api/backup/config - الإعدادات (ADMIN فقط)
    - إضافة role-based access control
    - _Requirements: 11, 12, 14, 15, 16, 17, 18, 19, 20_
  
  - [x] 3.3 بناء واجهة المستخدم للنسخ الاحتياطي
    - إنشاء BackupPage مع التحقق من الصلاحيات
    - إنشاء BackupConfigPanel لإعدادات النسخ التلقائي
    - إنشاء BackupHistoryTable مع جميع الأعمدة والإجراءات
    - إنشاء CreateBackupDialog مع معالج متعدد الخطوات
    - إنشاء RestoreBackupDialog مع خيارات الاستعادة
    - إنشاء BackupHealthMonitor لعرض المقاييس
    - إنشاء BackupValidationPanel لنتائج التحقق
    - إنشاء BackupProgressModal للتقدم الفوري
    - إنشاء DashboardStatsCards للإحصائيات السريعة
    - تطبيق التصميم المتجاوب للموبايل
    - _Requirements: 11, 12, 14, 15, 16, 17, 18, 19, 20, 27, 28_

- [ ] 4. بناء نظام التقارير الكامل (Report System)
  - [-] 4.1 تطوير ReportService مع تكامل AI
    - تنفيذ generateReport() للتنسيق
    - تنفيذ generatePDF() باستخدام react-pdf/renderer مع صفحة الغلاف، الملخص التنفيذي، الرسوم البيانية، الجداول، صفحة التوقيع
    - تنفيذ generateExcel() باستخدام exceljs
    - تنفيذ generatePPTX() باستخدام pptxgenjs
    - تنفيذ getAIInsights() مع تكامل Gemini API
    - تنفيذ emailReport() باستخدام nodemailer
    - تنفيذ scheduleReport() و executeScheduledReport()
    - _Requirements: 21, 22, 23, 24, 26_
  
  - [ ] 4.2 إنشاء Report API routes
    - GET /api/reports/list - قائمة التقارير
    - POST /api/reports/generate - إنشاء تقرير
    - GET /api/reports/download/:id - التحميل
    - GET /api/reports/preview/:id - المعاينة
    - POST /api/reports/email - إرسال بالبريد
    - DELETE /api/reports/:id - الحذف
    - GET/POST/PUT/DELETE /api/reports/schedules - إدارة الجدولة (ADMIN فقط)
    - إضافة role-based access control
    - _Requirements: 21, 22, 25, 26_
  
  - [ ] 4.3 بناء واجهة المستخدم للتقارير
    - إنشاء ReportsPage مع التحقق من الصلاحيات
    - إنشاء ReportGeneratorForm مع جميع الخيارات
    - إنشاء ReportHistoryTable مع الإجراءات
    - إنشاء ReportPreviewModal لعرض PDF
    - إنشاء ScheduledReportsPanel لإدارة الجدولة
    - إنشاء ReportScheduleDialog للإعدادات
    - إنشاء ReportProgressModal للتقدم
    - تطبيق التصميم المتجاوب للموبايل
    - _Requirements: 21, 22, 25, 26, 28_

- [ ] 5. تنفيذ المهام المجدولة والمكونات المشتركة
  - [ ] 5.1 إعداد cron jobs باستخدام node-cron
    - إنشاء cron للنسخ الاحتياطي التلقائي
    - إنشاء cron للتقارير المجدولة
    - إنشاء cron للتنظيف اليومي
    - _Requirements: 13, 26_
  
  - [ ] 5.2 إنشاء المكونات المشتركة
    - MobileCardView للعرض المتجاوب
    - FilterDrawer للفلاتر على الموبايل
    - ProgressBar قابل لإعادة الاستخدام
    - ConfirmationDialog عام
    - _Requirements: 28_
  
  - [ ] 5.3 إضافة دعم اللغات (i18n)
    - إضافة مفاتيح الترجمة لجميع الميزات في messages/en.json و messages/ar.json
    - تطبيق دعم RTL للعربية
    - اختبار عرض الرسوم البيانية في RTL
    - _Requirements: 21, جميع المتطلبات_
  
  - [ ] 5.4 إعداد البيئة والتكوين
    - إضافة جميع متغيرات البيئة المطلوبة إلى .env.example
    - إعداد SMTP للإشعارات
    - تكوين مسارات التخزين
    - إعداد audit signing secret
    - _Requirements: 8, 13, 19, 21, 26, 29, 30_

- [ ] 6. الاختبار الشامل والتوثيق
  - [ ] 6.1 اختبار التكامل الكامل
    - اختبار سير عمل التدقيق الكامل (التسجيل، الفلترة، التصدير، التراجع، التحديثات الفورية)
    - اختبار سير عمل النسخ الاحتياطي الكامل (الإنشاء، التحقق، الاستعادة، الاحتفاظ، المراقبة)
    - اختبار سير عمل التقارير الكامل (الإنشاء، AI، الصيغ، الجدولة، البريد)
    - اختبار التحكم في الصلاحيات (ADMIN, AUDITOR, MANAGER)
    - اختبار التصميم المتجاوب على جميع الأجهزة
    - اختبار ميزات الأمان (التشفير، التوقيع، إعادة إدخال كلمة المرور)
    - _Requirements: 1-30_
  
  - [ ] 6.2 التوثيق
    - إنشاء دليل المستخدم لميزات التدقيق
    - إنشاء دليل المستخدم لإدارة النسخ الاحتياطي
    - إنشاء دليل المستخدم لإنشاء التقارير
    - توثيق API endpoints للمطورين
    - إنشاء دليل النشر مع إعداد البيئة
    - توثيق تكوين المهام المجدولة
    - إنشاء دليل استكشاف الأخطاء
    - _Requirements: جميع المتطلبات_
