import { NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/rooms';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const room = await getRoom(id);
  const nickname = String((await request.json()).nickname || '').trim().slice(0, 60);
  if (!room) return NextResponse.json({ error: '房間不存在' }, { status: 404 });
  if (!nickname) return NextResponse.json({ error: '請輸入暱稱' }, { status: 400 });
  if (!room.members.some(member => member.nickname === nickname)) room.members.push({ nickname, joinedAt: Date.now() });
  return NextResponse.json(await saveRoom(room), { status: 201 });
}
