const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// 暫存在記憶體的資料庫
const rooms = {};

// 24 小時自動清理機制
const ROOM_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function scheduleRoomCleanup(roomId) {
  setTimeout(() => {
    if (rooms[roomId]) {
      console.log(`[AUTO-CLEANUP] Deleting room: ${roomId}`);
      delete rooms[roomId];
    }
  }, ROOM_EXPIRY_MS);
}

// 1. 伺服器健康檢查
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 2. 建立新房間
app.post('/api/rooms', (req, res) => {
  const roomData = req.body;
  
  // 驗證必要欄位（已移除 PIN 密碼欄位限制）
  if (!roomData.id) {
    return res.status(400).json({ error: '缺少房間ID' });
  }
  
  // 將房間資料存入記憶體
  rooms[roomData.id] = {
    ...roomData,
    createdAt: Date.now()
  };
  
  // 排程 24 小時後自動刪除
  scheduleRoomCleanup(roomData.id);
  
  res.status(201).json(roomData);
});

// 3. 取得房間資料
app.get('/api/rooms/:id', (req, res) => {
  const roomId = req.params.id;
  const room = rooms[roomId];

  if (!room) {
    return res.status(404).json({ error: '找不到該房間，可能已經過期或被刪除。' });
  }

  res.status(200).json(room);
});

// 4. 新增訂單
app.post('/api/rooms/:id/orders', (req, res) => {
  const roomId = req.params.id;
  const orderData = req.body;
  const room = rooms[roomId];

  if (!room) {
    return res.status(404).json({ error: '房間不存在' });
  }
  if (room.isClosed) {
    return res.status(400).json({ error: '此房間已結單，無法再新增訂單！' });
  }

  room.orders.push(orderData);
  res.status(201).json(orderData);
});

// 5. 刪除訂單
app.delete('/api/rooms/:roomId/orders/:orderId', (req, res) => {
  const { roomId, orderId } = req.params;
  const room = rooms[roomId];

  if (!room) {
    return res.status(404).json({ error: '房間不存在' });
  }
  if (room.isClosed) {
    return res.status(400).json({ error: '此房間已結單，無法刪除訂單！' });
  }

  room.orders = room.orders.filter(o => o.id !== orderId);
  res.status(200).json({ message: '訂單已刪除' });
});

// 6. 結單 (已移除 PIN 驗證)
app.post('/api/rooms/:id/close', (req, res) => {
  const roomId = req.params.id;
  const room = rooms[roomId];

  if (!room) {
    return res.status(404).json({ error: '房間不存在' });
  }
  if (room.isClosed) {
    return res.status(400).json({ error: '房間已經是結單狀態！' });
  }

  // 更新狀態為已結單
  room.isClosed = true;
  room.closedAt = Date.now();
  
  // 排程在 24 小時後自動刪除該房間
  scheduleRoomCleanup(roomId);
  
  res.status(200).json({ message: '✅ 結單成功！此房間將在 24 小時後自動刪除。', room: { id: room.id, name: room.name, isClosed: true } });
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend Server is running on http://localhost:${PORT}`);
});