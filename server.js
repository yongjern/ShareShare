const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// 讓 Express 託管 public 資料夾裡的靜態網頁 (index.html)
app.use(express.static(path.join(__dirname, 'public')));

// 記憶體暫存（注意：Vercel Serverless 閒置過久會重置清除，點餐暫存夠用，長久儲存建議連資料庫）
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

// 兜底路由：前端SPA重新整理不會404
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 本地開發測試環境監聽
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`本地開發伺服器運行中: http://localhost:${PORT}`);
  });
}

module.exports = app;
