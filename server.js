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
app.use(express.static('public'));
app.use('/uploads', express.static('data/uploads'));

// تكوين multer لرفع الملفات
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = 'data/uploads';
    try {
      await fs.access(uploadDir);
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB حد أقصى
  }
});

// مسار ملف البيانات
const DATA_FILE = 'data/services.json';

// وظيفة لتحميل البيانات
async function loadData() {
  try {
    await fs.access(DATA_FILE);
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // إذا لم يكن الملف موجوداً، ترجع بيانات افتراضية
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
    await fs.mkdir('data', { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

// 🔥 routes API

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

// 🔥 routes التطبيق

// خدمة الويب آب (واجهة المستخدم)
app.get('/webapp', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// خدمة لوحة التحكم
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'panel.html'));
});

// Route افتراضي
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
  console.log(`📱 الويب آب: http://localhost:${PORT}/webapp`);
  console.log(`⚙️  لوحة التحكم: http://localhost:${PORT}/admin`);
});