import { NextResponse } from 'next/server';
import { getRoom, saveRoom, type Order } from '@/lib/rooms';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const room = await getRoom(id);
  if (!room) return NextResponse.json({ error: '房間不存在' }, { status: 404 });
  if (room.isClosed) return NextResponse.json({ error: '房間已結單' }, { status: 400 });
  const order = await request.json() as Order;
  room.orders.push(order);
  await saveRoom(room);
  return NextResponse.json(order, { status: 201 });
}
