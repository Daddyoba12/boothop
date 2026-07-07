'use client';
import React, { useState, useEffect, useRef } from 'react';

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0f;color:#e4e4e8;font-family:system-ui,-apple-system,sans-serif;font-size:15px;min-height:100vh}
nav{display:flex;align-items:center;padding:0 24px;height:58px;background:#0f0f1c;border-bottom:1px solid #1a1a28;gap:8px;position:sticky;top:0;z-index:100;flex-wrap:wrap}
.nav-brand{font-size:1.05rem;font-weight:800;white-space:nowrap;letter-spacing:-0.3px}
.nav-brand span{color:#ff6a00}
.nav-tabs{display:flex;gap:2px;flex:1;margin:0 16px;overflow-x:auto}
.tab-btn{background:none;border:none;color:#666;padding:7px 16px;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:500;white-space:nowrap;transition:all 0.15s}
.tab-btn:hover{color:#e4e4e8;background:#1a1a2a}
.tab-btn.active{color:#ff6a00;background:#1a1a2a}
.nav-right{display:flex;align-items:center;gap:10px;margin-left:auto}
.company-pill{background:#1a1a2a;border:1px solid #252535;border-radius:20px;padding:4px 14px;font-size:0.78rem;color:#888;white-space:nowrap}
.logout-btn{color:#555;font-size:0.8rem;text-decoration:none;padding:6px 12px;border-radius:7px;border:1px solid #252535;white-space:nowrap;transition:all 0.15s}
.logout-btn:hover{color:#e4e4e8;border-color:#444}
main{max-width:1200px;margin:0 auto;padding:32px 24px}
.tab-pane{display:none}
.tab-pane.active{display:block}
.section-title{font-size:1rem;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:12px}
.section-title small{color:#555;font-size:0.78rem;font-weight:400}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.form-group{display:flex;flex-direction:column;gap:6px}
.form-group.full{grid-column:1/-1}
.form-group label{font-size:0.72rem;color:#666;font-weight:600;letter-spacing:0.5px;text-transform:uppercase}
.form-group input,.form-group textarea,.form-group select{background:#0d0d1a;border:1px solid #222232;border-radius:9px;color:#e4e4e8;padding:10px 14px;font-size:0.9rem;outline:none;transition:border 0.2s;font-family:inherit}
.form-group input:focus,.form-group textarea:focus,.form-group select:focus{border-color:#ff6a00}
.form-group textarea{resize:vertical;min-height:80px}
.platform-row{display:flex;flex-wrap:wrap;gap:8px;padding:4px 0}
.plat-label{display:flex;align-items:center;gap:7px;background:#0d0d1a;border:1px solid #222232;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:0.85rem;transition:all 0.15s;user-select:none}
.plat-label:hover{border-color:#444}
.plat-label.checked{border-color:#ff6a00;background:rgba(255,106,0,0.07);color:#ff9a50}
.plat-label input{accent-color:#ff6a00;cursor:pointer}
.custom-block{background:#0d0d1a;border:1px solid #1e1e30;border-radius:12px;padding:14px 16px;margin-bottom:10px}
.custom-row{display:grid;grid-template-columns:180px 1fr;gap:12px;align-items:start}
.custom-row input{padding:8px 12px;font-size:0.85rem}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 20px;border:none;border-radius:9px;font-size:0.875rem;font-weight:600;cursor:pointer;transition:all 0.15s;text-decoration:none}
.btn-primary{background:#ff6a00;color:#fff}
.btn-primary:hover{background:#e55a00}
.btn-secondary{background:#141422;color:#e4e4e8;border:1px solid #252535}
.btn-secondary:hover{background:#1e1e30}
.btn-success{background:rgba(22,163,74,0.2);color:#4ade80;border:1px solid rgba(74,222,128,0.25)}
.btn-success:hover{background:rgba(22,163,74,0.3)}
.btn-danger{background:rgba(220,38,38,0.15);color:#fca5a5;border:1px solid rgba(252,165,165,0.2)}
.btn-danger:hover{background:rgba(220,38,38,0.25)}
.btn-skip{background:rgba(100,100,100,0.15);color:#aaa;border:1px solid rgba(150,150,150,0.2)}
.btn-skip:hover{background:rgba(100,100,100,0.25)}
.btn-sm{padding:6px 14px;font-size:0.78rem}
.status-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;padding:13px 18px;background:#0d0d1a;border:1px solid #1a1a28;border-radius:12px;align-items:center}
.pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:500}
.pill-ok{background:rgba(22,163,74,0.12);color:#4ade80;border:1px solid rgba(74,222,128,0.18)}
.pill-warn{background:rgba(245,158,11,0.12);color:#fbbf24;border:1px solid rgba(251,191,36,0.18)}
.pill-info{background:rgba(99,102,241,0.12);color:#a5b4fc;border:1px solid rgba(165,180,252,0.18)}
.pill-cloud{background:rgba(14,165,233,0.12);color:#38bdf8;border:1px solid rgba(56,189,248,0.18)}
.slots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}
.slot-card{background:#0f0f1c;border:1px solid #1a1a28;border-radius:16px;overflow:hidden;transition:border 0.2s}
.slot-card.pending{border-color:rgba(255,106,0,0.5)}
.slot-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #1a1a28}
.slot-title{font-weight:700;font-size:0.875rem}
.slot-time{font-size:0.72rem;color:#555;margin-top:2px}
.slot-badge{font-size:0.68rem;padding:3px 10px;border-radius:10px;font-weight:700;background:rgba(255,106,0,0.15);color:#ff6a00;border:1px solid rgba(255,106,0,0.25);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
.slot-video{width:100%;aspect-ratio:9/16;background:#080810;position:relative}
.slot-video video{width:100%;height:100%;object-fit:cover;display:block}
.no-video{display:flex;align-items:center;justify-content:center;height:100%;color:#222;font-size:0.82rem;flex-direction:column;gap:6px}
.slot-body{padding:12px 16px}
.slot-hook{font-size:0.78rem;color:#888;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5}
.slot-caption{font-size:0.72rem;color:#555;margin-bottom:8px;line-height:1.4}
.slot-caption strong{color:#666}
.slot-ts{font-size:0.68rem;color:#333;margin-bottom:10px}
.slot-actions{display:flex;gap:6px;flex-wrap:wrap}
.slot-actions .btn{flex:1;min-width:0;font-size:0.75rem;padding:7px 6px}
.v2-toggle{background:none;border:1px solid #1e1e30;border-radius:6px;color:#555;font-size:0.7rem;padding:3px 8px;cursor:pointer;margin-bottom:8px;transition:all 0.15s}
.v2-toggle:hover{border-color:#444;color:#aaa}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:200;display:none}
.overlay.open{display:block}
.edit-panel{position:fixed;right:0;top:0;bottom:0;width:420px;max-width:100vw;background:#0f0f1c;border-left:1px solid #1e1e30;z-index:201;overflow-y:auto;padding:24px;display:none;flex-direction:column;gap:0}
.edit-panel.open{display:flex}
.edit-ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.edit-ph h3{font-weight:700}
.ef{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.ef label{font-size:0.7rem;color:#555;text-transform:uppercase;letter-spacing:0.5px;font-weight:600}
.ef textarea{background:#0a0a14;border:1px solid #222232;border-radius:8px;color:#e4e4e8;padding:9px 12px;font-size:0.875rem;resize:vertical;outline:none;font-family:inherit;line-height:1.5}
.ef textarea:focus{border-color:#ff6a00}
.revoice-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
.rv-card{background:#0f0f1c;border:1px solid #1a1a28;border-radius:16px;padding:22px}
.rv-card h3{font-size:0.75rem;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:16px}
.drop-zone{border:2px dashed #1e1e30;border-radius:12px;padding:36px 20px;text-align:center;cursor:pointer;transition:all 0.2s;margin-bottom:14px}
.drop-zone:hover,.drop-zone.dragover{border-color:#ff6a00;background:rgba(255,106,0,0.04)}
.drop-zone p{color:#555;font-size:0.83rem;line-height:1.6}
.drop-zone strong{color:#888}
.video-preview{width:100%;border-radius:8px;max-height:280px;margin-bottom:12px;display:none}
.vid-name{font-size:0.78rem;color:#555;margin-bottom:8px;display:none}
.record-btn{width:100%;padding:13px;background:#141422;border:2px solid #1e1e30;border-radius:12px;color:#e4e4e8;font-size:0.875rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px}
.record-btn:hover{border-color:#ff6a00}
.record-btn.recording{background:rgba(220,38,38,0.1);border-color:#dc2626;color:#fca5a5}
.rdot{width:9px;height:9px;border-radius:50%;background:#dc2626;animation:pulse 1s infinite}
.or-sep{text-align:center;color:#333;font-size:0.78rem;margin:8px 0}
.voice-ready{font-size:0.8rem;color:#4ade80;margin-top:8px;display:none}
.music-sel{width:100%;background:#0a0a14;border:1px solid #222232;border-radius:9px;color:#e4e4e8;padding:10px 14px;font-size:0.875rem;outline:none;margin-bottom:10px}
.yt-row{display:flex;gap:8px;margin-top:8px}
.yt-row input{flex:1;background:#0a0a14;border:1px solid #222232;border-radius:8px;color:#e4e4e8;padding:8px 12px;font-size:0.85rem;outline:none}
.yt-row input:focus{border-color:#ff6a00}
.bake-btn{width:100%;padding:15px;background:#ff6a00;border:none;border-radius:12px;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;transition:background 0.15s}
.bake-btn:hover{background:#e55a00}
.bake-progress{display:none;text-align:center;padding:12px;color:#fbbf24;font-size:0.85rem}
.bake-ready{display:none;text-align:center;padding:12px}
.bake-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#0a0a14;border-radius:8px;margin-bottom:8px}
.bake-meta{font-size:0.75rem;color:#555}
.bake-badge{display:inline-flex;padding:3px 10px;border-radius:10px;font-size:0.7rem;font-weight:600}
.bake-done{background:rgba(22,163,74,0.12);color:#4ade80}
.bake-pending,.bake-running{background:rgba(245,158,11,0.12);color:#fbbf24}
.bake-failed{background:rgba(220,38,38,0.12);color:#fca5a5}
.clients-tbl{width:100%;border-collapse:collapse;font-size:0.875rem}
.clients-tbl th{text-align:left;color:#444;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.5px;padding:8px 12px;border-bottom:1px solid #1a1a28;font-weight:600}
.clients-tbl td{padding:13px 12px;border-bottom:1px solid #0f0f1a;vertical-align:middle}
.clients-tbl tr:hover td{background:#0f0f1a}
.adot{width:7px;height:7px;border-radius:50%;background:#4ade80;display:inline-block;margin-right:5px}
.idot{width:7px;height:7px;border-radius:50%;background:#333;display:inline-block;margin-right:5px}
.add-client-box{background:#0f0f1c;border:1px solid #1a1a28;border-radius:16px;padding:24px;margin-top:24px}
.add-client-box h3{font-size:0.85rem;font-weight:700;margin-bottom:16px}
.mt4{margin-top:4px}.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}.mt24{margin-top:24px}
.flex{display:flex}.gap8{gap:8px}.gap12{gap:12px}.gap16{gap:16px}
.txt-sm{font-size:0.83rem}.txt-xs{font-size:0.75rem}.txt-muted{color:#555}
.block-row{display:flex;gap:8px;align-items:center}
.block-input{background:#0a0a14;border:1px solid #222232;border-radius:8px;color:#e4e4e8;padding:9px 14px;font-size:0.875rem;outline:none;width:160px}
.block-input:focus{border-color:#ff6a00}
#report-body{font-size:0.85rem;color:#555;margin-top:12px}
.toast{position:fixed;bottom:24px;right:24px;background:#141422;border:1px solid #252535;border-radius:10px;padding:12px 18px;font-size:0.85rem;z-index:500;opacity:0;transform:translateY(8px);transition:all 0.25s;pointer-events:none;max-width:320px}
.toast.show{opacity:1;transform:translateY(0)}
.toast.ok{border-color:rgba(74,222,128,0.3);color:#4ade80}
.toast.err{border-color:rgba(252,165,165,0.3);color:#fca5a5}
.toast.info{border-color:rgba(165,180,252,0.3);color:#a5b4fc}
@media(max-width:768px){
  nav{height:auto;padding:10px 16px;flex-wrap:wrap}
  .nav-tabs{margin:4px 0;width:100%}
  main{padding:20px 16px}
  .form-grid{grid-template-columns:1fr}
  .revoice-cols{grid-template-columns:1fr}
  .edit-panel{width:100%;border-left:none;border-top:1px solid #1e1e30}
  .custom-row{grid-template-columns:1fr}
}
`;

const SLOT_TIMES: Record<number, string> = { 1: '07:00', 2: '12:00', 3: '17:30', 4: '20:30' };

interface Slot {
  hook?: string; hook_v2?: string; problem?: string; stakes?: string;
  resolution?: string; lesson?: string; lesson_v2?: string;
  caption_tiktok?: string; caption_instagram?: string;
  v1?: string; v2?: string; pending_approval?: boolean; rendered_at?: string;
}

function esc(s: unknown): string {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function vidUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return '';
}

export default function CommanderNewClient({
  companyName, isSuper, companySlug,
}: { companyName: string; isSuper: boolean; companySlug: string }) {

  const [activeTab,   setActiveTab]   = useState('');
  const [slots,       setSlots]       = useState<Record<string, Slot>>({});
  const [cloudMode,   setCloudMode]   = useState(false);
  const [pillToday,   setPillToday]   = useState('');
  const [pillPosts,   setPillPosts]   = useState({ text: '', show: false });
  const [pillPending, setPillPending] = useState({ text: '', show: false });
  const [pillStep,    setPillStep]    = useState({ text: '', show: false });
  const [editOpen,    setEditOpen]    = useState(false);
  const [editSlotNum, setEditSlotNum] = useState<number | null>(null);
  const [editHook,    setEditHook]    = useState('');
  const [editProblem, setEditProblem] = useState('');
  const [editStakes,  setEditStakes]  = useState('');
  const [editRes,     setEditRes]     = useState('');
  const [editLesson,  setEditLesson]  = useState('');
  const [editTiktok,  setEditTiktok]  = useState('');
  const [editInsta,   setEditInsta]   = useState('');
  const [v2Active,    setV2Active]    = useState<Record<number, boolean>>({});
  const [toast,       setToast]       = useState({ show: false, msg: '', type: 'ok' });
  const [reportBody,  setReportBody]  = useState('Click Refresh to load.');
  const [clientRows,  setClientRows]  = useState<any[]>([]);
  const [bakeRows,    setBakeRows]    = useState<any[]>([]);
  const [baking,          setBaking]          = useState(false);
  const [bakeReady,       setBakeReady]       = useState<{ id: number } | null>(null);
  const [vidPreview,      setVidPreview]      = useState('');
  const [vidNameStr,      setVidNameStr]      = useState('');
  const [voiceReady,      setVoiceReady]      = useState('');
  const [voicePlayUrl,    setVoicePlayUrl]    = useState('');
  const [recState,        setRecState]        = useState<'idle' | 'recording'>('idle');
  const [recSecs,         setRecSecs]         = useState(0);
  const [ytStatus,        setYtStatus]        = useState('');
  const [musicTracks,     setMusicTracks]     = useState<{ label: string; path: string }[]>([]);
  const [ncPlan,          setNcPlan]          = useState('basic');
  const [revoiceScript,   setRevoiceScript]   = useState('');
  const [revoiceSlotNum,  setRevoiceSlotNum]  = useState<number | null>(null);
  const [postHistory,     setPostHistory]     = useState<any[]>([]);

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bakeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const recTimer     = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef  = useRef<MediaRecorder | null>(null);
  const recChunks    = useRef<Blob[]>([]);
  const vidPathRef   = useRef('');
  const voiceBlobRef = useRef<Blob | null>(null);
  const voiceFileRef = useRef<File | null>(null);
  const musicSelRef  = useRef<HTMLSelectElement | null>(null);
  const blockIdRef   = useRef<HTMLInputElement | null>(null);
  const ytQueryRef   = useRef<HTMLInputElement | null>(null);
  const dlLinkRef    = useRef<HTMLAnchorElement | null>(null);
  // profile refs
  const pfBiz  = useRef<HTMLInputElement | null>(null);
  const pfCon  = useRef<HTMLInputElement | null>(null);
  const pfEm   = useRef<HTMLInputElement | null>(null);
  const pfPh   = useRef<HTMLInputElement | null>(null);
  const pfWeb  = useRef<HTMLInputElement | null>(null);
  const pfTg   = useRef<HTMLInputElement | null>(null);
  const pfWa   = useRef<HTMLInputElement | null>(null);
  const pfBio  = useRef<HTMLTextAreaElement | null>(null);
  const platTk = useRef<HTMLInputElement | null>(null);
  const platIg = useRef<HTMLInputElement | null>(null);
  const platYt = useRef<HTMLInputElement | null>(null);
  const platLi = useRef<HTMLInputElement | null>(null);
  const platBl = useRef<HTMLInputElement | null>(null);
  const cf1l   = useRef<HTMLInputElement | null>(null);
  const cf1v   = useRef<HTMLTextAreaElement | null>(null);
  const cf2l   = useRef<HTMLInputElement | null>(null);
  const cf2v   = useRef<HTMLTextAreaElement | null>(null);
  const cf3l   = useRef<HTMLInputElement | null>(null);
  const cf3v   = useRef<HTMLTextAreaElement | null>(null);
  const cf4l   = useRef<HTMLInputElement | null>(null);
  const cf4v   = useRef<HTMLTextAreaElement | null>(null);
  // new client refs
  const ncName  = useRef<HTMLInputElement | null>(null);
  const ncSlug  = useRef<HTMLInputElement | null>(null);
  const ncEmail = useRef<HTMLInputElement | null>(null);
  const ncPw    = useRef<HTMLInputElement | null>(null);

  function showToast(msg: string, type = 'ok') {
    setToast({ show: true, msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  }

  async function api(method: string, url: string, body?: any): Promise<any> {
    const opts: RequestInit = { method, credentials: 'same-origin' };
    if (body instanceof FormData) { opts.body = body; }
    else if (body) { opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(body); }
    const r = await fetch(url, opts);
    if (!r.ok) { const txt = await r.text().catch(() => ''); throw new Error(`${r.status}: ${txt.slice(0, 120)}`); }
    return r.json().catch(() => ({}));
  }

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  function switchTab(name: string) {
    setActiveTab(name);
    if (name === 'pipeline') {
      if (!pollRef.current) { loadStatus(); loadSlots(); loadPostHistory(); pollRef.current = setInterval(() => { loadStatus(); loadSlots(); }, 12000); }
    } else { stopPoll(); }
    if (name === 'revoice') { loadBakeHistory(); loadMusicTracks(); }
    if (name === 'clients') { loadClients(); }
  }

  // ── Onboard ──────────────────────────────────────────────────────────────────

  function fillProfile(p: any) {
    if (!p) return;
    if (pfBiz.current)  pfBiz.current.value  = p.business_name || '';
    if (pfCon.current)  pfCon.current.value  = p.contact_name  || '';
    if (pfEm.current)   pfEm.current.value   = p.email         || '';
    if (pfPh.current)   pfPh.current.value   = p.phone         || '';
    if (pfWeb.current)  pfWeb.current.value  = p.website       || '';
    if (pfTg.current)   pfTg.current.value   = p.tg_chat_id    || '';
    if (pfWa.current)   pfWa.current.value   = p.whatsapp      || '';
    if (pfBio.current)  pfBio.current.value  = p.bio           || '';
    const plats: string[] = (() => { try { return JSON.parse(p.platforms_json || '[]'); } catch { return []; } })();
    if (platTk.current) platTk.current.checked = plats.includes('tiktok');
    if (platIg.current) platIg.current.checked = plats.includes('instagram');
    if (platYt.current) platYt.current.checked = plats.includes('youtube');
    if (platLi.current) platLi.current.checked = plats.includes('linkedin');
    if (platBl.current) platBl.current.checked = plats.includes('blog');
    if (cf1l.current) cf1l.current.value = p.custom_1_label || '';
    if (cf1v.current) cf1v.current.value = p.custom_1_value || '';
    if (cf2l.current) cf2l.current.value = p.custom_2_label || '';
    if (cf2v.current) cf2v.current.value = p.custom_2_value || '';
    if (cf3l.current) cf3l.current.value = p.custom_3_label || '';
    if (cf3v.current) cf3v.current.value = p.custom_3_value || '';
    if (cf4l.current) cf4l.current.value = p.custom_4_label || '';
    if (cf4v.current) cf4v.current.value = p.custom_4_value || '';
  }

  async function loadProfile() {
    try { const r = await api('GET', '/api/commander/onboard'); fillProfile(r.profile); showToast('Profile loaded'); }
    catch (e: any) { showToast('Load failed: ' + e.message, 'err'); }
  }

  async function saveProfile() {
    const plats = [
      { ref: platTk, val: 'tiktok' }, { ref: platIg, val: 'instagram' },
      { ref: platYt, val: 'youtube' }, { ref: platLi, val: 'linkedin' }, { ref: platBl, val: 'blog' },
    ].filter(p => p.ref.current?.checked).map(p => p.val);
    const data = {
      business_name:  pfBiz.current?.value  || '',
      contact_name:   pfCon.current?.value  || '',
      email:          pfEm.current?.value   || '',
      phone:          pfPh.current?.value   || '',
      website:        pfWeb.current?.value  || '',
      tg_chat_id:     pfTg.current?.value   || '',
      whatsapp:       pfWa.current?.value   || '',
      bio:            pfBio.current?.value  || '',
      platforms_json: JSON.stringify(plats),
      custom_1_label: cf1l.current?.value || '', custom_1_value: cf1v.current?.value || '',
      custom_2_label: cf2l.current?.value || '', custom_2_value: cf2v.current?.value || '',
      custom_3_label: cf3l.current?.value || '', custom_3_value: cf3v.current?.value || '',
      custom_4_label: cf4l.current?.value || '', custom_4_value: cf4v.current?.value || '',
    };
    try { await api('POST', '/api/commander/onboard', data); showToast('✅ Profile saved'); }
    catch (e: any) { showToast('Save failed: ' + e.message, 'err'); }
  }

  // ── Pipeline ─────────────────────────────────────────────────────────────────

  async function loadStatus() {
    try {
      const s = await api('GET', '/api/commander/pipeline/status');
      setCloudMode(!!s.cloud_mode);
      setPillToday(new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
      setPillPosts({ text: `${s.posts_today || 0} posted today`, show: true });
      setPillPending(s.pending_slots?.length ? { text: `⚡ ${s.pending_slots.length} awaiting`, show: true } : { text: '', show: false });
      setPillStep(s.current_step ? { text: `▶ ${s.current_step}`, show: true } : { text: '', show: false });
    } catch { /* silent */ }
  }

  async function loadSlots() {
    try { setSlots(await api('GET', '/api/commander/pipeline/slots')); } catch { /* silent */ }
  }

  async function approve(slot: number, decision: string) {
    const fd = new FormData(); fd.append('slot', String(slot)); fd.append('decision', decision);
    try { await api('POST', '/api/commander/pipeline/approve', fd); showToast(`Slot ${slot} — ${decision}`); setTimeout(loadSlots, 1500); }
    catch (e: any) { showToast(e.message, 'err'); }
  }

  function openEdit(slot: number) {
    const s = slots[String(slot)] || {};
    setEditSlotNum(slot); setEditHook(s.hook || ''); setEditProblem(s.problem || '');
    setEditStakes(s.stakes || ''); setEditRes(s.resolution || ''); setEditLesson(s.lesson || '');
    setEditTiktok(s.caption_tiktok || ''); setEditInsta(s.caption_instagram || ''); setEditOpen(true);
  }

  async function submitEdit() {
    if (!editSlotNum) return;
    const fields = [
      { field: 'hook', value: editHook }, { field: 'problem', value: editProblem },
      { field: 'stakes', value: editStakes }, { field: 'resolution', value: editRes },
      { field: 'lesson', value: editLesson }, { field: 'caption_tiktok', value: editTiktok },
      { field: 'caption_instagram', value: editInsta },
    ];
    try {
      for (const { field, value } of fields) {
        if (value.trim()) {
          const fd = new FormData(); fd.append('slot', String(editSlotNum)); fd.append('field', field); fd.append('value', value);
          await api('POST', '/api/commander/pipeline/edit-field', fd);
        }
      }
      const fd = new FormData(); fd.append('slot', String(editSlotNum));
      await api('POST', '/api/commander/pipeline/submit-edit', fd);
      showToast(`✅ Slot ${editSlotNum} edits submitted`); setEditOpen(false); setTimeout(loadSlots, 1500);
    } catch (e: any) { showToast('Edit failed: ' + e.message, 'err'); }
  }

  async function blockMedia() {
    const id = parseInt(blockIdRef.current?.value || '0');
    if (!id) { showToast('Enter a media ID', 'err'); return; }
    const fd = new FormData(); fd.append('media_id', String(id));
    try { await api('POST', '/api/commander/pipeline/block-media', fd); showToast(`Media ${id} blocked`); if (blockIdRef.current) blockIdRef.current.value = ''; }
    catch (e: any) { showToast(e.message, 'err'); }
  }

  function revoiceSlot(n: number) {
    const s = slots[String(n)] || {};
    const url = s.v1 ? vidUrl(s.v1) : '';
    vidPathRef.current = s.v1 || '';
    setVidPreview(url);
    setVidNameStr(`Pipeline Slot ${n}`);
    const script = [s.hook, s.problem, s.stakes, s.resolution, s.lesson]
      .filter(Boolean).join('\n\n');
    setRevoiceScript(script);
    setRevoiceSlotNum(n);
    switchTab('revoice');
    showToast(`Slot ${n} loaded into Revoice Studio`);
  }

  async function loadPostHistory() {
    try {
      const rows = await api('GET', '/api/commander/pipeline/history');
      setPostHistory(Array.isArray(rows) ? rows : []);
    } catch { /* silent */ }
  }

  async function loadReport() {
    try {
      const r = await api('GET', '/api/commander/pipeline/report');
      if (!r.week_total && !r.newsflash_week) { setReportBody('No posts this week.'); return; }
      const byPl = Object.entries(r.by_platform || {}).map(([k, v]) => `${k}: ${v}`).join(' · ');
      setReportBody(`${r.week_total} posts this week${byPl ? ' · ' + byPl : ''}`);
    } catch { setReportBody('Report unavailable.'); }
  }

  // ── Revoice ──────────────────────────────────────────────────────────────────

  async function loadMusicTracks() {
    try { const t = await api('GET', '/api/commander/music-tracks'); setMusicTracks(Array.isArray(t) ? t : []); } catch { /* silent */ }
  }

  async function loadBakeHistory() {
    try { const rows = await api('GET', '/api/commander/bakes'); setBakeRows(Array.isArray(rows) ? rows : []); } catch { /* silent */ }
  }

  async function refreshTracks() {
    try { const t = await api('GET', '/api/commander/music-tracks'); setMusicTracks(Array.isArray(t) ? t : []); showToast('Tracks refreshed'); }
    catch (e: any) { showToast(e.message, 'err'); }
  }

  function dzOver(e: React.DragEvent) { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('dragover'); }
  function dzLeave(e: React.DragEvent) { (e.currentTarget as HTMLElement).classList.remove('dragover'); }
  function dzDrop(e: React.DragEvent) { e.preventDefault(); dzLeave(e); if (e.dataTransfer.files[0]) uploadVid(e.dataTransfer.files[0]); }

  async function uploadVid(file: File) {
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch('/api/commander/revoice/upload', { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      vidPathRef.current = data.path;
      setVidPreview(data.url || ''); setVidNameStr(file.name);
      showToast('Video uploaded');
    } catch (e: any) { showToast('Upload error: ' + e.message, 'err'); }
  }

  async function toggleRecord() {
    if (recState === 'recording') {
      recorderRef.current?.stop();
      setRecState('idle');
      if (recTimer.current) { clearInterval(recTimer.current); recTimer.current = null; }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recChunks.current = [];
        const rec = new MediaRecorder(stream);
        rec.ondataavailable = e => recChunks.current.push(e.data);
        rec.onstop = () => {
          voiceBlobRef.current = new Blob(recChunks.current, { type: 'audio/webm' });
          voiceFileRef.current = null;
          setVoicePlayUrl(URL.createObjectURL(voiceBlobRef.current));
          setVoiceReady(`✅ Recording ready (${(voiceBlobRef.current.size / 1024).toFixed(0)} KB)`);
          stream.getTracks().forEach(t => t.stop());
        };
        rec.start(); recorderRef.current = rec; setRecState('recording'); setRecSecs(0);
        recTimer.current = setInterval(() => setRecSecs(s => s + 1), 1000);
      } catch { showToast('Microphone access denied', 'err'); }
    }
  }

  function voiceFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    voiceFileRef.current = e.target.files?.[0] || null; voiceBlobRef.current = null;
    if (voiceFileRef.current) setVoiceReady(`✅ ${voiceFileRef.current.name}`);
  }

  async function startBake() {
    if (!vidPathRef.current) { showToast('Upload a video first', 'err'); return; }
    if (!voiceBlobRef.current && !voiceFileRef.current) { showToast('Record or upload a voice file', 'err'); return; }
    const music = musicSelRef.current?.value || '';
    const fd = new FormData();
    fd.append('video', vidPathRef.current);
    const voice = voiceBlobRef.current ? new Blob([voiceBlobRef.current], { type: 'audio/webm' }) : voiceFileRef.current!;
    fd.append('voice', voice, voiceBlobRef.current ? 'voice.webm' : voiceFileRef.current!.name);
    if (music) fd.append('music', music);
    setBaking(true); setBakeReady(null);
    try {
      const d = await fetch('/api/commander/revoice/bake', { method: 'POST', body: fd }).then(r => { if (!r.ok) throw new Error('Bake failed'); return r.json(); });
      pollBake(d.job_id, d.bake_id);
    } catch (e: any) { setBaking(false); showToast(e.message, 'err'); }
  }

  function pollBake(jobId: string, bakeId: number) {
    if (bakeInterval.current) clearInterval(bakeInterval.current);
    bakeInterval.current = setInterval(async () => {
      try {
        const s = await api('GET', `/api/commander/revoice/job/${jobId}`);
        if (s.status === 'done') {
          clearInterval(bakeInterval.current!); setBaking(false); setBakeReady({ id: bakeId });
          showToast('✅ Bake complete!'); loadBakeHistory();
        } else if (s.status === 'failed') {
          clearInterval(bakeInterval.current!); setBaking(false); showToast('❌ Bake failed: ' + (s.error || 'unknown'), 'err');
        }
      } catch { /* ignore */ }
    }, 3000);
  }

  async function addYT() {
    const q = ytQueryRef.current?.value.trim() || '';
    if (!q) { showToast('Enter a search term or URL', 'err'); return; }
    setYtStatus('Downloading… (~20 seconds)');
    const fd = new FormData(); fd.append('query', q);
    try {
      const r = await fetch('/api/commander/revoice/youtube-music', { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setMusicTracks(prev => [...prev, { label: d.label, path: d.path }]);
      setYtStatus('Added: ' + d.label);
      if (ytQueryRef.current) ytQueryRef.current.value = '';
    } catch (e: any) { setYtStatus('Failed: ' + (e as any).message); }
  }

  // ── Clients ──────────────────────────────────────────────────────────────────

  async function loadClients() {
    try { const rows = await api('GET', '/api/commander/clients'); setClientRows(Array.isArray(rows) ? rows : []); }
    catch (e: any) { showToast(e.message, 'err'); }
  }

  async function addClient() {
    const data = {
      name:     ncName.current?.value  || '',
      slug:     (ncSlug.current?.value || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''),
      email:    ncEmail.current?.value || '',
      plan:     ncPlan,
      password: ncPw.current?.value    || '',
    };
    if (!data.name || !data.slug || !data.password) { showToast('Name, Slug and Password are required', 'err'); return; }
    try {
      await api('POST', '/api/commander/clients', data);
      showToast('✅ Client created');
      [ncName, ncSlug, ncEmail, ncPw].forEach(r => { if (r.current) r.current.value = ''; });
      loadClients();
    } catch (e: any) { showToast(e.message, 'err'); }
  }

  // ── Init ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const r = await api('GET', '/api/commander/onboard');
        const p = r.profile;
        if (p) fillProfile(p);
        switchTab(p?.business_name ? 'pipeline' : 'onboard');
      } catch { switchTab('onboard'); }
    })();
    return () => { stopPoll(); if (bakeInterval.current) clearInterval(bakeInterval.current); };
  }, []);

  // ── Slot card ────────────────────────────────────────────────────────────────

  function SlotCard({ n }: { n: number }) {
    const s      = slots[String(n)] || {};
    const ip     = !!s.pending_approval;
    const v1     = s.v1 ? vidUrl(s.v1) : '';
    const v2     = s.v2 ? vidUrl(s.v2) : '';
    const ts     = s.rendered_at ? new Date(s.rendered_at).toLocaleString() : '';
    const showV2 = v2Active[n] || false;
    const displayHook = showV2 ? (s.hook_v2 || s.hook || '') : (s.hook || '');
    const cap         = s.caption_tiktok || '';
    const currentSrc  = showV2 ? v2 : v1;
    return (
      <div className={`slot-card${ip ? ' pending' : ''}`}>
        <div className="slot-header">
          <div>
            <div className="slot-title">Slot {n}</div>
            <div className="slot-time">{SLOT_TIMES[n]}</div>
          </div>
          {ip && <span className="slot-badge">Awaiting</span>}
        </div>
        <div className="slot-video">
          {currentSrc
            ? <video id={`sv${n}`} src={currentSrc} controls playsInline />
            : <div className="no-video"><span style={{ fontSize: '2rem' }}>📭</span><span>No video yet</span></div>}
        </div>
        <div className="slot-body">
          {(v1 && v2) && <button className="v2-toggle" onClick={() => setV2Active(p => ({ ...p, [n]: !p[n] }))}>{showV2 ? 'Show V1' : 'Show V2'}</button>}
          {displayHook && <div className="slot-hook">{displayHook}</div>}
          {cap && <div className="slot-caption"><strong>TK:</strong> {cap.slice(0, 90)}{cap.length > 90 ? '…' : ''}</div>}
          {ts && <div className="slot-ts">{ts}</div>}
          <div className="slot-actions">
            {ip && <>
              <button className="btn btn-success"   onClick={() => approve(n, 'post')}>✅ Post</button>
              <button className="btn btn-danger"    onClick={() => approve(n, 'skip')}>Skip</button>
              <button className="btn btn-secondary" onClick={() => approve(n, 'regen')}>🔄 Regen</button>
            </>}
            <button className="btn btn-secondary" onClick={() => openEdit(n)}>✏️ Edit</button>
            <button className="btn btn-secondary" onClick={() => revoiceSlot(n)}>🎙 Revoice</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* NAV */}
      <nav>
        <div className="nav-brand"><span>Boot</span>Hop Commander</div>
        <div className="nav-tabs">
          <button className={`tab-btn${activeTab === 'onboard'   ? ' active' : ''}`} onClick={() => switchTab('onboard')}>Onboard</button>
          <button className={`tab-btn${activeTab === 'pipeline'  ? ' active' : ''}`} onClick={() => switchTab('pipeline')}>Pipeline</button>
          <button className={`tab-btn${activeTab === 'revoice'   ? ' active' : ''}`} onClick={() => switchTab('revoice')}>Revoice Studio</button>
          {isSuper && <button className={`tab-btn${activeTab === 'clients' ? ' active' : ''}`} onClick={() => switchTab('clients')}>All Clients</button>}
        </div>
        <div className="nav-right">
          <span className="company-pill">{companyName}</span>
          <a href="/api/commander/logout" className="logout-btn">Logout</a>
        </div>
      </nav>

      <main>

        {/* ── ONBOARD TAB ─────────────────────────────────────────────────────── */}
        <div className={`tab-pane${activeTab === 'onboard' ? ' active' : ''}`}>
          <div className="section-title">Onboard Profile <small>Your details — always editable</small></div>
          <div className="form-grid">
            <div className="form-group"><label>Business Name</label><input type="text" ref={pfBiz} placeholder="Your company name" /></div>
            <div className="form-group"><label>Contact Name</label><input type="text" ref={pfCon} placeholder="Your full name" /></div>
            <div className="form-group"><label>Email</label><input type="email" ref={pfEm} placeholder="you@example.com" /></div>
            <div className="form-group"><label>Phone</label><input type="tel" ref={pfPh} placeholder="+44 7700 000000" /></div>
            <div className="form-group"><label>Website</label><input type="url" ref={pfWeb} placeholder="https://yoursite.com" /></div>
            <div className="form-group"><label>Telegram Chat ID</label><input type="text" ref={pfTg} placeholder="-100123456789" /></div>
            <div className="form-group"><label>WhatsApp</label><input type="tel" ref={pfWa} placeholder="+44 7700 000000" /></div>
            <div className="form-group full">
              <label>Bio / Brand Description</label>
              <textarea ref={pfBio} rows={4} placeholder="Your brand, niche, target audience, tone of voice…" />
            </div>
            <div className="form-group full">
              <label>Active Platforms</label>
              <div className="platform-row">
                <label className="plat-label"><input type="checkbox" ref={platTk} name="platform" value="tiktok" /> TikTok</label>
                <label className="plat-label"><input type="checkbox" ref={platIg} name="platform" value="instagram" /> Instagram</label>
                <label className="plat-label"><input type="checkbox" ref={platYt} name="platform" value="youtube" /> YouTube</label>
                <label className="plat-label"><input type="checkbox" ref={platLi} name="platform" value="linkedin" /> LinkedIn</label>
                <label className="plat-label"><input type="checkbox" ref={platBl} name="platform" value="blog" /> Blog</label>
              </div>
            </div>
          </div>

          <div className="section-title mt16">Custom Fields <small>Up to 4 extra details specific to your pipeline</small></div>
          {([1, 2, 3, 4] as const).map((n, i) => {
            const labelRefs = [cf1l, cf2l, cf3l, cf4l];
            const valueRefs = [cf1v, cf2v, cf3v, cf4v];
            const placeholders = ['Label (e.g. Brand Tone)', 'Label', 'Label', 'Label'];
            return (
              <div className="custom-block" key={n} data-idx={n}>
                <div className="custom-row">
                  <input type="text" className="cf-label" ref={labelRefs[i]} placeholder={placeholders[i]} />
                  <textarea className="cf-value" ref={valueRefs[i]} rows={2} placeholder="Value…" />
                </div>
              </div>
            );
          })}

          <div className="flex gap8 mt16">
            <button className="btn btn-primary" onClick={saveProfile}>Save Profile</button>
            <button className="btn btn-secondary" onClick={loadProfile}>Discard</button>
          </div>
        </div>

        {/* ── PIPELINE TAB ────────────────────────────────────────────────────── */}
        <div className={`tab-pane${activeTab === 'pipeline' ? ' active' : ''}`}>
          <div className="status-bar">
            <span className="pill pill-info">{pillToday}</span>
            {pillPosts.show    && <span className="pill pill-ok">{pillPosts.text}</span>}
            {pillPending.show  && <span className="pill pill-warn">{pillPending.text}</span>}
            {pillStep.show     && <span className="pill pill-info">{pillStep.text}</span>}
            {cloudMode         && <span className="pill pill-cloud">☁ Cloud sync</span>}
          </div>

          <div className="slots-grid">
            {activeTab === 'pipeline' && Object.keys(slots).length === 0
              ? <div style={{ color: '#333', padding: '40px', textAlign: 'center', gridColumn: '1/-1' }}>Loading…</div>
              : [1, 2, 3, 4].map(n => <SlotCard key={n} n={n} />)
            }
          </div>

          <div className="mt24">
            <div className="section-title">Block Media</div>
            <div className="block-row">
              <input type="number" ref={blockIdRef} className="block-input" placeholder="Media ID" />
              <button className="btn btn-secondary btn-sm" onClick={blockMedia}>Block</button>
            </div>
          </div>

          <div className="mt24">
            <div className="section-title">
              Weekly Report
              <button className="btn btn-secondary btn-sm" onClick={loadReport}>Refresh</button>
            </div>
            <div id="report-body">{reportBody}</div>
          </div>

          {postHistory.length > 0 && (
            <div className="mt24">
              <div className="section-title">Last 14 Days <small>Click Revoice to re-use any post</small></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {postHistory.map((p: any, i: number) => (
                  <div key={i} style={{ background: '#0f0f1c', border: '1px solid #1a1a28', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '3px' }}>
                        {p.date} · {p.platform} · Slot {p.slot}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#e4e4e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.hook || '—'}
                      </div>
                    </div>
                    {p.video_url && (
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        vidPathRef.current = p.video_url;
                        setVidPreview(p.video_url.startsWith('http') ? p.video_url : '');
                        setVidNameStr(`${p.date} Slot ${p.slot}`);
                        setRevoiceScript(p.hook || '');
                        setRevoiceSlotNum(null);
                        switchTab('revoice');
                        showToast('Post loaded into Revoice Studio');
                      }}>🎙 Revoice</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── REVOICE TAB ─────────────────────────────────────────────────────── */}
        <div className={`tab-pane${activeTab === 'revoice' ? ' active' : ''}`}>
          <div className="revoice-cols">
            <div>
              <div className="rv-card">
                <h3>1 — Video</h3>
                {vidPreview && <video className="video-preview" style={{ display: 'block' }} src={vidPreview} controls playsInline />}
                {vidNameStr && <p className="vid-name" style={{ display: 'block' }}>Current: {vidNameStr}</p>}
                <div className="drop-zone" onClick={() => document.getElementById('cn-file-in')?.click()}
                  onDragOver={dzOver} onDragLeave={dzLeave} onDrop={dzDrop}
                  style={vidPreview ? { padding: '14px', marginTop: '10px' } : {}}>
                  <p>{vidPreview ? 'Upload different video' : <><strong>Click to upload</strong> or drag &amp; drop<br />MP4, MOV, WebM</>}</p>
                </div>
                <input type="file" id="cn-file-in" accept="video/*" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) uploadVid(e.target.files[0]); }} />
              </div>

              <div className="rv-card mt12">
                <h3>2 — Voice</h3>
                <button className={`record-btn${recState === 'recording' ? ' recording' : ''}`} onClick={toggleRecord}>
                  {recState === 'recording' ? <><span className="rdot"></span>Stop Recording ({recSecs}s)</> : <><span>🎙</span>Start Recording</>}
                </button>
                <div className="txt-xs txt-muted" style={{ textAlign: 'center', marginBottom: '8px' }}>
                  {recState === 'recording' ? `Recording… ${recSecs}s — tap Stop when done` : 'Tap to start — read your script while recording'}
                </div>
                <p className="or-sep">— or upload voice file —</p>
                <div className="drop-zone" onClick={() => document.getElementById('cn-voice-in')?.click()} style={{ padding: '20px' }}>
                  <p><strong>Upload voice</strong> (WAV, MP3, M4A, WebM)</p>
                </div>
                <input type="file" id="cn-voice-in" accept="audio/*,video/webm" style={{ display: 'none' }} onChange={voiceFileChosen} />
                {voiceReady && <p className="voice-ready" style={{ display: 'block' }}>{voiceReady}</p>}
                {voicePlayUrl && (
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '0.72rem', color: '#555', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Playback</p>
                    <audio src={voicePlayUrl} controls style={{ width: '100%' }} />
                  </div>
                )}
              </div>

              <div className="rv-card mt12">
                <h3>3 — Music (optional)</h3>
                <select className="music-sel" ref={musicSelRef}>
                  <option value="">No background music</option>
                  {musicTracks.map((t, i) => <option key={i} value={t.path}>{t.label}</option>)}
                </select>
                <button className="btn btn-secondary btn-sm" onClick={refreshTracks}>Refresh tracks</button>
                <p className="or-sep mt8">— add from YouTube —</p>
                <div className="yt-row">
                  <input type="text" ref={ytQueryRef} placeholder="Search YouTube (e.g. afrobeats chill)" />
                  <button className="btn btn-secondary btn-sm" onClick={addYT}>Get</button>
                </div>
                {ytStatus && <div className="txt-xs" style={{ marginTop: '6px' }}>{ytStatus}</div>}
              </div>
            </div>

            <div>
              <div className="rv-card">
                <h3>4 — Bake</h3>
                <p className="txt-sm txt-muted" style={{ marginBottom: '16px' }}>Merges video + voice + music into one file.</p>
                <button className="bake-btn" onClick={startBake}>🎬 Bake Video</button>
                {baking && <div className="bake-progress" style={{ display: 'block' }}>⏳ Baking… please wait</div>}
                {bakeReady && (
                  <div className="bake-ready" style={{ display: 'block' }}>
                    <p style={{ color: '#4ade80', marginBottom: '10px' }}>✅ Bake complete!</p>
                    <a href={`/api/commander/revoice/download/${bakeReady.id}`} className="btn btn-success">⬇ Download</a>
                  </div>
                )}
              </div>

              {revoiceScript && (
                <div className="rv-card mt12">
                  <h3>Script {revoiceSlotNum ? `— Slot ${revoiceSlotNum}` : ''}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{revoiceScript}</p>
                </div>
              )}

              <div className="rv-card mt12">
                <h3>Bake History</h3>
                {bakeRows.length === 0
                  ? <p className="txt-sm txt-muted">No bakes yet.</p>
                  : bakeRows.map(b => (
                    <div key={b.id} className="bake-row">
                      <div>
                        <div className="bake-meta">#{b.id} · {b.created_at}</div>
                        <span className={`bake-badge bake-${b.status}`}>{b.status}</span>
                      </div>
                      {b.status === 'done' && (
                        <a className="btn btn-secondary btn-sm" href={`/api/commander/revoice/download/${b.id}`}>⬇ Download</a>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* ── CLIENTS TAB ─────────────────────────────────────────────────────── */}
        {isSuper && (
          <div className={`tab-pane${activeTab === 'clients' ? ' active' : ''}`}>
            <div className="section-title">
              All Clients
              <button className="btn btn-secondary btn-sm" onClick={loadClients}>Refresh</button>
            </div>
            {clientRows.length === 0
              ? <p className="txt-sm txt-muted">No clients yet.</p>
              : <table className="clients-tbl">
                  <thead><tr><th>Company</th><th>Slug</th><th>Plan</th><th>Status</th><th>Created</th></tr></thead>
                  <tbody>
                    {clientRows.map((c, i) => (
                      <tr key={i}>
                        <td>{c.name || c.company}{c.is_super_admin ? <span style={{ color: '#ff6a00', fontSize: '0.7rem' }}> SUPER</span> : ''}</td>
                        <td className="txt-sm txt-muted">{c.slug}</td>
                        <td className="txt-sm txt-muted">{c.plan || 'basic'}</td>
                        <td>{c.is_active !== false ? <><span className="adot" />Active</> : <><span className="idot" />Inactive</>}</td>
                        <td className="txt-xs txt-muted">{(c.created_at || '').slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }

            <div className="add-client-box">
              <h3>Register New Client</h3>
              <div className="form-grid mt12">
                <div className="form-group"><label>Company Name</label><input type="text" ref={ncName} placeholder="Acme Corp" /></div>
                <div className="form-group"><label>Company ID (slug)</label><input type="text" ref={ncSlug} placeholder="acme-corp" spellCheck={false} /></div>
                <div className="form-group"><label>Email</label><input type="email" ref={ncEmail} placeholder="contact@acme.com" /></div>
                <div className="form-group">
                  <label>Plan</label>
                  <select value={ncPlan} onChange={e => setNcPlan(e.target.value)}>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="form-group full"><label>Password</label><input type="password" ref={ncPw} placeholder="Client login password" /></div>
              </div>
              <button className="btn btn-primary mt8" onClick={addClient}>Create Client</button>
            </div>
          </div>
        )}

      </main>

      {/* EDIT PANEL */}
      <div className={`overlay${editOpen ? ' open' : ''}`} onClick={() => setEditOpen(false)} />
      <div className={`edit-panel${editOpen ? ' open' : ''}`}>
        <div className="edit-ph">
          <h3>Edit Slot {editSlotNum}</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditOpen(false)}>✕</button>
        </div>
        <div className="ef"><label>Hook</label><textarea rows={3} value={editHook} onChange={e => setEditHook(e.target.value)} /></div>
        <div className="ef"><label>Problem</label><textarea rows={2} value={editProblem} onChange={e => setEditProblem(e.target.value)} /></div>
        <div className="ef"><label>Stakes</label><textarea rows={2} value={editStakes} onChange={e => setEditStakes(e.target.value)} /></div>
        <div className="ef"><label>Resolution</label><textarea rows={2} value={editRes} onChange={e => setEditRes(e.target.value)} /></div>
        <div className="ef"><label>Lesson</label><textarea rows={2} value={editLesson} onChange={e => setEditLesson(e.target.value)} /></div>
        <div className="ef"><label>Caption — TikTok</label><textarea rows={2} value={editTiktok} onChange={e => setEditTiktok(e.target.value)} /></div>
        <div className="ef"><label>Caption — Instagram</label><textarea rows={2} value={editInsta} onChange={e => setEditInsta(e.target.value)} /></div>
        <div className="flex gap8 mt16">
          <button className="btn btn-primary" onClick={submitEdit}>Save Changes</button>
          <button className="btn btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
        </div>
      </div>

      {/* TOAST */}
      <div className={`toast${toast.show ? ' show' : ''} ${toast.type}`}>{toast.msg}</div>
    </>
  );
}
