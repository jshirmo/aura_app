import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  History,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Volume2,
  ShieldAlert,
  SlidersHorizontal,
  Eye,
  Plus,
} from 'lucide-react';
import { SavedEnvironment, WhatChangedResult, UserSettings } from '../types';
import { speech } from '../services/speechService';
import { haptic } from '../services/hapticService';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import {
  SAMPLE_LIVING_ROOM_BASELINE,
  SAMPLE_LIVING_ROOM_CHANGED,
} from '../services/sampleImages';

interface WhatChangedViewProps {
  onBack: () => void;
  settings: UserSettings;
}

export const WhatChangedView: React.FC<WhatChangedViewProps> = ({
  onBack,
}) => {
  const [environments, setEnvironments] = useState<SavedEnvironment[]>(() =>
    storageService.getEnvironments()
  );
  const [selectedEnvId, setSelectedEnvId] = useState<string>(
    environments[0]?.id || 'env-living-room'
  );

  const [isScanning, setIsScanning] = useState(false);
  const [useTestScenario, setUseTestScenario] = useState(true); // Test scenario with moved chair & backpack
  const [comparisonResult, setComparisonResult] = useState<WhatChangedResult | null>(null);
  const [viewMode, setViewMode] = useState<'current' | 'baseline'>('current');

  // Camera video ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentEnv = environments.find((e) => e.id === selectedEnvId) || environments[0];

  useEffect(() => {
    let active = true;

    async function initCamera() {
      if (useTestScenario) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Camera failed in What Changed:', err);
        setUseTestScenario(true);
      }
    }

    initCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [useTestScenario]);

  // Capture current image
  const captureCurrentImage = (): string => {
    if (useTestScenario || !videoRef.current) {
      return SAMPLE_LIVING_ROOM_CHANGED;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return SAMPLE_LIVING_ROOM_CHANGED;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(video.videoWidth, 800);
    canvas.height = Math.min(video.videoHeight, 600);
    const ctx = canvas.getContext('2d');
    if (!ctx) return SAMPLE_LIVING_ROOM_CHANGED;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Perform baseline comparison
  const handleScanForChanges = async () => {
    haptic.tapFeedback();
    setIsScanning(true);
    speech.speak(`Scanning ${currentEnv.name} for changes compared to baseline... Hold steady.`, 'immediate');

    try {
      const currentImg = captureCurrentImage();
      const baselineImg = currentEnv.baselineImage || SAMPLE_LIVING_ROOM_BASELINE;

      const result = await apiService.whatChanged(baselineImg, currentImg, currentEnv.name);
      setComparisonResult(result);

      if (result.safetyScore === 'hazard') {
        haptic.hazardAlert();
      } else {
        haptic.targetDetected();
      }

      speech.speak(result.spokenSummary, 'immediate', true);
    } catch (err: any) {
      console.error(err);
      speech.speak('Failed to compare baseline. Please try again.', 'immediate');
    } finally {
      setIsScanning(false);
    }
  };

  const repeatSummary = () => {
    haptic.tapFeedback();
    if (comparisonResult?.spokenSummary) {
      speech.speak(comparisonResult.spokenSummary, 'immediate', true);
    } else {
      speech.speak(`Tap "Scan for Changes" to audit ${currentEnv.name}.`, 'immediate');
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            haptic.tapFeedback();
            onBack();
          }}
          className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-label="Back to home screen"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        <h1 className="text-xl font-black text-white tracking-tight">What Changed?</h1>
      </div>

      {/* Environment Selector Strip */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Select Saved Environment:
        </label>
        <div className="flex flex-wrap gap-2">
          {environments.map((env) => {
            const isSelected = env.id === selectedEnvId;
            return (
              <button
                key={env.id}
                onClick={() => {
                  haptic.tapFeedback();
                  setSelectedEnvId(env.id);
                  setComparisonResult(null);
                  speech.speak(`Selected ${env.name}. ${env.baselineDate}.`, 'immediate');
                }}
                className={`min-h-[44px] rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
                  isSelected
                    ? 'bg-emerald-400 text-zinc-950 ring-2 ring-emerald-400 shadow-md'
                    : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
                aria-pressed={isSelected}
              >
                {env.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Viewport Box (Toggle between live/test view and baseline reference) */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-zinc-800 bg-black aspect-video sm:aspect-[4/3] flex items-center justify-center shadow-2xl">
        {viewMode === 'baseline' ? (
          <div className="relative h-full w-full">
            <img
              src={currentEnv.baselineImage || SAMPLE_LIVING_ROOM_BASELINE}
              alt={`Baseline photo of ${currentEnv.name}`}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 left-3 rounded-lg bg-emerald-950/90 px-3 py-1 text-xs font-black tracking-wider text-emerald-400 border border-emerald-400/50">
              SAVED BASELINE (CLEAR WALKWAY)
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            {useTestScenario ? (
              <img
                src={SAMPLE_LIVING_ROOM_CHANGED}
                alt="Live scan view showing chair pulled into middle of walkway and backpack on floor"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover"
                aria-label="Live camera view for room inspection"
              />
            )}
            <div className="absolute top-3 left-3 rounded-lg bg-zinc-950/90 px-3 py-1 text-xs font-black tracking-wider text-yellow-400 border border-yellow-400/50">
              CURRENT LIVE SCAN
            </div>
          </div>
        )}

        {/* Scanning spinner */}
        {isScanning && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span>Auditing differences against baseline...</span>
          </div>
        )}
      </div>

      {/* Visual Mode Toggle Buttons (Current vs Baseline) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => {
              haptic.tapFeedback();
              setViewMode('current');
            }}
            className={`min-h-[44px] rounded-xl px-3 text-xs font-bold ${
              viewMode === 'current'
                ? 'bg-zinc-200 text-zinc-950 font-black'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-300'
            }`}
          >
            Show Current View
          </button>
          <button
            onClick={() => {
              haptic.tapFeedback();
              setViewMode('baseline');
            }}
            className={`min-h-[44px] rounded-xl px-3 text-xs font-bold ${
              viewMode === 'baseline'
                ? 'bg-emerald-400 text-zinc-950 font-black'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-300'
            }`}
          >
            Show Saved Baseline
          </button>
        </div>

        {/* Toggle test scenario */}
        <button
          onClick={() => {
            haptic.tapFeedback();
            setUseTestScenario(!useTestScenario);
            speech.speak(
              !useTestScenario
                ? 'Switched to test scenario with moved chair obstacle'
                : 'Switched to live camera feed',
              'immediate',
              true
            );
          }}
          className="text-xs font-bold text-yellow-400 underline underline-offset-4"
        >
          {useTestScenario ? 'Use Real Camera' : 'Use Test Obstacle Scene'}
        </button>
      </div>

      {/* Scan Trigger Button */}
      <button
        onClick={handleScanForChanges}
        disabled={isScanning}
        className="w-full min-h-[64px] flex items-center justify-center gap-3 rounded-2xl bg-emerald-400 px-6 py-4 font-black text-zinc-950 hover:bg-emerald-300 text-lg shadow-xl active:scale-98 transition-all disabled:opacity-50"
        aria-label="Scan current room and compare against baseline"
      >
        <History className="h-6 w-6" />
        <span>Scan for Changes Now</span>
      </button>

      {/* Differential Audit Results Card */}
      {comparisonResult && (
        <section
          role="region"
          aria-labelledby="differential-result-title"
          className={`rounded-3xl border-2 p-5 shadow-2xl space-y-4 transition-all ${
            comparisonResult.safetyScore === 'hazard'
              ? 'border-amber-400 bg-zinc-900 text-white'
              : 'border-emerald-400 bg-zinc-900 text-white'
          }`}
        >
          {/* Header & Status Indicator */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {comparisonResult.safetyScore === 'hazard' ? (
                <ShieldAlert className="h-7 w-7 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="h-7 w-7 text-emerald-400 shrink-0" />
              )}
              <h2 id="differential-result-title" className="text-xl font-black text-white">
                {comparisonResult.safetyScore === 'hazard'
                  ? 'OBSTACLES DETECTED'
                  : 'WALKWAY CLEAR'}
              </h2>
            </div>

            <button
              onClick={repeatSummary}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-bold text-yellow-400 hover:bg-zinc-700"
              aria-label="Hear room change summary again"
            >
              <Volume2 className="h-4 w-4" />
              <span>Hear Again</span>
            </button>
          </div>

          {/* Spoken Narration Summary Banner */}
          <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4">
            <p className="text-lg font-bold text-yellow-200 leading-snug">
              "{comparisonResult.spokenSummary}"
            </p>
          </div>

          {/* List of Detected Changes */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Specific Differential Items:
            </p>

            {comparisonResult.differences.map((diff, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-base">{diff.item}</span>
                  {diff.isTripHazard && (
                    <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400 border border-red-500/40">
                      TRIP HAZARD
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-zinc-300">
                  {diff.description}
                </p>

                <p className="text-xs text-yellow-400 font-bold">
                  Location: {diff.location}
                </p>
              </div>
            ))}
          </div>

          {comparisonResult.unchangedAreaSummary && (
            <p className="text-xs text-zinc-400 italic">
              Note: {comparisonResult.unchangedAreaSummary}
            </p>
          )}
        </section>
      )}
    </div>
  );
};
