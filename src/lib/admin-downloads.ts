// Files served only to authenticated admins, never from /public.
// Add an entry here (and drop the file into private/downloads/) to expose
// a new admin-only download — the API route only serves filenames listed here.
export const ADMIN_DOWNLOADS = [
  { file: 'boothop-pitch-deck.pdf',            label: 'Pitch Deck' },
  { file: 'boothop-executive-summary.pdf',     label: 'Executive Summary' },
  { file: 'boothop-gener8tor-application.pdf', label: 'Gener8tor Application' },
  { file: 'boothop-team-snapshot-aug2025.pdf', label: 'Team Snapshot (Aug 2025)' },
  { file: 'boothop-site-doc1-user-pages.pdf',  label: 'Site Doc — User Pages (v1)' },
  { file: 'boothop-site-doc2-admin-pages.pdf', label: 'Site Doc — Admin Pages (v1)' },
  { file: 'boothop-v2-doc1-user-pages.pdf',    label: 'Site Doc — User Pages (v2)' },
  { file: 'boothop-v2-doc2-admin-pages.pdf',   label: 'Site Doc — Admin Pages (v2)' },
  { file: 'boothop-v2-doc3-mobile-app.pdf',    label: 'Site Doc — Mobile App (v2)' },
  { file: 'oluwatoyin-olufeko-cv.pdf',         label: 'CV — Oluwatoyin Olufeko' },
  { file: 'Screenshot 2026-08-26 191307.png',  label: 'Screenshot (26 Aug 2026)' },
] as const;
