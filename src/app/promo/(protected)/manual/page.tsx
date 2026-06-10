export default function ManualPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 820 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#F9FAFB' }}>📖 BootHop Promo — User Manual</h1>
        <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Everything you need to know to run the social content pipeline</p>
      </div>

      {/* Access */}
      <Section title="1. Accessing the Dashboard" icon="🔐">
        <Step n="1" text="Go to boothop.com/promo/login" />
        <Step n="2" text="Click 'Send Code →' — a 6-digit code is emailed to oluwatoyinb@yahoo.com" />
        <Step n="3" text="Enter the code within 15 minutes and click 'Access Dashboard →'" />
        <Step n="4" text="You are now logged in. Session is cookie-based — you stay logged in until you sign out." />
        <Note>To sign out, click 'Sign out' in the top-right corner of the nav bar.</Note>
      </Section>

      {/* Overview */}
      <Section title="2. Overview Page" icon="⚡">
        <p style={para}>The first page you see after login. It shows:</p>
        <ul style={list}>
          <li>Content counts by status (draft, review, approved, queued, rendering, rendered, posted, archived)</li>
          <li>The 6 most recently created pieces of content</li>
          <li>Activity log — system notifications for completions and errors</li>
          <li>Quick-links to all sections</li>
        </ul>
        <Note>Click any notification in the Activity Log to mark it as read.</Note>
      </Section>

      {/* Generate */}
      <Section title="3. Generate Content" icon="✨">
        <p style={para}>Use AI to create video scripts, captions, hashtags, and A/B hook variants.</p>
        <SubHeading>Step-by-step</SubHeading>
        <Step n="1" text="Choose a daily slot (7am / 12pm / 6pm / 9pm) — this auto-picks the right content pillar." />
        <Step n="2" text="Or manually choose: Pillar, Tone/Template, and Platform." />
        <Step n="3" text="Click '✨ Generate' for one piece, or '⚡ Generate all 4 slots' for a full day's content." />
        <Step n="4" text="Review the output: hook variants (A/B/C), full script, caption, hashtags, visual description." />
        <Step n="5" text="Use the 'Copy' buttons to grab individual sections." />
        <Step n="6" text="Click 'View in library →' to manage the generated piece." />
        <SubHeading>Content pillars</SubHeading>
        <ul style={list}>
          <li><strong style={{ color: '#A78BFA' }}>Logistics Stories</strong> — real delivery stories, BootHop use cases</li>
          <li><strong style={{ color: '#A78BFA' }}>Travel Hacks</strong> — tips for travellers, earning while you travel</li>
          <li><strong style={{ color: '#A78BFA' }}>Airport Deliveries</strong> — airport-specific content, customs, OBC</li>
          <li><strong style={{ color: '#A78BFA' }}>Supply Chain Failures</strong> — news-style content about logistics gone wrong</li>
        </ul>
      </Section>

      {/* Library */}
      <Section title="4. Content Library" icon="📚">
        <p style={para}>All generated content lives here. Filter by status or pillar, review, edit, and approve.</p>
        <SubHeading>Status workflow</SubHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {[
            { status: 'draft',    color: '#6B7280', desc: 'Just generated — needs review'         },
            { status: 'review',   color: '#F59E0B', desc: 'Flagged for a second look'             },
            { status: 'approved', color: '#3B82F6', desc: 'Ready for video rendering'             },
            { status: 'queued',   color: '#8B5CF6', desc: 'In the render queue'                   },
            { status: 'rendering',color: '#06B6D4', desc: 'Python script is making the video'    },
            { status: 'rendered', color: '#10B981', desc: 'Video ready — can post to socials'     },
            { status: 'posted',   color: '#22C55E', desc: 'Live on TikTok or Instagram'           },
            { status: 'archived', color: '#374151', desc: 'Hidden from active pipeline'           },
          ].map(s => (
            <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 10, background: `${s.color}22`, color: s.color, borderRadius: 6, padding: '3px 10px', fontWeight: 700, minWidth: 80, textAlign: 'center' }}>{s.status}</span>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>{s.desc}</span>
            </div>
          ))}
        </div>
        <SubHeading>Actions</SubHeading>
        <ul style={list}>
          <li><strong style={{ color: '#E5E7EB' }}>▼ Expand</strong> — see the full script, hashtags, and A/B variant performance</li>
          <li><strong style={{ color: '#E5E7EB' }}>✏️ Edit</strong> — modify the hook, caption, hashtags, visual description, or full script before publishing</li>
          <li><strong style={{ color: '#EF4444' }}>🗑 Delete</strong> — permanently removes the content</li>
          <li><strong style={{ color: '#E5E7EB' }}>→ status buttons</strong> — move content through the workflow with one click</li>
        </ul>
        <Note>To send content to the Publish page, move it to 'approved' status here.</Note>
      </Section>

      {/* Publish */}
      <Section title="5. Publish Queue" icon="🚀">
        <p style={para}>This is where you manually post to Instagram and TikTok. Only approved/queued/rendering/rendered content appears here.</p>
        <SubHeading>Posting workflow</SubHeading>
        <Step n="1" text="Approve content in the Library — it will appear in this Publish queue." />
        <Step n="2" text="Click '🎬 Render' to queue video generation. The Python pipeline on your machine processes it." />
        <Step n="3" text="When status changes to 'rendered', a '▶ Preview video' link appears — check the video first." />
        <Step n="4" text="Click '↑ TikTok' to post to TikTok, or '↑ Instagram' to post to Instagram." />
        <Step n="5" text="Both buttons send the video through the API. Status updates to 'posted' on success." />
        <SubHeading>How each platform works</SubHeading>
        <ul style={list}>
          <li><strong style={{ color: '#FF0050' }}>TikTok</strong> — uses PULL_FROM_URL: TikTok fetches the video directly from Supabase Storage. No upload needed.</li>
          <li><strong style={{ color: '#E1306C' }}>Instagram</strong> — uses the Graph API Reels flow: video URL → create container → publish container.</li>
        </ul>
        <Note>You can post the same content to both platforms separately — just click both buttons.</Note>
      </Section>

      {/* Analytics */}
      <Section title="6. Analytics" icon="📊">
        <p style={para}>Track performance of posted content. The score formula weights engagement by value:</p>
        <div style={{ background: '#1F2937', borderRadius: 10, padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, color: '#A78BFA', marginBottom: 16 }}>
          score = views×1 + likes×3 + comments×4 + shares×6 + saves×5 + clicks×8 + conversions×20
        </div>
        <ul style={list}>
          <li>KPI cards show totals across all posted content</li>
          <li>Pillar breakdown shows which content type gets the most views</li>
          <li>Sort by score, views, or date to find your best-performing content</li>
          <li>A/B variant performance shows which hook won on each post</li>
        </ul>
        <Note>Analytics data is pulled from the database. Update view/like/click counts by editing the content record directly if you have manual data to enter.</Note>
      </Section>

      {/* Troubleshooting */}
      <Section title="7. Troubleshooting" icon="🔧">
        <SubHeading>Login not working</SubHeading>
        <ul style={list}>
          <li>Check oluwatoyinb@yahoo.com for the code — check spam folder</li>
          <li>Code expires in 15 minutes — click 'Resend code' if needed</li>
          <li>Make sure you are at /promo/login (not the old /bdpipe_admin URL)</li>
        </ul>
        <SubHeading>Generate fails with an error</SubHeading>
        <ul style={list}>
          <li>Check that the OPENAI_API_KEY environment variable is set in Vercel</li>
          <li>Check Vercel function logs for the specific error</li>
        </ul>
        <SubHeading>Render stays in 'queued' status</SubHeading>
        <ul style={list}>
          <li>The Python render script must be running on your machine</li>
          <li>Check C:\Users\babso\Desktop\BootHopPipeline for the render worker</li>
          <li>Ensure Supabase credentials in the .env file are correct</li>
        </ul>
        <SubHeading>Post to TikTok/Instagram fails</SubHeading>
        <ul style={list}>
          <li>Check that TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, INSTAGRAM_ACCESS_TOKEN are set in Vercel</li>
          <li>TikTok and Instagram tokens expire — they may need refreshing</li>
          <li>The video URL must be publicly accessible (Supabase Storage bucket must be public)</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#111827', borderRadius: 16, padding: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F9FAFB', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 8px' }}>{children}</div>;
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
      <span style={{ background: '#7C3AED', borderRadius: '50%', color: '#fff', fontSize: 11, fontWeight: 800, minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{n}</span>
      <span style={{ color: '#D1D5DB', fontSize: 13, lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#1E3A5F', borderRadius: 8, color: '#93C5FD', fontSize: 12, lineHeight: 1.6, marginTop: 12, padding: '10px 14px' }}>
      💡 {children}
    </div>
  );
}

const para: React.CSSProperties = { color: '#9CA3AF', fontSize: 13, lineHeight: 1.7, margin: '0 0 12px' };
const list: React.CSSProperties = { color: '#D1D5DB', fontSize: 13, lineHeight: 1.9, paddingLeft: 20, margin: '0 0 8px' };
