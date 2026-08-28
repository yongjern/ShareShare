import { NextResponse } from 'next/server';
import { getRoom, saveRoom, type SplitMode } from '@/lib/rooms';

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const { id } = await context.params;
  const room = await getRoom(id);
  return room ? NextResponse.json(room) : NextResponse.json({ error: '房間不存在' }, { status: 404 });
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const room = await getRoom(id);
    if (!room) return NextResponse.json({ error: '房間不存在' }, { status: 404 });
    const creator = request.headers.get('x-room-creator');
    const creatorKey = request.headers.get('x-room-creator-key');
    const isAuthorized = room.creatorKey ? creatorKey === room.creatorKey : creator === room.creator;
    if (!isAuthorized) return NextResponse.json({ error: '只有建立者可以修改收款設定' }, { status: 403 });
    const body = await request.json();
    if (['items', 'parts', 'equal'].includes(body.splitMode)) room.splitMode = body.splitMode as SplitMode;
    room.splitParts = Math.max(1, Number(body.splitParts) || room.splitParts);
    if (body.bankAccount !== undefined) room.bankAccount = String(body.bankAccount);
    if (body.paymentQrUrl !== undefined) room.paymentQrUrl = String(body.paymentQrUrl);
    return NextResponse.json(await saveRoom(room));
  } catch { return NextResponse.json({ error: '無法更新房間' }, { status: 500 }); }
}
