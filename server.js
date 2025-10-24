const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// مجلد التخزين على Render
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp/data' : './data';
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// تأكد من وجود المجلدات
async function ensureDirs() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log('✅ المجلدات جاهزة');
  } catch (error) {
    console.log('📁 المجلدات موجودة بالفعل');
  }
}

// 🔥 تكوين multer مع دعم العربية
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await ensureDirs();
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // حل مشكلة الترميز العربي - استخدام أسماء فريدة
    const fileExtension = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + fileExtension;
    console.log('📤 رفع ملف:', uniqueName);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },
  fileFilter: function (req, file, cb) {
    // قبول جميع أنواع الملفات
    cb(null, true);
  }
});

// مسار ملف البيانات
const DATA_FILE = path.join(DATA_DIR, 'services.json');

// 🔥 وظيفة لتحميل البيانات
async function loadData() {
  try {
    await fs.access(DATA_FILE);
    const data = await fs.readFile(DATA_FILE, 'utf8');
    console.log('📥 تم تحميل البيانات من الملف');
    return JSON.parse(data);
  } catch (error) {
    console.log('📋 إنشاء بيانات افتراضية');
    // بيانات افتراضية
    const defaultData = {
      services: {
        schedule: { 
          name: 'الجدول الدراسي', 
          sections: [
            {
              id: Date.now().toString(),
              name: 'الصف الأول',
              description: 'جدول الحصص الأسبوعي',
              type: 'mixed',
              content: [
                {
                  type: 'text',
                  title: 'جدول هذا الأسبوع',
                  content: 'الأحد: رياضيات، عربي\nالاثنين: علوم، إنجليزي'
                }
              ]
            }
          ] 
        },
        homework: { name: 'الواجبات', sections: [] },
        ai: { name: 'ربوت الذكاء الاصطناعي', sections: [] },
        broadcast: { name: 'البروكاست', sections: [] },
        programs: { name: 'البرامج والمسابقات', sections: [] },
        files: { name: 'الملفات المرسلة', sections: [] },
        exams: { name: 'الاختبارات', sections: [] },
        contact: { name: 'تواصل معنا', sections: [] }
      }
    };
    await saveData(defaultData);
    return defaultData;
  }
}

// 🔥 وظيفة لحفظ البيانات
async function saveData(data) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('💾 تم حفظ البيانات بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في حفظ البيانات:', error);
    return false;
  }
}

// 🔥 🔥 🔥 الـ API Routes 🔥 🔥 🔥

// جلب جميع البيانات
app.get('/api/data', async (req, res) => {
  try {
    console.log('📡 طلب بيانات من الخادم');
    const data = await loadData();
    res.json(data);
  } catch (error) {
    console.error('❌ خطأ في جلب البيانات:', error);
    res.status(500).json({ 
      success: false, 
      error: 'فشل في تحميل البيانات',
      details: error.message 
    });
  }
});

// حفظ البيانات
app.post('/api/data', async (req, res) => {
  try {
    console.log('💾 طلب حفظ البيانات');
    const { services } = req.body;
    
    if (!services) {
      return res.status(400).json({ 
        success: false, 
        error: 'بيانات غير صالحة' 
      });
    }
    
    const success = await saveData({ services });
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'تم حفظ البيانات بنجاح' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'فشل في حفظ البيانات' 
      });
    }
  } catch (error) {
    console.error('❌ خطأ في حفظ البيانات:', error);
    res.status(500).json({ 
      success: false, 
      error: 'فشل في حفظ البيانات',
      details: error.message 
    });
  }
});

// 🔥 رفع الملفات
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 طلب رفع ملف');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'لم يتم اختيار ملف' 
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    console.log('✅ تم رفع الملف:', req.file.filename);
    
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      message: 'تم رفع الملف بنجاح'
    });
    
  } catch (error) {
    console.error('❌ خطأ في رفع الملف:', error);
    res.status(500).json({ 
      success: false, 
      error: 'فشل في رفع الملف',
      details: error.message 
    });
  }
});

// 🔥 خدمة الملفات المرفوعة
app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res, path) => {
    // السماح بجميع أنواع الملفات
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// 🔥 Routes التطبيق

// الصفحة الرئيسية - توجيه إلى لوحة التحكم
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// لوحة التحكم
app.get('/admin', (req, res) => {
  console.log('🖥️ طلب لوحة التحكم');
  res.sendFile(path.join(__dirname, 'panel.html'));
});

// الويب آب
app.get('/webapp', (req, res) => {
  console.log('📱 طلب الويب آب');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 🔥 صفحة للتحقق من حالة الخادم
app.get('/status', (req, res) => {
  res.json({
    status: '✅ الخادم يعمل',
    timestamp: new Date().toISOString(),
    routes: {
      admin: '/admin',
      webapp: '/webapp',
      api: '/api/data',
      uploads: '/uploads'
    }
  });
});

// 🔥 معالجة المسارات غير موجودة
app.use('*', (req, res) => {
  console.log('❌ مسار غير موجود:', req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'مسار غير موجود',
    path: req.originalUrl
  });
});

// 🔥 معالجة الأخطاء العامة
app.use((error, req, res, next) => {
  console.error('🔥 خطأ في الخادم:', error);
  res.status(500).json({
    success: false,
    error: 'خطأ داخلي في الخادم',
    message: error.message
  });
});

// 🔥 تهيئة الخادم
async function initializeServer() {
  try {
    await ensureDirs();
    await loadData(); // تأكد من وجود البيانات
    
    app.listen(PORT, () => {
      console.log('\n🚀 ===== الخادم يعامل بنجاح =====');
      console.log(`📍 البورت: ${PORT}`);
      console.log(`📊 لوحة التحكم: http://localhost:${PORT}/admin`);
      console.log(`📱 الويب آب: http://localhost:${PORT}/webapp`);
      console.log(`🔗 API البيانات: http://localhost:${PORT}/api/data`);
      console.log(`📁 الملفات: http://localhost:${PORT}/uploads`);
      console.log(`🩺 الحالة: http://localhost:${PORT}/status`);
      console.log('================================\n');
    });
    
  } catch (error) {
    console.error('❌ فشل في تهيئة الخادم:', error);
    process.exit(1);
  }
}

// تشغيل الخادم
initializeServer();

module.exports = app;
