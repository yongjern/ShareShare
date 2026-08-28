'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Coffee, Link2, Moon, QrCode, Sun, Utensils, Users, WalletCards } from 'lucide-react';

type Mode = 'cafe' | 'restaurant' | 'daily';
type Lang = 'zh' | 'en';

const copy = {
  zh: {
    eyebrow: 'SHARESHARE / 團購工具', title: '一起點，清楚分。', subtitle: '不用註冊，建立一個房間，讓每個人自己加入訂單。結算時，每一筆金額都清清楚楚。', cafe: '飲料外帶', cafeDesc: '適合咖啡、手搖飲與甜點，快速收集甜度、冰塊和備註。', cafeTags: ['支援冰塊甜度', '一人一筆訂單'], restaurant: '街邊吃飯', restaurantDesc: '自由建立菜單，適合午餐、聚餐與沒有固定模板的點餐。', restaurantTags: ['可自訂品項', '支援數量與備註'], daily: '生活百貨', dailyDesc: '適合超市、日用品與家庭採購，自由輸入商品、單價和數量。', dailyTags: ['商品採購', '數量與備註'], create: '建立此模式', roomName: '這次要買什麼？', nickname: '你的暱稱', payment: '收款 ID', createRoom: '建立房間', creating: '建立中…', required: '請填寫完整資訊', steps: ['選擇模式', '分享連結', '一起點餐', '一鍵結算'], copied: '連結已複製', language: '語言', demo: '簡單、快速、每個人都看得懂',
  },
  en: {
    eyebrow: 'SHARESHARE / GROUP ORDERING', title: 'Order together. Split clearly.', subtitle: 'No sign-up. Create a room, let everyone add their own order, and settle every amount with confidence.', cafe: 'Beverage run', cafeDesc: 'For coffee, bubble tea and desserts, with sweetness, ice and notes built in.', cafeTags: ['Sweetness & ice', 'One order per person'], restaurant: 'Street food', restaurantDesc: 'Build a flexible menu for lunch, dinners and everything in between.', restaurantTags: ['Custom items', 'Quantity & notes'], daily: 'Daily goods', dailyDesc: 'For groceries, household goods and everyday shopping with flexible items and quantities.', dailyTags: ['Shopping list', 'Quantity & notes'], create: 'Create this mode', roomName: 'What are we getting?', nickname: 'Your nickname', payment: 'Payment ID', createRoom: 'Create room', creating: 'Creating…', required: 'Please complete all fields', steps: ['Choose a mode', 'Share the link', 'Order together', 'Settle in one click'], copied: 'Link copied', language: 'Language', demo: 'Simple, quick, clear for everyone',
  },
};

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('zh');
  const [darkMode, setDarkMode] = useState(false);
  const [mode, setMode] = useState<Mode>('cafe');
  const [roomName, setRoomName] = useState('');
  const [nickname, setNickname] = useState('');
  const [payment, setPayment] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const t = copy[lang];

  useEffect(() => { const saved = window.localStorage.getItem('share_lang') as Lang | null; if (saved) setLang(saved); setDarkMode(window.localStorage.getItem('share_theme') === 'dark'); }, []);
  function changeLang(next: Lang) { setLang(next); window.localStorage.setItem('share_lang', next); }
  function toggleTheme() { setDarkMode(current => { const next = !current; window.localStorage.setItem('share_theme', next ? 'dark' : 'light'); return next; }); }
  async function createRoom() {
    if (!roomName.trim() || !nickname.trim() || !payment.trim()) return setMessage(t.required);
    setBusy(true); setMessage('');
    const id = String(Math.floor(10000 + Math.random() * 90000));
    const creatorKey = crypto.randomUUID();
    const room = { id, name: roomName.trim(), mode, creator: nickname.trim(), creatorKey, duitNowId: payment.trim(), bankAccount: '', paymentQrUrl: '', splitMode: 'items', splitParts: 1, isClosed: false, members: [{ nickname: nickname.trim(), joinedAt: Date.now() }], orders: [], createdAt: Date.now() };
    try {
      const response = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(room) });
      if (!response.ok) { const result = await response.json().catch(() => null); throw new Error(result?.error || 'API unavailable'); }
      window.localStorage.setItem(`share_nickname_${id}`, nickname.trim());
      window.localStorage.setItem(`share_creator_${id}`, creatorKey);
      window.location.href = `/room/${id}`;
    } catch (error) { setMessage(error instanceof Error ? error.message : '目前無法建立房間，請稍後再試。'); setBusy(false); }
  }
  function joinRoom() { const code = joinRoomId.trim(); if (!/^\d{5}$/.test(code)) return setMessage(lang === 'zh' ? '請輸入 5 位數房號' : 'Enter a five-digit room code'); window.location.href = `/room/${code}`; }

  return <main className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
    <header className={`border-b ${darkMode ? 'border-[#9F3E2B] bg-[#050404]' : 'border-slate-200 bg-white'}`}><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
      <a href="/" className="flex items-center gap-2 font-black tracking-tight"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-sm text-white">S</span><span>ShareShare</span></a>
      <div className={`flex items-center gap-3 text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}><button onClick={toggleTheme} className={`rounded-lg border p-2 ${darkMode ? 'border-[#9F3E2B] text-slate-200 hover:bg-[#9F3E2B]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`} aria-label="切換深色模式">{darkMode ? <Sun size={16}/> : <Moon size={16}/>}</button><span>{t.language}</span><div className={`flex rounded-lg border p-1 ${darkMode ? 'border-[#9F3E2B] bg-[#050404]' : 'border-slate-200 bg-slate-50'}`}><button onClick={() => changeLang('zh')} className={`rounded-md px-3 py-1.5 ${lang === 'zh' ? (darkMode ? 'bg-[#9F3E2B] text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : ''}`}>中</button><button onClick={() => changeLang('en')} className={`rounded-md px-3 py-1.5 ${lang === 'en' ? (darkMode ? 'bg-[#9F3E2B] text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : ''}`}>EN</button></div></div>
      <form onSubmit={event => { event.preventDefault(); joinRoom(); }} className="flex items-center gap-2"><input value={joinRoomId} onChange={event => setJoinRoomId(event.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" maxLength={5} placeholder={lang === 'zh' ? '5 位數房號' : '5-digit code'} aria-label={lang === 'zh' ? '加入房間' : 'Join room'} className={`w-28 rounded-lg border px-3 py-2 text-xs outline-none ${darkMode ? 'border-[#9F3E2B] bg-[#050404] text-white' : 'border-slate-300 bg-white text-slate-900'}`} /><button type="submit" className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700">{lang === 'zh' ? '加入房間' : 'Join room'}</button></form>
    </div></header>
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 lg:px-8 lg:pt-20"><div className="max-w-3xl">
      <p className="mb-4 text-xs font-bold tracking-[0.18em] text-orange-600">{t.eyebrow}</p><h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">{t.title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{t.subtitle}</p>
    </div><div className="mt-12 grid gap-4 md:grid-cols-3"><ModeCard icon={<Coffee size={22}/>} title={t.cafe} description={t.cafeDesc} tags={t.cafeTags} active={mode === 'cafe'} onClick={() => { setMode('cafe'); document.getElementById('create-room')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} action={t.create}/><ModeCard icon={<Utensils size={22}/>} title={t.restaurant} description={t.restaurantDesc} tags={t.restaurantTags} active={mode === 'restaurant'} onClick={() => { setMode('restaurant'); document.getElementById('create-room')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} action={t.create}/><ModeCard icon={<WalletCards size={22}/>} title={t.daily} description={t.dailyDesc} tags={t.dailyTags} active={mode === 'daily'} onClick={() => { setMode('daily'); document.getElementById('create-room')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} action={t.create}/></div>
    </section>
    <section className={`border-y ${darkMode ? 'border-[#9F3E2B] bg-[#050404]' : 'border-slate-200 bg-white'}`}><div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-3 lg:px-8"><Feature icon={<Link2 size={19}/>} title="一個連結" text="QR Code 或連結，手機直接加入房間。"/><Feature icon={<Users size={19}/>} title="各自點餐" text="每個人的暱稱固定顯示，避免訂單混淆。"/><Feature icon={<WalletCards size={19}/>} title="清楚結算" text="支援品項、份數與成員均分。"/></div></section>
    <section id="create-room" className="mx-auto max-w-6xl px-5 py-14 lg:px-8"><div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start"><div><p className="text-sm font-bold text-orange-600">{t.demo}</p><h2 className="mt-2 text-2xl font-black tracking-tight">現在就開一個房間</h2></div><div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="font-bold">{mode === 'cafe' ? t.cafe : t.restaurant}</h2><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">{mode === 'cafe' ? '01' : '02'}</span></div><div className="space-y-3"><Field label={t.roomName} value={roomName} onChange={setRoomName}/><Field label={t.nickname} value={nickname} onChange={setNickname}/><Field label={t.payment} value={payment} onChange={setPayment}/><button onClick={createRoom} disabled={busy} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60">{busy ? t.creating : t.createRoom}<ArrowRight size={17}/></button>{message && <p className="text-sm font-semibold text-rose-600">{message}</p>}</div></div></div></section>
    <footer className="mx-auto max-w-6xl px-5 pb-8 text-xs text-slate-500 lg:px-8">ShareShare · {new Date().getFullYear()}</footer>
  </main>;
}

function ModeCard({ icon, title, description, tags, active, onClick, action }: { icon: React.ReactNode; title: string; description: string; tags: string[]; active: boolean; onClick: () => void; action: string }) { return <button onClick={onClick} className={`group text-left rounded-xl border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-200'}`}><span className={`mb-5 flex h-11 w-11 items-center justify-center rounded-lg ${active ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600'}`}>{icon}</span><h2 className="text-xl font-black">{title}</h2><p className="mt-2 min-h-14 text-sm leading-6 text-slate-600">{description}</p><div className="mt-5 flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{tag}</span>)}</div><span className="mt-6 flex items-center gap-2 text-sm font-bold text-orange-600">{action}<ArrowRight size={16} className="transition group-hover:translate-x-0.5"/></span></button>; }
function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">{icon}</span><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{text}</p></div></div>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span><input value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-100" /></label>; }
