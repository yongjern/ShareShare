const express = require('express');
const app = express();

app.use(express.json());

// 記憶體暫存（注意：Vercel 閒置時會重置清除，當下點餐夠用）
const rooms = {};

// 健康檢查端點
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// 建立房間
app.post('/api/rooms', (req, res) => {
  const room = req.body;
  rooms[room.id] = room;
  res.json(room);
});

// 讀取房間
app.get('/api/rooms/:id', (req, res) => {
  const room = rooms[req.params.id];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// 新增訂單項目
app.post('/api/rooms/:id/orders', (req, res) => {
  const { id } = req.params;
  if (!rooms[id]) return res.status(404).json({ error: 'Room not found' });
  rooms[id].orders.push(req.body);
  res.json({ success: true });
});

// 刪除特定訂單
app.delete('/api/rooms/:id/orders/:orderId', (req, res) => {
  const { id, orderId } = req.params;
  if (!rooms[id]) return res.status(404).json({ error: 'Room not found' });
  rooms[id].orders = rooms[id].orders.filter(o => o.id !== orderId);
  res.json({ success: true });
});

// 結單
app.post('/api/rooms/:id/close', (req, res) => {
  const { id } = req.params;
  if (!rooms[id]) return res.status(404).json({ error: 'Room not found' });
  rooms[id].isClosed = true;
  res.json({ success: true });
});

// 關鍵：在 Vercel 環境下不需要 app.listen，直接匯出給 Vercel 託管即可
module.exports = app;

