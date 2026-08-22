import { NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/rooms';

type Context = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: Context) {
  const { id } = await context.params;
  const room = await getRoom(id);
  if (!room) return NextResponse.json({ error: '房間不存在' }, { status: 404 });
  room.isClosed = true;
  room.closedAt = Date.now();
  return NextResponse.json(await saveRoom(room));
}
