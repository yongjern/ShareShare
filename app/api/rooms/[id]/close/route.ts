import { NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/rooms';

type Context = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: Context) {
  const { id } = await context.params;
  const room = await getRoom(id);
  if (!room) return NextResponse.json({ error: '房間不存在' }, { status: 404 });
  const creator = _.headers.get('x-room-creator');
  const creatorKey = _.headers.get('x-room-creator-key');
  const isAuthorized = creatorKey === room.creatorKey || creator === room.creator;
  if (!isAuthorized) return NextResponse.json({ error: '只有建立者可以結束房間' }, { status: 403 });
  room.isClosed = true;
  room.closedAt = Date.now();
  return NextResponse.json(await saveRoom(room));
}
