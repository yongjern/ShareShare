// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS：開發時允許前端跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 極輕量 In-memory 資料庫 (重開後資料消失，最適合臨時揪團)
const rooms = new Map();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', backend: true });
});

// 建立房間
app.post('/api/rooms', (req, res) => {
  const room = req.body;
  if (!room || !room.id) {
    return res.status(400).json({ error: 'Invalid room payload' });
  }
  rooms.set(room.id, room);
  console.log(`[CREATE] Room "${room.name}" (${room.id}) by ${room.creator}`);
  res.status(201).json(room);
});

// 取得房間
app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

// 更新房間（追加訂單、結單都走這裡）
app.put('/api/rooms/:id', (req, res) => {
  const { id } = req.params;
  if (!rooms.has(id)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  const room = req.body;
  if (!room || room.id !== id) {
    return res.status(400).json({ error: 'ID mismatch' });
  }
  rooms.set(id, room);
  res.json(room);
});

// 若你有 public/index.html，可直接用 http://localhost:3000 開啟
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});
