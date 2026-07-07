require('dotenv').config(); 

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-2.5-flash';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ENDPOINT 1: GENERATE-TEXT
app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ENDPOINT 2: GENERATE-FROM-IMAGE
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  const { prompt } = req.body;
  try {
    const base64Image = req.file.buffer.toString('base64');
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt, type: 'text' },
        { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
      ],
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ENDPOINT 3: GENERATE-FROM-DOCUMENT
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  const { prompt } = req.body;
  try {
    const base64Document = req.file.buffer.toString('base64');
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt ?? "Tolong buat ringkasan dari dokumen berikut.", type: 'text' },
        { inlineData: { data: base64Document, mimeType: req.file.mimetype } }
      ],
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ENDPOINT 4: GENERATE-FROM-AUDIO
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  const { prompt } = req.body;
  try {
    const base64Audio = req.file.buffer.toString('base64');
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt ?? "Tolong buat transkrip dari audio berikut.", type: 'text' },
        { inlineData: { data: base64Audio, mimeType: req.file.mimetype } }
      ],
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ENDPOINT 5: POST API/CHAT (DayFlow AI)
app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;
  try {
    if (!Array.isArray(conversation)) throw new Error('Messages must be an array!');

    const contents = conversation.map(({ role, text }) => ({
      role: role === 'user' ? 'user' : 'model',
      parts: [{ text: text }]
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 0.7,
        systemInstruction: `
          Anda adalah "DayFlow AI", seorang Personal Productivity Assistant yang ahli, profesional, dan suportif.
          
          TUGAS UTAMA:
          1. Membantu pengguna mengatur jadwal, teknik belajar/bekerja (seperti Pomodoro, Time Blocking), mengatasi prokrastinasi, dan menyusun prioritas tugas (Eisenhower Matrix).
          2. Berikan jawaban yang singkat, padat, praktis, dan langsung bisa dipraktikkan (actionable).
          3. Selalu gunakan bahasa Indonesia yang ramah namun tetap profesional.

          BATASAN KETAT (GUARDRAILS):
          - Anda HANYA BOLEH menjawab pertanyaan yang berkaitan dengan produktivitas, manajemen waktu, motivasi kerja/belajar, dan efisiensi personal.
          - Jika pengguna menanyakan hal di luar topik tersebut (seperti coding, resep makanan, gosip, sejarah, matematika umum, dll), tolak dengan halus.
          - Contoh penolakan: "Maaf, sebagai asisten produktivitas personal Anda, saya hanya dapat membantu Anda dalam hal manajemen waktu dan efisiensi kerja. Mari kembali fokus ke target harian Anda! Ada tugas yang bisa saya bantu jadwalkan?"
        `,
      },
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// Hanya berjalan di lokal (Development)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

// Ekspor modul agar bisa dibaca Serverless Vercel
module.exports = app;