import { NextResponse } from 'next/server';
import { newRoom, saveRoom } from '@/lib/rooms';

export async function POST(request: Request) {
  try {
    const room = await saveRoom(newRoom(await request.json()));
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Room creation failed:', error);
    return NextResponse.json({ error: '無法建立房間，請確認 Supabase shared_rooms 表與環境變數設定。' }, { status: 500 });
  }
}
