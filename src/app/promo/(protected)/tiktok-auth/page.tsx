import { cookies } from 'next/headers';

const BASE_URL = 'https://www.boothop.com';

export default async function TikTokAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; refresh_token?: string; expires_in?: string; scope?: string; error?: string }>;
}) {
  const params        = await searchParams;
  const hasClientKey  = !!process.env.BD_TIKTOK_CLIENT_KEY;
  const hasClientSec  = !!process.env.BD_TIKTOK_CLIENT_SECRET;
  const hasToken      = !!process.env.BD_TIKTOK_TOKEN;
  const newToken      = params.token;
  const authError     = params.error;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 700 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#F9FAFB' }}>🎵 TikTok Account Authorization</h1>
        <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Connect your TikTok account so the dashboard can post videos on your behalf.</p>
      </div>

      {/* Success — new token received */}
      {newToken && (
        <div style={{ background: '#052e16', border: '1px solid #16a34a44', borderRadius: 16, padding: 24 }}>
          <div style={{ color: '#86efac', fontWeight: 800, fontSize: 16, marginBottom: 12 }}>✅ Authorization successful!</div>
          <p style={{ color: '#6ee7b7', fontSize: 13, margin: '0 0 16px' }}>
            Copy the access token below and add it to Vercel as <code style={{ background: '#1F2937', padding: '2px 6px', borderRadius: 4 }}>BD_TIKTOK_TOKEN</code>.
          </p>

          <div style={{ marginBottom: 16 }}>
            <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Access Token (copy this into Vercel)</div>
            <div style={{ background: '#0D1117', border: '1px solid #374151', borderRadius: 10, padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#A78BFA', wordBreak: 'break-all' }}>
              {newToken}
            </div>
          </div>

          {params.refresh_token && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Refresh Token (save this too)</div>
              <div style={{ background: '#0D1117', border: '1px solid #374151', borderRadius: 10, padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#6B7280', wordBreak: 'break-all' }}>
                {params.refresh_token}
              </div>
            </div>
          )}

          {params.expires_in && (
            <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>
              Token expires in {Math.round(Number(params.expires_in) / 86400)} days · Scopes: {params.scope}
            </p>
          )}

          <div style={{ marginTop: 20, background: '#1F2937', borderRadius: 12, padding: 16, fontSize: 13, color: '#93C5FD', lineHeight: 1.8 }}>
            <strong>Next steps:</strong><br />
            1. Go to <strong>Vercel → your project → Settings → Environment Variables</strong><br />
            2. Add <code style={{ background: '#0D1117', padding: '1px 5px', borderRadius: 4 }}>BD_TIKTOK_TOKEN</code> = the access token above<br />
            3. Redeploy (or it takes effect on next deploy)<br />
            4. Go to Publish and click ↑ TikTok — it will now work
          </div>
        </div>
      )}

      {/* Error */}
      {authError && !newToken && (
        <div style={{ background: '#7f1d1d33', border: '1px solid #ef444444', borderRadius: 12, padding: 16, color: '#fca5a5', fontSize: 13 }}>
          ❌ Authorization failed: <strong>{authError}</strong>
          {authError === 'missing_client_key' && (
            <div style={{ marginTop: 8, color: '#fcd34d' }}>Add <code>BD_TIKTOK_CLIENT_KEY</code> to Vercel environment variables first (see Step 1 below).</div>
          )}
          {authError === 'missing_credentials' && (
            <div style={{ marginTop: 8, color: '#fcd34d' }}>Add both <code>BD_TIKTOK_CLIENT_KEY</code> and <code>BD_TIKTOK_CLIENT_SECRET</code> to Vercel first.</div>
          )}
        </div>
      )}

      {/* Status checklist */}
      <div style={{ background: '#111827', borderRadius: 14, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#F9FAFB', marginBottom: 14 }}>Setup status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'BD_TIKTOK_CLIENT_KEY set in Vercel',    done: hasClientKey },
            { label: 'BD_TIKTOK_CLIENT_SECRET set in Vercel', done: hasClientSec },
            { label: 'BD_TIKTOK_TOKEN set in Vercel',         done: hasToken     },
          ].map(({ label, done }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>{done ? '✅' : '⬜'}</span>
              <span style={{ color: done ? '#86efac' : '#9CA3AF', fontSize: 13 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 */}
      <div style={{ background: '#111827', borderRadius: 14, padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px' }}>Step 1 — Add credentials to Vercel</h2>
        <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 14px', lineHeight: 1.7 }}>
          From your approved TikTok app in the <strong style={{ color: '#E5E7EB' }}>TikTok Developer Portal</strong>, copy these two values and add them as Vercel environment variables:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'BD_TIKTOK_CLIENT_KEY',    hint: 'Also called "Client Key" or "App Key" in the TikTok portal'    },
            { key: 'BD_TIKTOK_CLIENT_SECRET', hint: 'Also called "Client Secret" — keep this private'               },
          ].map(({ key, hint }) => (
            <div key={key} style={{ background: '#1F2937', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'monospace', color: '#A78BFA', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{key}</div>
              <div style={{ color: '#6B7280', fontSize: 12 }}>{hint}</div>
            </div>
          ))}
        </div>
        <p style={{ color: '#6B7280', fontSize: 12, margin: '14px 0 0', lineHeight: 1.6 }}>
          Vercel → Project → Settings → Environment Variables → Add new → paste key + value → Save → Redeploy
        </p>
      </div>

      {/* Step 2 */}
      <div style={{ background: '#111827', borderRadius: 14, padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px' }}>Step 2 — Register the callback URL in TikTok</h2>
        <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 14px', lineHeight: 1.7 }}>
          In your TikTok app settings, add this exact URL as an allowed <strong style={{ color: '#E5E7EB' }}>Redirect URI</strong>:
        </p>
        <div style={{ background: '#1F2937', borderRadius: 10, padding: '12px 14px', fontFamily: 'monospace', color: '#7C3AED', fontSize: 13, wordBreak: 'break-all' }}>
          {BASE_URL}/api/bd/tiktok-callback
        </div>
        <p style={{ color: '#6B7280', fontSize: 12, margin: '12px 0 0' }}>
          TikTok Developer Portal → Your App → Edit → Web Redirect URIs → Add the URL above → Save
        </p>
      </div>

      {/* Step 3 */}
      <div style={{ background: '#111827', borderRadius: 14, padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px' }}>Step 3 — Authorize your TikTok account</h2>
        <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 20px', lineHeight: 1.7 }}>
          Once Steps 1 and 2 are done, click the button below. You'll be taken to TikTok to log in and approve posting permissions. You'll be redirected back here with your access token.
        </p>
        {hasClientKey ? (
          <a href="/api/bd/tiktok-auth-init" style={{ display: 'inline-block', background: '#FF004F', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 800, padding: '14px 32px', textDecoration: 'none' }}>
            🎵 Authorize with TikTok →
          </a>
        ) : (
          <div style={{ background: '#1F2937', borderRadius: 10, padding: '14px 20px', color: '#6B7280', fontSize: 13 }}>
            Complete Step 1 first — add <code>BD_TIKTOK_CLIENT_KEY</code> to Vercel, then redeploy and come back here.
          </div>
        )}
      </div>
    </div>
  );
}
