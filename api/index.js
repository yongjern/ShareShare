const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(cors());

const rooms = global.__shareShareRooms || (global.__shareShareRooms = {});
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

async function getRoom(id) {
  if (!supabase) return rooms[id] || null;
  const { data, error } = await supabase
    .from('shared_rooms')
    .select('data')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? data.data : null;
}

async function saveRoom(room) {
  if (!supabase) {
    rooms[room.id] = room;
    return room;
  }
  const { error } = await supabase
    .from('shared_rooms')
    .upsert({ id: room.id, data: room, updated_at: new Date().toISOString() });
  if (error) throw error;
  return room;
}

function route(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '伺服器暫時無法存取房間資料' });
    }
  };
}

function roomId() {
  return `r_${crypto.randomBytes(5).toString('hex')}`;
}

function normalizeRoom(input) {
  return {
    id: input.id || roomId(),
    name: String(input.name || '未命名聚餐').slice(0, 120),
    mode: input.mode === 'restaurant' || input.mode === 'daily' ? input.mode : 'cafe',
    creator: String(input.creator || '主辦人').slice(0, 60),
    duitNowId: String(input.duitNowId || ''),
    bankAccount: String(input.bankAccount || ''),
    paymentQrUrl: String(input.paymentQrUrl || ''),
    splitMode: input.splitMode || 'items',
    splitParts: Number(input.splitParts) || 1,
    creatorKey: input.creatorKey ? String(input.creatorKey) : undefined,
    isClosed: false,
    members: [{ nickname: String(input.creator || '主辦人').slice(0, 60), joinedAt: Date.now() }],
    orders: [],
    createdAt: Date.now()
  };
}

// 1. 伺服器健康檢查
app.get('/api/health', route(async (req, res) => {
  res.status(200).json({ status: 'ok', storage: supabase ? 'supabase' : 'memory' });
}));

// 2. 建立新房間
app.post('/api/rooms', route(async (req, res) => {
  const room = normalizeRoom(req.body || {});
  await saveRoom(room);
  res.status(201).json(room);
}));

// 3. 取得房間資料
app.get('/api/rooms/:id', route(async (req, res) => {
  const roomId = req.params.id;
  const room = await getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: '找不到該房間，可能已經過期或被刪除。' });
  }

  res.status(200).json(room);
}));

app.post('/api/rooms/:id/members', route(async (req, res) => {
  const room = await getRoom(req.params.id);
  const nickname = String(req.body && req.body.nickname || '').trim().slice(0, 60);
  if (!room) return res.status(404).json({ error: '房間不存在' });
  if (!nickname) return res.status(400).json({ error: '請輸入暱稱' });
  if (!room.members.some(member => member.nickname === nickname)) {
    room.members.push({ nickname, joinedAt: Date.now() });
  }
  await saveRoom(room);
  res.status(201).json(room);
}));

app.patch('/api/rooms/:id', route(async (req, res) => {
  const room = await getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: '房間不存在' });
  Object.assign(room, {
    splitMode: ['items', 'parts', 'equal'].includes(req.body.splitMode) ? req.body.splitMode : room.splitMode,
    splitParts: Math.max(1, Number(req.body.splitParts) || room.splitParts),
    duitNowId: String(req.body.duitNowId || room.duitNowId),
    bankAccount: String(req.body.bankAccount || room.bankAccount),
    paymentQrUrl: String(req.body.paymentQrUrl || room.paymentQrUrl)
  });
  await saveRoom(room);
  res.json(room);
}));

// 4. 新增訂單
app.post('/api/rooms/:id/orders', route(async (req, res) => {
  const roomId = req.params.id;
  const orderData = req.body;
  const room = await getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: '房間不存在' });
  }
  if (room.isClosed) {
    return res.status(400).json({ error: '此房間已結單，無法再新增訂單！' });
  }

  room.orders.push(orderData);
  await saveRoom(room);
  res.status(201).json(orderData);
}));

// 5. 刪除訂單
app.delete('/api/rooms/:roomId/orders/:orderId', route(async (req, res) => {
  const { roomId, orderId } = req.params;
  const room = await getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: '房間不存在' });
  }
  if (room.isClosed) {
    return res.status(400).json({ error: '此房間已結單，無法刪除訂單！' });
  }

  room.orders = room.orders.filter(o => o.id !== orderId);
  await saveRoom(room);
  res.status(200).json({ message: '訂單已刪除' });
}));

// 6. 結單 (已移除 PIN 驗證)
app.post('/api/rooms/:id/close', route(async (req, res) => {
  const roomId = req.params.id;
  const room = await getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: '房間不存在' });
  }
  if (room.isClosed) {
    return res.status(400).json({ error: '房間已經是結單狀態！' });
  }
  const creator = req.headers['x-room-creator'];
  const creatorKey = req.headers['x-room-creator-key'];
  const authorized = creatorKey === room.creatorKey || creator === room.creator;
  if (!authorized) return res.status(403).json({ error: '只有建立者可以結束房間' });

  room.isClosed = true;
  room.closedAt = Date.now();
  await saveRoom(room);
  res.status(200).json({ message: '結單成功', room });
}));

const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, () => console.log(`Backend Server is running on http://localhost:${PORT}`));
module.exports = app;