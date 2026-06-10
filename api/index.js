const express = require('express');
const app = express();

app.use(express.json());
const rooms = {};

// 健康檢查
app.get('/api/health', (req, res) => res.json({ ok: true }));

// 建立房間 (新增 pin 密碼)
app.post('/api/rooms', (req, res) => {
  const { id, name, pin } = req.body; 
  rooms[id] = { id, name, pin, orders: [], isClosed: false };
  res.json(rooms[id]);
});

// 讀取房間
app.get('/api/rooms/:id', (req, res) => {
  const room = rooms[req.params.id];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  // 為了安全，回傳給前端時把 pin 藏起來
  const safeRoom = { ...room };
  delete safeRoom.pin;
  res.json(safeRoom);
});

// 新增訂單項目
app.post('/api/rooms/:id/orders', (req, res) => {
  const { id } = req.params;
  if (!rooms[id]) return res.status(404).json({ error: 'Room not found' });
  if (rooms[id].isClosed) return res.status(403).json({ error: '已經截單囉！' });
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

// 結單 (新增密碼檢查與 24 小時刪除)
app.post('/api/rooms/:id/close', (req, res) => {
  const { id } = req.params;
  const { pin } = req.body; // 從前端接收密碼

  if (!rooms[id]) return res.status(404).json({ error: 'Room not found' });
  
  // 檢查密碼是否正確
  if (rooms[id].pin !== pin) {
    return res.status(401).json({ error: '密碼錯誤！只有開團者才能截單喔！' });
  }

  rooms[id].isClosed = true;

  // 設定 24 小時 (24 * 60 * 60 * 1000 毫秒) 後刪除房間
  // 備註：Vercel 休眠時此計時器會失效並清空記憶體
  setTimeout(() => {
    if (rooms[id]) {
      delete rooms[id];
      console.log(`房間 ${id} 已於 24 小時後自動刪除`);
    }
  }, 24 * 60 * 60 * 1000);

  res.json({ success: true });
});

module.exports = app;
