'use client';
import React, { useState, useEffect, useRef } from 'react';

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:#f3f4f8;color:#1e1e2e;font-family:-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif;font-size:15px}
.app-layout{display:flex;height:100vh;overflow:hidden}
/* ── Sidebar ── */
.sidebar{width:220px;flex-shrink:0;background:#111827;display:flex;flex-direction:column;overflow-y:auto;position:sticky;top:0;height:100vh}
.sidebar-brand{padding:20px 18px 16px;border-bottom:1px solid rgba(255,255,255,0.07)}
.sidebar-logo{font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:-0.3px}
.sidebar-logo span{color:#ff6a00}
.sidebar-tagline{font-size:0.6rem;color:#4b5563;margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px}
.sidebar-nav{flex:1;padding:14px 10px}
.sidebar-section{font-size:0.58rem;color:#374151;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;padding:0 10px;margin-bottom:6px;margin-top:18px}
.sidebar-section:first-child{margin-top:0}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;font-size:0.83rem;font-weight:500;color:#9ca3af;border:none;background:none;width:100%;text-align:left;transition:all 0.15s;text-decoration:none}
.nav-item:hover{background:rgba(255,255,255,0.06);color:#e5e7eb}
.nav-item.active{background:rgba(255,106,0,0.15);color:#ff8533;font-weight:600}
.nav-item-icon{width:17px;height:17px;flex-shrink:0;opacity:0.7}
.nav-item.active .nav-item-icon{opacity:1}
.sidebar-footer{padding:14px 10px;border-top:1px solid rgba(255,255,255,0.07)}
.sidebar-client{padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:8px;margin-bottom:8px}
.sidebar-client-name{font-size:0.78rem;font-weight:600;color:#e5e7eb;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sidebar-client-role{font-size:0.62rem;color:#4b5563;font-weight:500}
.sidebar-logout{display:flex;align-items:center;gap:8px;color:#6b7280;font-size:0.8rem;cursor:pointer;padding:7px 10px;border-radius:7px;text-decoration:none;transition:color 0.15s;border:none;background:none;width:100%}
.sidebar-logout:hover{color:#e5e7eb;background:rgba(255,255,255,0.05)}
/* ── Main ── */
.main-content{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{display:flex;align-items:center;padding:0 24px;height:54px;background:#fff;border-bottom:1px solid #e5e7eb;gap:14px;flex-shrink:0;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
.topbar-title{font-size:0.95rem;font-weight:700;color:#111827;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.topbar-badge{font-size:0.68rem;font-weight:600;padding:3px 10px;border-radius:20px;background:#fff7ed;color:#ff6a00;border:1px solid rgba(255,106,0,0.2)}
.page-body{flex:1;overflow-y:auto;padding:24px}
.tab-pane{display:none}
.tab-pane.active{display:block}
/* ── Section titles ── */
.section-title{font-size:0.75rem;font-weight:700;color:#6b7280;margin-bottom:16px;display:flex;align-items:center;gap:10px;text-transform:uppercase;letter-spacing:0.8px}
.section-title small{color:#9ca3af;font-size:0.75rem;font-weight:400;text-transform:none;letter-spacing:0}
/* ── Summary ── */
.summary-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:24px}
.summary-card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;padding:14px 16px;box-shadow:0 1px 2px rgba(0,0,0,0.05)}
.summary-label{font-size:0.65rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.7px;font-weight:600;margin-bottom:5px}
.summary-val{font-size:1.6rem;font-weight:800;color:#111827;line-height:1}
.summary-sub{font-size:0.68rem;color:#9ca3af;margin-top:4px}
.summary-ok .summary-val{color:#16a34a}
.summary-warn .summary-val{color:#d97706}
.summary-orange .summary-val{color:#ff6a00}
/* ── Status pills ── */
.status-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;align-items:center}
.pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:0.72rem;font-weight:500}
.pill-ok{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.pill-warn{background:#fffbeb;color:#d97706;border:1px solid #fde68a}
.pill-info{background:#eff6ff;color:#3b82f6;border:1px solid #bfdbfe}
.pill-cloud{background:#f0f9ff;color:#0284c7;border:1px solid #bae6fd}
/* ── Slot grid ── */
.slots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:24px}
.slot-card{background:#fff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.07);transition:all 0.2s}
.slot-card:hover{box-shadow:0 4px 14px rgba(0,0,0,0.1);border-color:#d1d5db;transform:translateY(-1px)}
.slot-card.pending{border-color:#ff6a00;box-shadow:0 0 0 2px rgba(255,106,0,0.1)}
.slot-header{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid #f3f4f8;background:#fafafa}
.slot-title{font-weight:700;font-size:0.85rem;color:#111827}
.slot-time{font-size:0.66rem;color:#9ca3af;margin-top:1px}
.slot-badge{font-size:0.62rem;padding:3px 9px;border-radius:10px;font-weight:700;background:#fff7ed;color:#ff6a00;border:1px solid rgba(255,106,0,0.3);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
.slot-video{width:100%;aspect-ratio:9/16;background:#f3f4f8;position:relative;overflow:hidden}
.slot-video video{width:100%;height:100%;object-fit:cover;display:block}
.no-video{display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:10px;background:linear-gradient(160deg,#f9fafb 0%,#f1f2f6 100%)}
.no-video-icon{width:48px;height:48px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center}
.no-video-text{font-size:0.78rem;color:#9ca3af;font-weight:500}
.slot-body{padding:12px 14px}
.slot-hook{font-size:0.82rem;color:#374151;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5;font-weight:500}
.slot-caption{font-size:0.7rem;color:#9ca3af;margin-bottom:6px;line-height:1.4}
.slot-caption strong{color:#6b7280}
.slot-ts{font-size:0.63rem;color:#d1d5db;margin-bottom:10px}
.slot-actions{display:flex;gap:4px;margin-bottom:8px}
.slot-actions .btn{flex:1;min-width:0;font-size:0.72rem;padding:7px 4px}
.platform-btns{display:flex;gap:3px;flex-wrap:wrap;margin-top:4px}
.plat-btn{flex:1;min-width:28px;padding:5px 3px;font-size:0.6rem;font-weight:700;border-radius:5px;border:1px solid #e5e7eb;background:#f9fafb;color:#9ca3af;cursor:pointer;transition:all 0.15s;text-align:center;white-space:nowrap}
.plat-btn:hover{border-color:#ff6a00;color:#ff6a00;background:#fff7ed}
.plat-btn-tg{border-color:#bfdbfe;color:#3b82f6;background:#eff6ff}
.plat-btn-tg:hover{border-color:#3b82f6;background:#dbeafe}
.plat-btn-wa{border-color:#bbf7d0;color:#16a34a;background:#f0fdf4}
.plat-btn-wa:hover{border-color:#16a34a;background:#dcfce7}
.plat-btn:disabled{opacity:0.4;cursor:default}
.v2-toggle{background:#f9fafb;border:1px solid #e5e7eb;border-radius:5px;color:#6b7280;font-size:0.68rem;padding:3px 8px;cursor:pointer;margin-bottom:8px;transition:all 0.15s}
.v2-toggle:hover{border-color:#ff6a00;color:#ff6a00}
/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;border:none;border-radius:8px;font-size:0.83rem;font-weight:600;cursor:pointer;transition:all 0.15s;text-decoration:none;white-space:nowrap}
.btn-primary{background:#ff6a00;color:#fff;box-shadow:0 2px 6px rgba(255,106,0,0.3)}
.btn-primary:hover{background:#e55a00}
.btn-secondary{background:#f9fafb;color:#374151;border:1px solid #e5e7eb}
.btn-secondary:hover{background:#f3f4f8;border-color:#d1d5db}
.btn-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.btn-success:hover{background:#dcfce7}
.btn-danger{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
.btn-danger:hover{background:#fee2e2}
.btn-skip{background:#f9fafb;color:#9ca3af;border:1px solid #e5e7eb}
.btn-skip:hover{background:#f3f4f8}
.btn-sm{padding:5px 12px;font-size:0.75rem}
/* ── Forms ── */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.form-group{display:flex;flex-direction:column;gap:6px}
.form-group.full{grid-column:1/-1}
.form-group label{font-size:0.72rem;color:#6b7280;font-weight:600;letter-spacing:0.3px}
.form-group input,.form-group textarea,.form-group select{background:#fff;border:1px solid #e5e7eb;border-radius:8px;color:#111827;padding:10px 14px;font-size:0.9rem;outline:none;transition:border 0.2s;font-family:inherit;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
.form-group input:focus,.form-group textarea:focus,.form-group select:focus{border-color:#ff6a00;box-shadow:0 0 0 3px rgba(255,106,0,0.08)}
.form-group textarea{resize:vertical;min-height:80px}
.platform-row{display:flex;flex-wrap:wrap;gap:8px;padding:4px 0}
.plat-label{display:flex;align-items:center;gap:7px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:0.85rem;transition:all 0.15s;user-select:none;color:#374151}
.plat-label:hover{border-color:#ff6a00;color:#ff6a00}
.plat-label.checked{border-color:#ff6a00;background:#fff7ed;color:#ff6a00}
.plat-label input{accent-color:#ff6a00;cursor:pointer}
.custom-block{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:10px}
.custom-row{display:grid;grid-template-columns:180px 1fr;gap:12px;align-items:start}
.custom-row input{padding:8px 12px;font-size:0.85rem}
/* ── Edit panel ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:200;display:none}
.overlay.open{display:block}
.edit-panel{position:fixed;right:0;top:0;bottom:0;width:440px;max-width:100vw;background:#fff;border-left:1px solid #e5e7eb;z-index:201;overflow-y:auto;padding:24px;display:none;flex-direction:column;gap:0;box-shadow:-8px 0 24px rgba(0,0,0,0.1)}
.edit-panel.open{display:flex}
.edit-ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.edit-ph h3{font-weight:700;color:#111827;font-size:1rem}
.ef{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.ef label{font-size:0.7rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600}
.ef textarea{background:#fff;border:1px solid #e5e7eb;border-radius:8px;color:#111827;padding:9px 12px;font-size:0.875rem;resize:vertical;outline:none;font-family:inherit;line-height:1.5}
.ef textarea:focus{border-color:#ff6a00;box-shadow:0 0 0 3px rgba(255,106,0,0.08)}
/* ── Revoice ── */
.revoice-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
.rv-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
.rv-card h3{font-size:0.68rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:14px}
.drop-zone{border:2px dashed #e5e7eb;border-radius:10px;padding:32px 20px;text-align:center;cursor:pointer;transition:all 0.2s;margin-bottom:14px;background:#fafafa}
.drop-zone:hover,.drop-zone.dragover{border-color:#ff6a00;background:#fff7ed}
.drop-zone p{color:#9ca3af;font-size:0.83rem;line-height:1.6}
.drop-zone strong{color:#374151}
.video-preview{width:100%;border-radius:8px;max-height:260px;margin-bottom:12px;display:none}
.vid-name{font-size:0.78rem;color:#9ca3af;margin-bottom:8px;display:none}
.record-btn{width:100%;padding:12px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;color:#374151;font-size:0.875rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px}
.record-btn:hover{border-color:#ff6a00;color:#ff6a00}
.record-btn.recording{background:#fef2f2;border-color:#dc2626;color:#dc2626}
.rdot{width:9px;height:9px;border-radius:50%;background:#dc2626;animation:pulse 1s infinite}
.or-sep{text-align:center;color:#9ca3af;font-size:0.78rem;margin:8px 0}
.voice-ready{font-size:0.8rem;color:#16a34a;margin-top:8px;display:none}
.music-sel{width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:8px;color:#374151;padding:10px 14px;font-size:0.875rem;outline:none;margin-bottom:10px}
.yt-row{display:flex;gap:8px;margin-top:8px}
.yt-row input{flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:8px;color:#374151;padding:8px 12px;font-size:0.85rem;outline:none}
.yt-row input:focus{border-color:#ff6a00}
.bake-btn{width:100%;padding:14px;background:#ff6a00;border:none;border-radius:10px;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;transition:background 0.15s;box-shadow:0 2px 8px rgba(255,106,0,0.3)}
.bake-btn:hover{background:#e55a00}
.bake-progress{display:none;text-align:center;padding:12px;color:#d97706;font-size:0.85rem}
.bake-ready{display:none;text-align:center;padding:12px}
.bake-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f9fafb;border-radius:8px;margin-bottom:8px;border:1px solid #f3f4f8}
.bake-meta{font-size:0.75rem;color:#9ca3af}
.bake-badge{display:inline-flex;padding:3px 10px;border-radius:10px;font-size:0.7rem;font-weight:600}
.bake-done{background:#f0fdf4;color:#16a34a}
.bake-pending,.bake-running{background:#fffbeb;color:#d97706}
.bake-failed{background:#fef2f2;color:#dc2626}
.rv-textarea{width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:8px;color:#374151;padding:10px 14px;font-size:0.875rem;resize:vertical;min-height:110px;outline:none;font-family:inherit;line-height:1.5}
.rv-textarea:focus{border-color:#ff6a00}
/* ── Clients ── */
.clients-tbl{width:100%;border-collapse:collapse;font-size:0.875rem}
.clients-tbl th{text-align:left;color:#9ca3af;font-size:0.67rem;text-transform:uppercase;letter-spacing:0.5px;padding:8px 14px;border-bottom:2px solid #f3f4f8;font-weight:600}
.clients-tbl td{padding:13px 14px;border-bottom:1px solid #f9fafb;color:#374151;vertical-align:middle}
.clients-tbl tr:hover td{background:#fafafa}
.adot{width:7px;height:7px;border-radius:50%;background:#16a34a;display:inline-block;margin-right:5px}
.idot{width:7px;height:7px;border-radius:50%;background:#d1d5db;display:inline-block;margin-right:5px}
.add-client-box{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-top:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
.add-client-box h3{font-size:0.9rem;font-weight:700;margin-bottom:16px;color:#111827}
/* ── Recent videos ── */
.recent-videos-strip{display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;margin-top:8px}
.recent-vid-card{flex:0 0 120px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.06)}
.recent-vid-thumb{width:100%;aspect-ratio:9/16;object-fit:cover;display:block;background:#f3f4f8}
.recent-vid-footer{padding:6px 8px}
.recent-vid-name{font-size:0.6rem;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:5px}
.recent-vid-btns{display:flex;gap:4px}
.recent-vid-btn{flex:1;padding:4px 3px;font-size:0.6rem;font-weight:700;border-radius:5px;border:none;cursor:pointer;text-align:center;transition:all 0.15s}
.rvb-tg{background:#eff6ff;color:#3b82f6}
.rvb-tg:hover{background:#dbeafe}
.rvb-wa{background:#f0fdf4;color:#16a34a}
.rvb-wa:hover{background:#dcfce7}
/* ── Post history ── */
.history-row{background:#fff;border:1px solid #f3f4f8;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
.history-meta{font-size:0.72rem;color:#9ca3af;margin-bottom:3px}
.history-hook{font-size:0.85rem;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
/* ── Block media ── */
.block-row{display:flex;gap:8px;align-items:center}
.block-input{background:#fff;border:1px solid #e5e7eb;border-radius:8px;color:#374151;padding:9px 14px;font-size:0.875rem;outline:none;width:160px}
.block-input:focus{border-color:#ff6a00}
#report-body{font-size:0.85rem;color:#6b7280;margin-top:12px;line-height:1.7}
/* ── Tour ── */
.tour-bar{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;background:#fff;border:2px solid #ff6a00;border-radius:16px;padding:20px 24px;box-shadow:0 8px 32px rgba(0,0,0,0.15);max-width:480px;width:calc(100vw - 32px);display:flex;flex-direction:column;gap:12px}
.tour-header{display:flex;align-items:center;justify-content:space-between;gap:12px}
.tour-badge{font-size:0.62rem;font-weight:700;color:#ff6a00;text-transform:uppercase;letter-spacing:1px;background:#fff7ed;padding:3px 10px;border-radius:10px;border:1px solid rgba(255,106,0,0.25);white-space:nowrap}
.tour-title{font-size:1rem;font-weight:700;color:#111827;flex:1}
.tour-close{background:none;border:none;color:#9ca3af;font-size:1rem;cursor:pointer;padding:2px 6px;border-radius:6px}
.tour-close:hover{color:#374151}
.tour-body{font-size:0.88rem;color:#6b7280;line-height:1.6}
.tour-footer{display:flex;align-items:center;justify-content:space-between;gap:8px}
.tour-dots{display:flex;gap:5px}
.tour-dot{width:6px;height:6px;border-radius:50%;background:#e5e7eb;transition:background 0.2s}
.tour-dot.on{background:#ff6a00}
.tour-btns{display:flex;gap:8px}
.tour-btn{padding:8px 20px;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;border:none;transition:all 0.15s}
.tour-btn-prev{background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb}
.tour-btn-prev:hover{color:#374151}
.tour-btn-next{background:#ff6a00;color:#fff;box-shadow:0 2px 6px rgba(255,106,0,0.3)}
.tour-btn-next:hover{background:#e55a00}
/* ── Toast ── */
.toast{position:fixed;bottom:24px;right:24px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px 18px;font-size:0.85rem;z-index:500;opacity:0;transform:translateY(8px);transition:all 0.25s;pointer-events:none;max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
.toast.show{opacity:1;transform:translateY(0)}
.toast.ok{border-color:#bbf7d0;color:#16a34a;background:#f0fdf4}
.toast.err{border-color:#fecaca;color:#dc2626;background:#fef2f2}
.toast.info{border-color:#bfdbfe;color:#3b82f6;background:#eff6ff}
/* ── Utility ── */
.mt4{margin-top:4px}.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}.mt24{margin-top:24px}
.flex{display:flex}.gap8{gap:8px}.gap12{gap:12px}.gap16{gap:16px}
.txt-sm{font-size:0.85rem}.txt-xs{font-size:0.75rem}.txt-muted{color:#6b7280}
/* ── Responsive ── */
@media(max-width:900px){
  .sidebar{width:180px}
}
@media(max-width:768px){
  .app-layout{flex-direction:column;height:auto;overflow:visible}
  .sidebar{width:100%;height:auto;flex-direction:row;flex-wrap:wrap;position:sticky;top:0;z-index:50}
  .sidebar-brand{padding:12px 16px;border-bottom:none;border-right:1px solid rgba(255,255,255,0.07)}
  .sidebar-nav{display:flex;flex:1;padding:6px;overflow-x:auto;flex-direction:row}
  .sidebar-section{display:none}
  .nav-item{white-space:nowrap;padding:8px 12px;border-radius:6px}
  .sidebar-footer{display:none}
  .main-content{overflow:visible;height:auto}
  .page-body{padding:16px}
  .form-grid{grid-template-columns:1fr}
  .revoice-cols{grid-template-columns:1fr}
  .edit-panel{width:100%;border-left:none;border-top:1px solid #e5e7eb}
  .custom-row{grid-template-columns:1fr}
  .slots-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:480px){.slots-grid{grid-template-columns:1fr}}
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

const CLIENT_TOUR = [
  { tab: 'pipeline', title: 'Welcome to your Command Center', body: 'This is where your AI-generated video pipeline lives. Every day the pipeline produces fresh content — approved, edited, and ready to post.' },
  { tab: 'pipeline', title: 'Your 4 Pipeline Slots', body: 'Each card is a complete video ready for review. The pipeline fills all 4 slots automatically with your brand\'s content, captions, and hook.' },
  { tab: 'pipeline', title: 'Approve & Post', body: 'Hit "All" to approve and post everything at once, or click the individual platform buttons (TikTok, Instagram, YouTube) to post selectively.' },
  { tab: 'pipeline', title: 'Edit Your Content', body: 'Click the pencil icon on any slot to open the Edit panel. Refine your hook, problem, stakes, resolution, lesson, or captions before posting.' },
  { tab: 'revoice',  title: 'Revoice Studio', body: 'Want to swap the voiceover? Go to Revoice Studio. Load any pipeline slot, edit the script, and record or generate an AI voiceover.' },
  { tab: 'revoice',  title: 'Load a Slot', body: 'Switch to the Pipeline tab and click the microphone icon on any slot card to load it into Revoice Studio with the script auto-filled.' },
  { tab: 'revoice',  title: 'Edit Your Script', body: 'The script is fully editable — change any line, tighten the hook, or rewrite it entirely. Then generate a fresh AI voiceover in one click.' },
  { tab: 'revoice',  title: 'Generate AI Voiceover', body: 'Click "Generate AI Voiceover" to convert your script into a natural-sounding voice. Preview it with the audio player, then hit Bake.' },
  { tab: 'revoice',  title: 'Bake Your Video', body: 'Baking merges your video + new voiceover + background music into a polished final file. Download it directly from the Bake History below.' },
  { tab: 'onboard',  title: 'Business Profile', body: 'Update your business profile, contact info, platform handles, and brand keywords here. The pipeline uses these details to generate content in your voice.' },
];

const ADMIN_TOUR = [
  { tab: 'clients',  title: 'Superadmin Command Center', body: 'You have full visibility across all pipeline clients. Switch between clients, manage their content, and monitor their pipeline from here.' },
  { tab: 'clients',  title: 'All Clients', body: 'The All Clients tab lists every account. Click "View Pipeline" to jump into any client\'s pipeline and manage it as if you were them.' },
  { tab: 'pipeline', title: 'Client Pipeline View', body: 'When viewing a client\'s pipeline as superadmin, you see their exact slot cards, pending approvals, and hook text — manage it on their behalf.' },
  { tab: 'pipeline', title: 'Approve for Clients', body: 'You can approve, skip, re-generate, or edit any client\'s content. Changes sync immediately to their account.' },
  { tab: 'revoice',  title: 'Revoice for Any Client', body: 'Open Revoice Studio to re-voice a client\'s video with a new script and AI voiceover. The baked file is stored against their account.' },
  { tab: 'onboard',  title: 'Onboard New Clients', body: 'The Onboard tab lets you set up a new client\'s profile — business name, platforms, brand voice, content fields — everything the pipeline needs to start generating.' },
];

export default function CommanderNewClient({
  companyName, isSuper, companySlug, targetSlug,
}: { companyName: string; isSuper: boolean; companySlug: string; targetSlug?: string }) {

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
  const [clientRows,    setClientRows]    = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
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
  const [selectedMusic,   setSelectedMusic]   = useState('');
  const [ncPlan,          setNcPlan]          = useState('basic');
  const [revoiceScript,   setRevoiceScript]   = useState('');
  const [revoiceSlotNum,  setRevoiceSlotNum]  = useState<number | null>(null);
  const [ttsLoading,      setTtsLoading]      = useState(false);
  const [postHistory,     setPostHistory]     = useState<any[]>([]);
  const [tourMode,        setTourMode]        = useState<'client' | 'admin' | null>(null);
  const [tourStep,        setTourStep]        = useState(0);
  const [recentVideos,    setRecentVideos]    = useState<{ url: string; filename: string; created_at: string }[]>([]);
  const [tgPosting,       setTgPosting]       = useState<string | null>(null); // video_url being posted
  const [waPosting,       setWaPosting]       = useState<string | null>(null);
  const [hasTg,           setHasTg]           = useState(false);
  const [hasWa,           setHasWa]           = useState(false);

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
    // When superadmin is managing another client, inject forClient into every request
    const fc = targetSlug || '';
    if (body instanceof FormData) {
      if (fc) body.append('forClient', fc);
      opts.body = body;
    } else if (body) {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(fc ? { ...body, forClient: fc } : body);
    }
    const fullUrl = (method === 'GET' && fc)
      ? `${url}${url.includes('?') ? '&' : '?'}forClient=${encodeURIComponent(fc)}`
      : url;
    const r = await fetch(fullUrl, opts);
    if (!r.ok) { const txt = await r.text().catch(() => ''); throw new Error(`${r.status}: ${txt.slice(0, 120)}`); }
    return r.json().catch(() => ({}));
  }

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  async function postToTelegram(videoUrl: string, caption: string) {
    setTgPosting(videoUrl);
    try {
      const body: any = { video_url: videoUrl, caption };
      if (targetSlug) body.forClient = targetSlug;
      const r = await fetch('/api/commander/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (d.ok) showToast('Sent to Telegram ✓');
      else showToast(d.error || 'Telegram send failed', 'err');
    } catch (e: any) {
      showToast(e.message || 'Telegram error', 'err');
    } finally {
      setTgPosting(null);
    }
  }

  async function postToWhatsApp(videoUrl: string, caption: string) {
    setWaPosting(videoUrl);
    try {
      const body: any = { video_url: videoUrl, caption };
      if (targetSlug) body.forClient = targetSlug;
      const r = await fetch('/api/commander/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (d.ok) showToast('Sent to WhatsApp ✓');
      else showToast(d.error || 'WhatsApp send failed', 'err');
    } catch (e: any) {
      showToast(e.message || 'WhatsApp error', 'err');
    } finally {
      setWaPosting(null);
    }
  }

  async function loadRecentVideos() {
    try {
      const fc = targetSlug ? `&forClient=${encodeURIComponent(targetSlug)}` : '';
      const r = await fetch(`/api/commander/recent-videos?hours=48${fc}`, { credentials: 'same-origin' });
      const d = await r.json().catch(() => []);
      setRecentVideos(Array.isArray(d) ? d : []);
    } catch { setRecentVideos([]); }
  }

  async function loadContactFlags() {
    try {
      const fc = targetSlug ? `?forClient=${encodeURIComponent(targetSlug)}` : '';
      const r = await fetch(`/api/commander/onboard${fc}`, { credentials: 'same-origin' });
      const d = await r.json().catch(() => ({}));
      setHasTg(!!(d.profile?.tg_chat_id));
      setHasWa(!!(d.profile?.whatsapp));
    } catch { /* silent */ }
  }

  function switchTab(name: string) {
    setActiveTab(name);
    if (name === 'pipeline') {
      if (!pollRef.current) { loadStatus(); loadSlots(); loadPostHistory(); pollRef.current = setInterval(() => { loadStatus(); loadSlots(); }, 12000); }
      loadRecentVideos();
      loadContactFlags();
    } else { stopPoll(); }
    if (name === 'onboard')  { loadProfile(); }
    if (name === 'revoice')  { loadBakeHistory(); loadMusicTracks(); }
    if (name === 'clients')  { loadClients(); }
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

  async function syncPipeline() {
    try {
      const url = targetSlug ? `/api/commander/pipeline/sync?forClient=${targetSlug}` : '/api/commander/pipeline/sync';
      const r = await api('POST', url);
      if (r.ok) showToast(`↺ Pipeline synced — ${r.synced?.niche_lines || 0} niche lines ready`);
      else showToast('Sync failed: ' + (r.error || 'unknown'), 'err');
    } catch (e: any) { showToast('Sync failed: ' + e.message, 'err'); }
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

  async function approve(slot: number, decision: string, platforms?: string[]) {
    const fd = new FormData();
    fd.append('slot', String(slot));
    fd.append('decision', decision);
    if (platforms && platforms.length > 0) fd.append('platforms', JSON.stringify(platforms));
    const label = platforms?.length ? `→ ${platforms.join(', ')}` : decision;
    try { await api('POST', '/api/commander/pipeline/approve', fd); showToast(`Slot ${slot} — ${label}`); setTimeout(loadSlots, 1500); }
    catch (e: any) { showToast(e.message, 'err'); }
  }

  function openEdit(slot: number) {
    const s = slots[String(slot)] || {};
    setEditSlotNum(slot); setEditHook(s.hook || ''); setEditProblem(s.problem || '');
    setEditStakes(s.stakes || ''); setEditRes(s.resolution || ''); setEditLesson(s.lesson || '');
    setEditTiktok(s.caption_tiktok || ''); setEditInsta(s.caption_instagram || ''); setEditOpen(true);
  }

  async function submitEdit(andRegen = false) {
    if (!editSlotNum) return;
    const fields = [
      { field: 'hook', value: editHook }, { field: 'problem', value: editProblem },
      { field: 'stakes', value: editStakes }, { field: 'resolution', value: editRes },
      { field: 'lesson', value: editLesson }, { field: 'caption_tiktok', value: editTiktok },
      { field: 'caption_instagram', value: editInsta },
    ];
    try {
      for (const { field, value } of fields) {
        const fd = new FormData(); fd.append('slot', String(editSlotNum)); fd.append('field', field); fd.append('value', value);
        await api('POST', '/api/commander/pipeline/edit-field', fd);
      }
      if (andRegen) {
        await approve(editSlotNum, 'regen');
        showToast(`✅ Slot ${editSlotNum} saved — re-rendering…`);
      } else {
        showToast(`✅ Slot ${editSlotNum} saved`);
      }
      setEditOpen(false); setTimeout(loadSlots, 800);
    } catch (e: any) { showToast('Edit failed: ' + e.message, 'err'); }
  }

  async function blockMedia() {
    const id = parseInt(blockIdRef.current?.value || '0');
    if (!id) { showToast('Enter a media ID', 'err'); return; }
    const fd = new FormData(); fd.append('media_id', String(id));
    try { await api('POST', '/api/commander/pipeline/block-media', fd); showToast(`Media ${id} blocked`); if (blockIdRef.current) blockIdRef.current.value = ''; }
    catch (e: any) { showToast(e.message, 'err'); }
  }

  function revoiceSlot(n: number, useV2?: boolean) {
    const s = slots[String(n)] || {};
    const isV2 = useV2 ?? v2Active[n] ?? false;
    const videoSrc = isV2 ? (s.v2 || s.v1) : (s.v1 || '');
    const url = videoSrc ? vidUrl(videoSrc) : '';
    vidPathRef.current = videoSrc || '';
    setVidPreview(url);
    setVidNameStr(`Pipeline Slot ${n}${isV2 ? ' — V2' : ' — V1'}`);
    const hook    = isV2 ? (s.hook_v2   || s.hook   || '') : (s.hook   || '');
    const lesson  = isV2 ? (s.lesson_v2 || s.lesson || '') : (s.lesson || '');
    const script = [hook, s.problem, s.stakes, s.resolution, lesson]
      .filter(Boolean).join('\n\n');
    setRevoiceScript(script);
    setRevoiceSlotNum(n);
    switchTab('revoice');
    showToast(`Slot ${n} ${isV2 ? '(V2)' : '(V1)'} loaded into Revoice Studio`);
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
    // Prefer local pipeline tracks (resolved on Oracle), fall back to Supabase library
    try {
      const pl = await api('GET', '/api/commander/pipeline/music-list').catch(() => []);
      const sb = await api('GET', '/api/commander/music-tracks').catch(() => []);
      const combined = [...(Array.isArray(pl) ? pl : []), ...(Array.isArray(sb) ? sb : [])];
      setMusicTracks(combined);
    } catch { /* silent */ }
  }

  async function loadBakeHistory() {
    try { const rows = await api('GET', '/api/commander/bakes'); setBakeRows(Array.isArray(rows) ? rows : []); } catch { /* silent */ }
  }

  async function refreshTracks() {
    try {
      const pl = await api('GET', '/api/commander/pipeline/music-list').catch(() => []);
      const sb = await api('GET', '/api/commander/music-tracks').catch(() => []);
      const combined = [...(Array.isArray(pl) ? pl : []), ...(Array.isArray(sb) ? sb : [])];
      setMusicTracks(combined);
      showToast(`${combined.length} tracks loaded`);
    } catch (e: any) { showToast(e.message, 'err'); }
  }

  function dzOver(e: React.DragEvent) { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('dragover'); }
  function dzLeave(e: React.DragEvent) { (e.currentTarget as HTMLElement).classList.remove('dragover'); }
  function dzDrop(e: React.DragEvent) { e.preventDefault(); dzLeave(e); if (e.dataTransfer.files[0]) uploadVid(e.dataTransfer.files[0]); }

  async function uploadVid(file: File) {
    try {
      const fd = new FormData(); fd.append('file', file);
      if (targetSlug) fd.append('forClient', targetSlug);
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
    if (targetSlug) fd.append('forClient', targetSlug);
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
    if (!q) { showToast('Enter a YouTube URL or search term', 'err'); return; }
    setYtStatus('⏳ Downloading via yt-dlp on Oracle… (~30 seconds)');
    const fd = new FormData(); fd.append('query', q);
    if (targetSlug) fd.append('forClient', targetSlug);
    try {
      const r = await fetch('/api/commander/revoice/youtube-music', { method: 'POST', body: fd });
      if (!r.ok) {
        const errText = await r.text().catch(() => 'Unknown error');
        setYtStatus(`❌ Failed: ${errText.slice(0, 120)}`);
        return;
      }
      const d = await r.json();
      setMusicTracks(prev => {
        const already = prev.some(t => t.path === d.path);
        return already ? prev : [...prev, { label: d.label, path: d.path }];
      });
      if (musicSelRef.current) {
        musicSelRef.current.value = d.path;
      }
      setYtStatus(`✅ Added: ${d.label}`);
      if (ytQueryRef.current) ytQueryRef.current.value = '';
    } catch (e: any) { setYtStatus(`❌ ${(e as any).message}`); }
  }

  async function generateTTS() {
    const text = revoiceScript.trim();
    if (!text) { showToast('Write a script first', 'err'); return; }
    setTtsLoading(true);
    try {
      const fd = new FormData();
      fd.append('text', text);
      fd.append('voice', 'nova');
      if (targetSlug) fd.append('forClient', targetSlug);
      const r = await fetch('/api/commander/revoice/tts', { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const blob = await r.blob();
      voiceBlobRef.current = blob;
      voiceFileRef.current = null;
      const url = URL.createObjectURL(blob);
      setVoicePlayUrl(url);
      setVoiceReady('✅ AI voiceover generated from script');
      showToast('Voiceover ready — click Bake Video below');
    } catch (e: any) { showToast('TTS failed: ' + e.message, 'err'); }
    finally { setTtsLoading(false); }
  }

  // ── Clients ──────────────────────────────────────────────────────────────────

  async function loadClients() {
    setClientsLoading(true);
    try { const rows = await api('GET', '/api/commander/clients'); setClientRows(Array.isArray(rows) ? rows : []); }
    catch (e: any) { showToast(e.message, 'err'); }
    finally { setClientsLoading(false); }
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
    // Detect tour mode from URL param and switch to first step's tab
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get('tour');
      if (t === 'client') {
        setTourMode('client'); setTourStep(0);
        const first = CLIENT_TOUR[0];
        if (first?.tab) switchTab(first.tab);
      } else if (t === 'admin') {
        setTourMode('admin'); setTourStep(0);
        const first = ADMIN_TOUR[0];
        if (first?.tab) switchTab(first.tab);
      }
    }

    (async () => {
      try {
        const r = await api('GET', '/api/commander/onboard');
        const p = r.profile;
        if (p) fillProfile(p);
        // Don't override tab if tour mode already set it
        const sp2 = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        if (sp2?.get('tour')) return;
        // Super-admin managing another client always lands on Pipeline
        if (isSuper && targetSlug && targetSlug !== companySlug) {
          switchTab('pipeline');
        } else {
          switchTab(p?.business_name ? 'pipeline' : 'onboard');
        }
      } catch {
        const sp2 = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        if (!sp2?.get('tour')) switchTab(isSuper && targetSlug && targetSlug !== companySlug ? 'pipeline' : 'onboard');
      }
    })();
    return () => { stopPoll(); if (bakeInterval.current) clearInterval(bakeInterval.current); };
  }, []);

  // ── Slot card ────────────────────────────────────────────────────────────────

  function SlotCard({ n }: { n: number }) {
    const s      = slots[String(n)] || {};
    const ip     = !!s.pending_approval;
    const hasVid = !!(s.v1 || s.v2);
    const v1     = s.v1 ? vidUrl(s.v1) : '';
    const v2     = s.v2 ? vidUrl(s.v2) : '';
    const ts     = s.rendered_at ? new Date(s.rendered_at).toLocaleString() : '';
    const showV2 = v2Active[n] || false;
    const displayHook = showV2 ? (s.hook_v2 || s.hook || '') : (s.hook || '');
    const v2SameText  = showV2 && !s.hook_v2 && !!s.hook;
    const cap         = s.caption_tiktok || '';
    const currentSrc  = showV2 ? (v2 || v1) : v1;
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
            : <div className="no-video">
                <div className="no-video-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <div className="no-video-text">No video yet</div>
              </div>}
        </div>
        <div className="slot-body">
          {(v1 && v2) && <button className="v2-toggle" onClick={() => setV2Active(p => ({ ...p, [n]: !p[n] }))}>{showV2 ? '← V1' : 'V2 →'}</button>}
          {displayHook && <div className="slot-hook">{displayHook}{v2SameText && <span style={{ color: '#777', fontSize: '0.65rem' }}> (same text as V1)</span>}</div>}
          {cap && <div className="slot-caption"><strong>TK:</strong> {cap.slice(0, 90)}{cap.length > 90 ? '…' : ''}</div>}
          {ts && <div className="slot-ts">{ts}</div>}
          <div className="slot-actions">
            <button className={`btn ${ip ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => approve(n, 'post')} disabled={!hasVid} title="Post to all active platforms">✅ All</button>
            <button className="btn btn-skip"
              onClick={() => approve(n, 'skip')} disabled={!hasVid} title="Skip this slot">⏭</button>
            <button className="btn btn-secondary"
              onClick={() => approve(n, 'regen')} title="Regenerate content">🔄</button>
            <button className="btn btn-secondary" onClick={() => openEdit(n)} title="Edit text">✏️</button>
            <button className="btn btn-secondary" onClick={() => revoiceSlot(n, showV2)} title="Revoice Studio">🎙</button>
          </div>
          {hasVid && (
            <div className="platform-btns">
              {[['TikTok','tiktok'],['IG','instagram'],['YT','youtube'],['LI','linkedin'],['Blog','blog']].map(([label, key]) => (
                <button key={key} className="plat-btn" onClick={() => approve(n, 'post', [key])} title={`Post to ${label} only`}>{label}</button>
              ))}
              {hasTg && (
                <button className="plat-btn plat-btn-tg" disabled={tgPosting === currentSrc}
                  title="Send to Telegram"
                  onClick={() => postToTelegram(currentSrc, displayHook)}>
                  {tgPosting === currentSrc ? '…' : 'TG'}
                </button>
              )}
              {hasWa && (
                <button className="plat-btn plat-btn-wa" disabled={waPosting === currentSrc}
                  title="Send to WhatsApp"
                  onClick={() => postToWhatsApp(currentSrc, displayHook)}>
                  {waPosting === currentSrc ? '…' : 'WA'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const NavIcon = ({ d }: { d: string }) => (
    <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="app-layout">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo"><span>Boot</span>Hop</div>
            <div className="sidebar-tagline">Commander</div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section">Content</div>
            <button className={`nav-item${activeTab === 'pipeline' ? ' active' : ''}`} onClick={() => switchTab('pipeline')}>
              <NavIcon d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.258a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              Pipeline
            </button>
            <button className={`nav-item${activeTab === 'revoice' ? ' active' : ''}`} onClick={() => switchTab('revoice')}>
              <NavIcon d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 3a7 7 0 017 7" />
              Revoice Studio
            </button>
            <div className="sidebar-section">Account</div>
            <button className={`nav-item${activeTab === 'onboard' ? ' active' : ''}`} onClick={() => switchTab('onboard')}>
              <NavIcon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              Settings
            </button>
            {isSuper && (
              <>
                <div className="sidebar-section">Admin</div>
                <button className={`nav-item${activeTab === 'clients' ? ' active' : ''}`} onClick={() => switchTab('clients')}>
                  <NavIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  All Clients
                </button>
              </>
            )}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-client">
              <div className="sidebar-client-name">{companyName}</div>
              <div className="sidebar-client-role">{isSuper ? 'Superadmin' : 'Client'}</div>
            </div>
            <a href="/api/commander/logout" className="sidebar-logout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sign out
            </a>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="main-content">
          <div className="topbar">
            <div className="topbar-title">
              {activeTab === 'pipeline' && 'Content Pipeline'}
              {activeTab === 'revoice'  && 'Revoice Studio'}
              {activeTab === 'onboard'  && 'Settings & Profile'}
              {activeTab === 'clients'  && 'All Clients'}
              {!activeTab && 'Commander'}
            </div>
            {targetSlug && targetSlug !== companySlug && (
              <span className="topbar-badge">Viewing: {targetSlug}</span>
            )}
            {pillPending.show && <span className="pill pill-warn" style={{ fontSize: '0.7rem' }}>{pillPending.text}</span>}
            {cloudMode && <span className="pill pill-cloud" style={{ fontSize: '0.7rem' }}>☁ Cloud</span>}
          </div>

          <div className="page-body">

        {/* ── ONBOARD TAB ─────────────────────────────────────────────────────── */}
        <div className={`tab-pane${activeTab === 'onboard' ? ' active' : ''}`}>
          <div className="section-title">
            Onboard Profile
            <small>Powers the AI pipeline — same data as your public onboarding page</small>
            {!isSuper && (
              <a href="/client-onboarding" target="_blank" rel="noreferrer"
                style={{ fontSize: '0.72rem', color: '#ff6a00', marginLeft: 'auto', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Public onboarding page →
              </a>
            )}
          </div>
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
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e5e7eb' }}>
            <button className="btn btn-secondary" onClick={syncPipeline} style={{ borderColor: '#ff6a00', color: '#ff6a00' }}>
              ↺ Refresh Pipeline
            </button>
            <p style={{ marginTop: '6px', fontSize: '0.72rem', color: '#888', lineHeight: 1.5 }}>
              Pushes your saved niche &amp; bio to the Oracle server so the next generated post uses your latest profile. Save first.
            </p>
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

          {recentVideos.length > 0 && (
            <div className="mt24">
              <div className="section-title">
                Recent 48h Videos
                <small>Generated by pipeline — send directly to Telegram or WhatsApp</small>
              </div>
              <div className="recent-videos-strip">
                {recentVideos.map((v, i) => {
                  const label = v.filename.replace(/\.(mp4)$/i, '').slice(0, 22);
                  const dateStr = v.created_at ? new Date(v.created_at).toLocaleString() : '';
                  return (
                    <div key={i} className="recent-vid-card">
                      <video src={v.url} className="recent-vid-thumb" playsInline muted preload="metadata" />
                      <div className="recent-vid-footer">
                        <div className="recent-vid-name" title={v.filename}>{label}</div>
                        {dateStr && <div className="recent-vid-name">{dateStr}</div>}
                        <div className="recent-vid-btns">
                          {hasTg && (
                            <button className="recent-vid-btn rvb-tg" disabled={tgPosting === v.url}
                              onClick={() => postToTelegram(v.url, label)}>
                              {tgPosting === v.url ? '…' : 'TG'}
                            </button>
                          )}
                          {hasWa && (
                            <button className="recent-vid-btn rvb-wa" disabled={waPosting === v.url}
                              onClick={() => postToWhatsApp(v.url, label)}>
                              {waPosting === v.url ? '…' : 'WA'}
                            </button>
                          )}
                          {!hasTg && !hasWa && (
                            <span style={{ fontSize: '0.58rem', color: '#555' }}>Add TG/WA in Onboard</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                  <div key={i} className="history-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="history-meta">{p.date} · {p.platform} · Slot {p.slot}</div>
                      <div className="history-hook">{p.hook || '—'}</div>
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
                <select className="music-sel" ref={musicSelRef}
                  onChange={e => setSelectedMusic(e.target.value)}>
                  <option value="">No background music</option>
                  {musicTracks.map((t, i) => <option key={i} value={t.path}>{t.label}</option>)}
                </select>
                {selectedMusic && selectedMusic.startsWith('https://') && (
                  <audio key={selectedMusic} src={selectedMusic} controls
                    style={{ width: '100%', marginTop: '8px', height: '36px' }} />
                )}
                <button className="btn btn-secondary btn-sm" onClick={refreshTracks} style={{ marginTop: '8px' }}>Refresh tracks</button>
                <p className="or-sep mt8">— add from YouTube —</p>
                <div className="yt-row">
                  <input type="text" ref={ytQueryRef} placeholder="YouTube URL or title (e.g. afrobeats chill)" />
                  <button className="btn btn-secondary btn-sm" onClick={addYT}>Get</button>
                </div>
                <div className="txt-xs txt-muted" style={{ marginTop: '4px' }}>Paste a YouTube link or enter a search term — downloads via Oracle</div>
                {ytStatus && <div className="txt-xs" style={{ marginTop: '6px', color: ytStatus.startsWith('✅') ? '#4ade80' : ytStatus.startsWith('❌') ? '#fca5a5' : '#fbbf24' }}>{ytStatus}</div>}
              </div>
            </div>

            <div>
              <div className="rv-card">
                <h3>Script {revoiceSlotNum ? `— Slot ${revoiceSlotNum}` : ''}</h3>
                <textarea
                  className="rv-textarea"
                  value={revoiceScript}
                  onChange={e => setRevoiceScript(e.target.value)}
                  placeholder="Load a slot from Pipeline tab to auto-fill, or type your script here…"
                  rows={5}
                />
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '10px' }}
                  onClick={generateTTS}
                  disabled={ttsLoading || !revoiceScript.trim()}
                >
                  {ttsLoading ? '⏳ Generating voiceover…' : '🎙 Generate AI Voiceover'}
                </button>
                <p className="txt-xs txt-muted" style={{ marginTop: '6px' }}>
                  AI voice from your script text — fills the Voice section. Or record / upload manually.
                </p>
              </div>

              <div className="rv-card mt12">
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
              <small>Click a row to open that client&apos;s pipeline</small>
              <button className="btn btn-secondary btn-sm" onClick={loadClients} style={{ marginLeft: 'auto' }}>Refresh</button>
            </div>
            {clientsLoading
              ? <p className="txt-sm txt-muted">Loading…</p>
              : clientRows.length === 0
              ? <p className="txt-sm txt-muted">No clients yet.</p>
              : <table className="clients-tbl">
                  <thead><tr><th>Company</th><th>Slug</th><th>Plan</th><th>Status</th><th>Created</th><th></th></tr></thead>
                  <tbody>
                    {clientRows.map((c, i) => (
                      <tr key={i} style={{ cursor: 'pointer' }}
                        onClick={() => { window.location.href = `/commander/pipeline/${c.slug}`; }}>
                        <td>{c.name || c.company}{c.is_super_admin ? <span style={{ color: '#ff6a00', fontSize: '0.7rem' }}> SUPER</span> : ''}</td>
                        <td className="txt-sm txt-muted">{c.slug}</td>
                        <td className="txt-sm txt-muted">{c.plan || 'basic'}</td>
                        <td>{c.is_active !== false ? <><span className="adot" />Active</> : <><span className="idot" />Inactive</>}</td>
                        <td className="txt-xs txt-muted">{(c.created_at || '').slice(0, 10)}</td>
                        <td style={{ textAlign: 'right', paddingRight: '8px' }}>
                          <span style={{ color: '#ff6a00', fontSize: '0.75rem', fontWeight: 600 }}>Open →</span>
                        </td>
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

          </div>{/* end page-body */}
        </div>{/* end main-content */}
      </div>{/* end app-layout */}

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
        <div className="flex gap8 mt16" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => submitEdit(true)} style={{ flex: '1 1 100%' }}>💾 Save &amp; Re-render</button>
          <button className="btn btn-secondary" onClick={() => submitEdit(false)} style={{ flex: 1 }}>Save Only</button>
          <button className="btn btn-secondary" onClick={() => setEditOpen(false)} style={{ flex: 1 }}>Cancel</button>
        </div>
      </div>

      {/* TOAST */}
      <div className={`toast${toast.show ? ' show' : ''} ${toast.type}`}>{toast.msg}</div>

      {/* TOUR OVERLAY */}
      {tourMode && (() => {
        const steps = tourMode === 'admin' ? ADMIN_TOUR : CLIENT_TOUR;
        const step  = steps[tourStep] ?? steps[0];
        const isLast = tourStep >= steps.length - 1;

        function advanceTour(delta: number) {
          const next = tourStep + delta;
          if (next < 0) return;
          if (next >= steps.length) { setTourMode(null); return; }
          const nextStep = steps[next];
          if (nextStep.tab && nextStep.tab !== activeTab) switchTab(nextStep.tab);
          setTourStep(next);
        }

        return (
          <div className="tour-bar">
            <div className="tour-header">
              <span className="tour-badge">{tourMode === 'admin' ? 'Superadmin Demo' : 'Client Demo'} · {tourStep + 1}/{steps.length}</span>
              <span className="tour-title">{step.title}</span>
              <button className="tour-close" onClick={() => setTourMode(null)}>✕</button>
            </div>
            <p className="tour-body">{step.body}</p>
            <div className="tour-footer">
              <div className="tour-dots">
                {steps.map((_, i) => <span key={i} className={`tour-dot${i === tourStep ? ' on' : ''}`} />)}
              </div>
              <div className="tour-btns">
                {tourStep > 0 && <button className="tour-btn tour-btn-prev" onClick={() => advanceTour(-1)}>← Back</button>}
                <button className="tour-btn tour-btn-next" onClick={() => advanceTour(1)}>
                  {isLast ? 'Finish Tour' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
