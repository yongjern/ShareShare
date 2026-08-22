import { createClient } from '@supabase/supabase-js';

export type Mode = 'cafe' | 'restaurant';
export type SplitMode = 'items' | 'parts' | 'equal';
export type Item = { name: string; price?: number; unitPrice?: number; qty?: number; sweet?: string; ice?: string; note?: string };
export type Order = { id: string; userName: string; items: Item[]; addedAt: number };
export type Room = { id: string; name: string; mode: Mode; creator: string; creatorKey?: string; duitNowId: string; bankAccount: string; paymentQrUrl: string; splitMode: SplitMode; splitParts: number; isClosed: boolean; members: { nickname: string; joinedAt: number }[]; orders: Order[]; createdAt: number; closedAt?: number };

const memory = globalThis as typeof globalThis & { __shareRooms?: Record<string, Room> };
const rooms = memory.__shareRooms ?? (memory.__shareRooms = {});
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }) : null;

export async function getRoom(id: string) {
  if (!supabase) return rooms[id] ?? null;
  const { data, error } = await supabase.from('shared_rooms').select('data').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data?.data as Room | undefined) ?? null;
}
export async function saveRoom(room: Room) {
  if (!supabase) { rooms[room.id] = room; return room; }
  const { error } = await supabase.from('shared_rooms').upsert({ id: room.id, data: room, updated_at: new Date().toISOString() });
  if (error) throw error;
  return room;
}
export function newRoom(input: Partial<Room>): Room {
  const nickname = String(input.creator || '主辦人').slice(0, 60);
  return { id: input.id || `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: String(input.name || '未命名聚餐').slice(0, 120), mode: input.mode === 'restaurant' ? 'restaurant' : 'cafe', creator: nickname, duitNowId: String(input.duitNowId || ''), bankAccount: '', paymentQrUrl: '', splitMode: 'items', splitParts: 1, isClosed: false, members: [{ nickname, joinedAt: Date.now() }], orders: [], createdAt: Date.now() };
}
