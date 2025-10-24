const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = process.env.PORT || 3000;

// middleware أساسي - الملفات في الجذر
app.use(express.json());
app.use(express.static('.')); // ⬅️ نقطة بدل public

// Route للصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel.html')); // ⬅️ مباشرة من الجذر
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

// المسارات المباشرة - الملفات في الجذر
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel.html')); // ⬅️ مباشرة من الجذر
});

app.get('/webapp', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // ⬅️ مباشرة من الجذر
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على البورت: ${PORT}`);
});
