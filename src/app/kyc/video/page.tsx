'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Video, Camera, Upload, CheckCircle, AlertCircle,
  RotateCcw, Loader2, Shield, ArrowRight, Clock,
} from 'lucide-react';
import NavBar from '@/components/NavBar';

// ─── Main component ──────────────────────────────────────────────────────────
function VideoKYCInner() {
  const searchParams = useSearchParams();
  const matchId      = searchParams.get('matchId') || '';

  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const streamRef   = useRef<MediaStream | null>(null);

  const [phase, setPhase]         = useState<'intro' | 'camera' | 'recording' | 'preview' | 'photo' | 'submitting' | 'done' | 'error'>('intro');
  const [countdown, setCountdown] = useState(0);
  const [recordSecs, setRecordSecs] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [videoUrl,  setVideoUrl]  = useState<string | null>(null);
  const [photoUrl,  setPhotoUrl]  = useState<string | null>(null);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const [userName,  setUserName]  = useState('');

  const MAX_RECORD_SECS = 20;

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      setPhase('camera');
      setCountdown(3);
    } catch {
      setErrorMsg('Camera access denied. Please allow camera and microphone access in your browser settings.');
      setPhase('error');
    }
  };

  // ── Countdown then record ─────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    if (countdown === 1) {
      const t = setTimeout(() => {
        setCountdown(0);
        startRecording();
      }, 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCountdown((p) => p - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  // ── Recording timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'recording') { setRecordSecs(0); return; }
    const t = setInterval(() => {
      setRecordSecs((p) => {
        if (p + 1 >= MAX_RECORD_SECS) { stopRecording(); return MAX_RECORD_SECS; }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
      setPhase('preview');
    };
    recorder.start(250);
    recorderRef.current = recorder;
    setPhase('recording');
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    streamRef.current?.getVideoTracks().forEach(() => {}); // keep stream alive for photo
  };

  // ── Take snapshot photo ───────────────────────────────────────────────────
  const takePhoto = () => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setPhotoBlob(blob);
      setPhotoUrl(URL.createObjectURL(blob));
      stopStream();
      setPhase('photo');
    }, 'image/jpeg', 0.92);
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const retake = () => {
    setVideoBlob(null); setVideoUrl(null);
    setPhotoBlob(null); setPhotoUrl(null);
    setPhase('intro');
    stopStream();
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!videoBlob || !photoBlob || !matchId) return;
    setPhase('submitting');

    const fd = new FormData();
    fd.append('matchId', matchId);
    fd.append('video', new File([videoBlob], 'video.webm', { type: 'video/webm' }));
    fd.append('photo', new File([photoBlob], 'photo.jpg',  { type: 'image/jpeg' }));

    const res  = await fetch('/api/kyc/video-submit', { method: 'POST', body: fd });
    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error || 'Submission failed. Please try again.');
      setPhase('error');
      return;
    }
    setPhase('done');
  };

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => stopStream(), []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar />

      <div className="relative pt-28 pb-20 px-6 max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-4 py-2 mb-5">
            <Shield className="h-4 w-4 text-violet-600" />
            <span className="text-sm text-violet-700 font-semibold">Identity Verification</span>
          </div>
          <h1 className="text-4xl font-black mb-3">Video ID Check</h1>
          <p className="text-slate-600 text-base max-w-sm mx-auto leading-relaxed">
            Record a short clip saying your name so we can confirm your identity against your registered ID.
          </p>
        </div>

        {/* ── INTRO ── */}
        {phase === 'intro' && (
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-8 space-y-6">

            {/* Steps */}
            <div className="space-y-4">
              {[
                { icon: <Video className="h-5 w-5 text-violet-600" />, grad: 'from-violet-500 to-purple-400', title: 'Record a 20-second video', desc: 'Look into the camera and clearly say: "My name is [Your Full Name]"' },
                { icon: <Camera className="h-5 w-5 text-blue-600" />,  grad: 'from-blue-500 to-cyan-400',    title: 'Take a photo snapshot',   desc: 'We capture a clear still from your video to compare with your ID' },
                { icon: <Upload className="h-5 w-5 text-emerald-600" />, grad: 'from-emerald-500 to-teal-400', title: 'Submit for review',       desc: 'Our team verifies the match within a few hours. Valid for 30 days.' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5`}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{s.title}</p>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Name input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Your full name (as on your ID)</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. John Adebayo Smith"
                className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition text-sm"
              />
              <p className="text-xs text-slate-600 mt-1">Say exactly this name in your video recording.</p>
            </div>

            <button
              onClick={startCamera}
              disabled={!userName.trim()}
              className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold py-4 rounded-xl hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Video className="h-5 w-5 group-hover:animate-pulse" />
              Start camera
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* ── CAMERA / RECORDING ── */}
        {(phase === 'camera' || phase === 'recording') && (
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden border-2 border-violet-500/40 shadow-2xl shadow-violet-500/20 aspect-video bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />

              {/* Countdown overlay */}
              {countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <span className="text-8xl font-black text-white animate-pulse">{countdown}</span>
                </div>
              )}

              {/* Recording indicator */}
              {phase === 'recording' && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 rounded-full px-3 py-1.5 backdrop-blur-sm">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-xs font-bold">REC {recordSecs}s / {MAX_RECORD_SECS}s</span>
                </div>
              )}

              {/* Progress bar */}
              {phase === 'recording' && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-1000"
                    style={{ width: `${(recordSecs / MAX_RECORD_SECS) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Script reminder */}
            {phase === 'recording' && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-center">
                <p className="text-violet-700 text-sm font-semibold">Say aloud clearly:</p>
                <p className="text-slate-900 text-lg font-black mt-1">&quot;My name is {userName}&quot;</p>
              </div>
            )}

            {phase === 'recording' && (
              <button
                onClick={stopRecording}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-red-500/40"
              >
                Stop recording
              </button>
            )}
          </div>
        )}

        {/* hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* ── PREVIEW — take photo ── */}
        {phase === 'preview' && (
          <div className="space-y-4">
            <div className="rounded-3xl overflow-hidden border border-emerald-500/30 shadow-xl">
              <video src={videoUrl!} controls className="w-full aspect-video bg-black" />
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 flex items-start gap-3">
              <Camera className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-slate-900 font-semibold text-sm">Now take your photo</p>
                <p className="text-slate-600 text-xs mt-0.5">Position your face clearly in frame, then click the button below.</p>
              </div>
            </div>

            {/* Live camera for photo */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
              {/* Re-open stream if it was stopped */}
              {!streamRef.current && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                  <button onClick={async () => {
                    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).catch(() => null);
                    if (s && videoRef.current) { streamRef.current = s; videoRef.current.srcObject = s; }
                  }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                    Open camera
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={retake} className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 py-3 rounded-xl transition text-sm font-semibold">
                <RotateCcw className="h-4 w-4" /> Re-record
              </button>
              <button
                onClick={takePhoto}
                className="group flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 rounded-xl hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
              >
                <Camera className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Take photo
              </button>
            </div>
          </div>
        )}

        {/* ── PHOTO REVIEW — submit ── */}
        {phase === 'photo' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">Video</p>
                <video src={videoUrl!} controls className="w-full rounded-2xl border border-emerald-200 aspect-video bg-black" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">Photo</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl!} alt="Your photo" className="w-full rounded-2xl border border-blue-200 aspect-video object-cover" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-slate-600">Video recorded ({Math.min(recordSecs, MAX_RECORD_SECS)}s)</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-slate-600">Photo captured</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-sm text-slate-600">Verification valid for <strong className="text-slate-900">30 days</strong> once approved</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={retake} className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 py-3 rounded-xl transition text-sm font-semibold">
                <RotateCcw className="h-4 w-4" /> Start over
              </button>
              <button
                onClick={submit}
                className="group flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold py-3 rounded-xl hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
              >
                <Upload className="h-4 w-4 group-hover:translate-y-[-2px] transition-transform" />
                Submit
              </button>
            </div>
          </div>
        )}

        {/* ── SUBMITTING ── */}
        {phase === 'submitting' && (
          <div className="text-center py-16 space-y-4">
            <Loader2 className="h-12 w-12 text-violet-500 animate-spin mx-auto" />
            <p className="text-slate-900 font-bold text-lg">Uploading your verification…</p>
            <p className="text-slate-600 text-sm">Please don&apos;t close this page.</p>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center space-y-5">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
                <CheckCircle className="h-9 w-9 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Submitted!</h2>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Your video and photo are under review. We aim to verify within a few hours.
                Once approved, your ID status is set to <strong className="text-emerald-600">verified</strong> for 30 days.
              </p>
              {matchId && (
                <Link
                  href={`/kyc/${matchId}`}
                  className="inline-flex items-center gap-2 mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-8 py-3 rounded-xl hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Back to match <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <h2 className="text-xl font-black text-slate-900">Something went wrong</h2>
            <p className="text-slate-600 text-sm">{errorMsg}</p>
            <button onClick={() => { setPhase('intro'); setErrorMsg(null); }}
              className="bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold px-8 py-3 rounded-xl hover:shadow-xl hover:shadow-red-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Try again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VideoKYCPage() {
  return (
    <Suspense>
      <VideoKYCInner />
    </Suspense>
  );
}
