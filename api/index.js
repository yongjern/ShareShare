const express = require('express');
const cors = require('cors'); // 如果你的前端跟後端在不同網域，會需要用到 CORS
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// 暫存在記憶體的資料庫 (提醒：伺服器重啟資料會清空。若要正式上線，建議替換成資料庫存取)
const rooms = {};

// 1. 伺服器健康檢查 (前端用來判斷要走 Server 還是 LocalStorage)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 2. 建立新房間
app.post('/api/rooms', (req, res) => {
  const roomData = req.body;
  
  // 將房間資料存入記憶體
  rooms[roomData.id] = roomData;
  
  res.status(201).json(roomData);
});

// 3. 取得房間資料
app.get('/api/rooms/:id', (req, res) => {
  const roomId = req.params.id;
  const room = rooms[roomId];

  if (!room) {
    return res.status(404).json({ error: '找不到該房間，可能已經過期或被刪除。' });
  }

  // 為了安全起見，你可以選擇在回傳給所有人時，把 pin 碼濾掉，避免被人用 F12 看光
  // const safeRoomData = { ...room };
  // delete safeRoomData.pin;
  
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

  // 將訂單加入該房間
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

  // 過濾掉要刪除的那筆訂單
  room.orders = room.orders.filter(o => o.id !== orderId);
  res.status(200).json({ message: '訂單已刪除' });
});

// 6. 結單 (包含密碼驗證)
app.post('/api/rooms/:id/close', (req, res) => {
  const roomId = req.params.id;
  const { pin } = req.body; // 接收前端傳來的密碼
  const room = rooms[roomId];

  if (!room) {
    return res.status(404).json({ error: '房間不存在' });
  }
  if (room.isClosed) {
    return res.status(400).json({ error: '房間已經是結單狀態！' });
  }

  // 核心：密碼比對驗證
  if (room.pin !== pin) {
    return res.status(403).json({ error: '密碼錯誤！只有知道密碼的發起人才能截單喔！' });
  }

  // 密碼正確，更新狀態為已結單
  room.isClosed = true;
  res.status(200).json({ message: '結單成功！', room });
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend Server is running on http://localhost:${PORT}`);
});
