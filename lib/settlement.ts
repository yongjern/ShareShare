import type { Room } from './rooms';

export type SettlementRow = { name: string; amount: number };

export function orderTotal(order: Room['orders'][number]) {
  return order.items.reduce((sum, item) => sum + (item.price ?? item.unitPrice ?? 0) * (item.qty ?? 1), 0);
}

export function roomTotal(room: Room) {
  return room.orders.reduce((sum, order) => sum + orderTotal(order), 0);
}

export function calculateSettlement(room: Room): SettlementRow[] {
  const total = roomTotal(room);
  let rows: SettlementRow[];
  if (room.splitMode === 'parts') {
    const parts = Math.max(1, Number(room.splitParts) || 1);
    rows = Array.from({ length: parts }, (_, index) => ({ name: `第 ${index + 1} 份`, amount: total / parts }));
  } else if (room.splitMode === 'equal') {
    const names = room.members.length ? room.members.map(member => member.nickname) : [...new Set(room.orders.map(order => order.userName))];
    rows = names.map(name => ({ name, amount: names.length ? total / names.length : 0 }));
  } else {
    const totals = new Map<string, number>();
    room.orders.forEach(order => totals.set(order.userName, (totals.get(order.userName) || 0) + orderTotal(order)));
    rows = [...totals].map(([name, amount]) => ({ name, amount }));
  }
  return roundSettlement(rows, total);
}

function roundSettlement(rows: SettlementRow[], total: number) {
  if (!rows.length) return rows;
  const rounded = rows.map(row => ({ ...row, amount: Math.floor(row.amount * 100) / 100 }));
  const cents = Math.round(total * 100) - rounded.reduce((sum, row) => sum + Math.round(row.amount * 100), 0);
  if (cents) rounded[rounded.length - 1].amount += cents / 100;
  return rounded;
}
