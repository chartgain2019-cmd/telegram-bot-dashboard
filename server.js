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

// مجلد التخزين
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp/data' : './data';
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// تأكد من وجود المجلدات
async function ensureDirs() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.log('المجلدات موجودة بالفعل');
  }
}

// تكوين multer لرفع الملفات
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await ensureDirs();
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

// مسار ملف البيانات
const DATA_FILE = path.join(DATA_DIR, 'services.json');

// وظيفة لتحميل البيانات
async function loadData() {
  try {
    await fs.access(DATA_FILE);
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // بيانات افتراضية
    const defaultData = {
      services: {
        schedule: { name: 'الجدول الدراسي', sections: [] },
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

// وظيفة لحفظ البيانات
async function saveData(data) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

// 🔥 🔥 🔥 الـ API Routes المطلوبة 🔥 🔥 🔥

// جلب جميع البيانات
app.get('/api/data', async (req, res) => {
  try {
    const data = await loadData();
    res.json(data);
  } catch (error) {
    console.error('Error loading data:', error);
    res.status(500).json({ error: 'فشل في تحميل البيانات' });
  }
});

// حفظ البيانات
app.post('/api/data', async (req, res) => {
  try {
    const { services } = req.body;
    const success = await saveData({ services });
    
    if (success) {
      res.json({ success: true, message: 'تم حفظ البيانات بنجاح' });
    } else {
      res.status(500).json({ success: false, error: 'فشل في حفظ البيانات' });
    }
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ success: false, error: 'فشل في حفظ البيانات' });
  }
});

// رفع الملفات
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'لم يتم اختيار ملف' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, error: 'فشل في رفع الملف' });
  }
});

// 🔥 Routes التطبيق

// Route للصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel.html'));
});

// API البيانات
app.get('/api/data', (req, res) => {
  res.json({
    services: {
      schedule: { name: 'الجدول الدراسي', sections: [] },
      homework: { name: 'الواجبات', sections: [] },
      ai: { name: 'ربوت الذكاء الاصطناعي', sections: [] },
      broadcast: { name: 'البروكاست', sections: [] },
      programs: { name: 'البرامج والمسابقات', sections: [] },
      files: { name: 'الملفات المرسلة', sections: [] },
      exams: { name: 'الاختبارات', sections: [] },
      contact: { name: 'تواصل معنا', sections: [] }
    }
  });
});

// المسارات المباشرة
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel.html'));
});

app.get('/webapp', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على البورت: ${PORT}`);
  console.log(`📱 الويب آب: /webapp`);
  console.log(`⚙️ لوحة التحكم: /admin`);
  console.log(`🔗 API البيانات: /api/data`);
});
