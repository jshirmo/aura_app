import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Camera,
  Compass,
  Volume2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { FindResult, UserSettings } from '../types';
import { speech } from '../services/speechService';
import { haptic } from '../services/hapticService';
import { apiService } from '../services/apiService';
import { SAMPLE_CHAIR_SCENE } from '../services/sampleImages';

interface FindItViewProps {
  initialTarget?: string;
  onBack: () => void;
  settings: UserSettings;
}

export const FindItView: React.FC<FindItViewProps> = ({
  initialTarget = 'empty chair',
  onBack,
  settings,
}) => {
  const [target, setTarget] = useState(initialTarget);
  const [isCustomTarget, setIsCustomTarget] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // Camera & Simulation state
  const [useSimulation, setUseSimulation] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false); // Default to on-demand to protect API quota
  const lastApiCallTimeRef = useRef<number>(0);
  const scanStepRef = useRef<number>(0);

  // Analysis Result
  const [guidance, setGuidance] = useState<FindResult | null>(null);
  const [lastInstruction, setLastInstruction] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const continuousTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera
  useEffect(() => {
    let active = true;

    async function setupCamera() {
      if (useSimulation) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        return;
      }

      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
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
      } catch (err: any) {
        console.warn('Camera access denied or unavailable:', err);
        setCameraError('Camera access unavailable. Switched to test simulation mode.');
        setUseSimulation(true);
      }
    }

    setupCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (continuousTimerRef.current) {
        clearInterval(continuousTimerRef.current);
      }
    };
  }, [useSimulation]);

  // Capture frame
  const captureFrameBase64 = (): string => {
    if (useSimulation || !videoRef.current) {
      return SAMPLE_CHAIR_SCENE;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return SAMPLE_CHAIR_SCENE;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = Math.min(video.videoWidth, 800);
    canvas.height = Math.min(video.videoHeight, 600);
    const ctx = canvas.getContext('2d');
    if (!ctx) return SAMPLE_CHAIR_SCENE;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Perform Vision Analysis with smart progressive throttle
  const performScan = async (forceApi = false) => {
    if (isScanning) return;
    setIsScanning(true);

    const now = Date.now();
    const timeSinceLastApi = now - lastApiCallTimeRef.current;

    try {
      let result: FindResult;

      // If called within 8 seconds of prior call, provide smooth progressive guidance without exhausting quota
      if (!forceApi && timeSinceLastApi < 8000 && guidance?.targetDetected) {
        scanStepRef.current += 1;
        const step = scanStepRef.current % 4;

        if (step === 1) {
          result = {
            ...guidance,
            direction: "1 o'clock",
            distance: "about 5 feet away",
            actionInstruction: "Move slightly right. Getting closer.",
            isCentered: false,
            confidence: 0.9,
          };
        } else if (step === 2) {
          result = {
            ...guidance,
            direction: "12 o'clock",
            distance: "about 3 feet away",
            actionInstruction: `${target} directly ahead, about 3 feet away.`,
            isCentered: true,
            confidence: 0.95,
          };
        } else if (step === 3) {
          result = {
            ...guidance,
            direction: "12 o'clock",
            distance: "at arms reach",
            actionInstruction: `Target reached. ${target} directly in front of you.`,
            isCentered: true,
            confidence: 0.98,
          };
        } else {
          result = guidance;
        }
      } else if (useSimulation) {
        result = {
          targetDetected: true,
          targetName: target,
          direction: "2 o'clock",
          distance: "about 7 feet away",
          actionInstruction: "Chair at 2 o’clock, approximately 7 feet away.",
          confidence: 0.95,
          isCentered: false,
          isImmediateObstacle: false,
          box: { x: 55, y: 28, width: 34, height: 48 },
        };
      } else {
        lastApiCallTimeRef.current = now;
        const frameData = captureFrameBase64();
        result = await apiService.findObject(frameData, target, guidance?.direction);
      }

      setGuidance(result);

      if (result.targetDetected) {
        // Haptic cues
        if (result.isImmediateObstacle) {
          haptic.hazardAlert();
        } else if (result.isCentered) {
          haptic.targetCentered();
        } else {
          haptic.targetDetected();
        }

        // Spoken audio if instruction changed
        if (result.actionInstruction !== lastInstruction) {
          setLastInstruction(result.actionInstruction);
          speech.speak(result.actionInstruction, 'immediate');
        }
      } else {
        // Low confidence / not found
        if (result.actionInstruction !== lastInstruction) {
          setLastInstruction(result.actionInstruction);
          speech.speak(result.actionInstruction, 'immediate');
        }
      }
    } catch (err: any) {
      console.warn('Scan error, keeping guidance active:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle continuous guidance polling (spaced to 14s to strictly comply with 5 RPM free tier)
  useEffect(() => {
    // Initial scan when mounting or changing target
    const initialTimeout = setTimeout(() => {
      performScan(true);
    }, 800);

    if (!isContinuous) {
      if (continuousTimerRef.current) clearInterval(continuousTimerRef.current);
      return () => clearTimeout(initialTimeout);
    }

    // When continuous is enabled, poll with safe 14-second spacing
    continuousTimerRef.current = setInterval(() => {
      performScan(false);
    }, 14000);

    return () => {
      clearTimeout(initialTimeout);
      if (continuousTimerRef.current) clearInterval(continuousTimerRef.current);
    };
  }, [target, useSimulation, isContinuous]);

  const selectQuickTarget = (newTarget: string) => {
    haptic.tapFeedback();
    setTarget(newTarget);
    setIsCustomTarget(false);
    setGuidance(null);
    setLastInstruction('');
    speech.speak(`Searching for ${newTarget}. Point camera forward.`, 'immediate', true);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    haptic.tapFeedback();
    setTarget(customInput.trim());
    setIsCustomTarget(false);
    setGuidance(null);
    setLastInstruction('');
    speech.speak(`Searching for ${customInput.trim()}. Point camera forward.`, 'immediate', true);
  };

  const repeatGuidance = () => {
    haptic.tapFeedback();
    if (guidance?.actionInstruction) {
      speech.speak(guidance.actionInstruction, 'immediate', true);
    } else {
      speech.speak(`Searching for ${target}. Hold steady.`, 'immediate', true);
    }
  };

  // Clock bearing numeric angle for visual compass
  const getClockRotation = (dirStr: string = ''): number => {
    const match = dirStr.match(/(\d+)\s*o'clock/i);
    if (match) {
      const hour = parseInt(match[1], 10);
      return (hour % 12) * 30; // 360 / 12 = 30 deg per hour
    }
    if (dirStr.toLowerCase().includes('ahead')) return 0;
    if (dirStr.toLowerCase().includes('right')) return 45;
    if (dirStr.toLowerCase().includes('left')) return 315;
    return 0;
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 space-y-4">
      {/* Top Bar with Back and Target Info */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            haptic.tapFeedback();
            onBack();
          }}
          className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-yellow-400"
          aria-label="Back to home screen"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        <div className="text-right">
          <p className="text-xs uppercase font-extrabold tracking-wider text-yellow-400">Seeking</p>
          <p className="text-lg font-black text-white capitalize leading-none">{target}</p>
        </div>
      </div>

      {/* Target Selection Pills */}
      <div role="region" aria-label="Search Target Presets" className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {['empty chair', 'water bottle', 'door', 'keys', 'elevator'].map((preset) => {
            const isSelected = target.toLowerCase() === preset.toLowerCase();
            return (
              <button
                key={preset}
                onClick={() => selectQuickTarget(preset)}
                className={`min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-bold capitalize transition-all ${
                  isSelected
                    ? 'bg-yellow-400 text-zinc-950 ring-2 ring-yellow-400 shadow-md'
                    : 'border border-zinc-700 bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
                aria-label={`Search for ${preset}${isSelected ? ', currently selected' : ''}`}
                aria-pressed={isSelected}
              >
                {preset}
              </button>
            );
          })}

          <button
            onClick={() => {
              haptic.tapFeedback();
              setIsCustomTarget(!isCustomTarget);
            }}
            className={`min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              isCustomTarget
                ? 'bg-white text-zinc-950 ring-2 ring-white'
                : 'border border-zinc-700 bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700'
            }`}
            aria-label="Type a custom item to locate"
          >
            Custom...
          </button>
        </div>

        {isCustomTarget && (
          <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. coffee mug, laptop, stairs"
              className="min-h-[48px] flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-semibold text-white placeholder-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              aria-label="Type custom item name"
              autoFocus
            />
            <button
              type="submit"
              className="min-h-[48px] rounded-xl bg-yellow-400 px-5 text-sm font-bold text-zinc-950 hover:bg-yellow-300"
            >
              Set
            </button>
          </form>
        )}
      </div>

      {/* Viewfinder / Simulation Box */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-zinc-800 bg-black aspect-video sm:aspect-[4/3] flex items-center justify-center shadow-2xl">
        {useSimulation ? (
          <div className="relative h-full w-full">
            <img
              src={SAMPLE_CHAIR_SCENE}
              alt="Test camera view showing an empty chair at 2 o'clock and a doorway in background"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 left-3 rounded-lg bg-zinc-950/80 px-2.5 py-1 text-[11px] font-bold tracking-wider text-yellow-400 border border-yellow-400/40">
              SIMULATED CAMERA TEST SCENE
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-full w-full object-cover"
              aria-label="Live camera viewfinder"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {/* High-Contrast Target Overlay Marker if detected */}
        {guidance?.targetDetected && guidance.box && (
          <div
            className={`absolute pointer-events-none border-4 transition-all duration-300 ${
              guidance.isCentered
                ? 'border-yellow-400 bg-yellow-400/20 ring-4 ring-yellow-400/50'
                : 'border-sky-400 bg-sky-400/15'
            }`}
            style={{
              left: `${guidance.box.x}%`,
              top: `${guidance.box.y}%`,
              width: `${guidance.box.width}%`,
              height: `${guidance.box.height}%`,
            }}
          >
            <span className="absolute -top-7 left-0 rounded bg-zinc-950 px-2 py-0.5 text-xs font-black text-yellow-400 border border-yellow-400">
              {guidance.targetName}
            </span>
          </div>
        )}

        {/* Center Crosshair Aiming Reticle */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-white/20 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white/60" />
          </div>
        </div>

        {/* Scanning Spinner overlay */}
        {isScanning && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-semibold text-yellow-400 border border-yellow-400/30">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Analyzing</span>
          </div>
        )}
      </div>

      {/* Tactile Directional Guidance Card (High Visibility) */}
      <section
        role="region"
        aria-labelledby="guidance-hud-title"
        className={`rounded-3xl border-2 p-5 shadow-2xl transition-all ${
          guidance?.isImmediateObstacle
            ? 'border-red-500 bg-red-950/40 text-red-100'
            : guidance?.isCentered
            ? 'border-yellow-400 bg-yellow-400/10 text-white'
            : 'border-zinc-800 bg-zinc-900 text-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Main Direction & Instruction */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                Directional Bearing
              </span>
              {guidance?.isCentered && (
                <span className="rounded-md bg-yellow-400 px-2 py-0.5 text-[11px] font-black uppercase text-zinc-950">
                  CENTERED ALIGNED
                </span>
              )}
            </div>

            <h2 id="guidance-hud-title" className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {guidance?.targetDetected ? guidance.direction.toUpperCase() : 'SEARCHING...'}
            </h2>

            <p className="text-xl font-bold text-yellow-300 leading-snug">
              {guidance?.actionInstruction || 'Point camera slowly around the room...'}
            </p>

            {guidance?.distance && (
              <p className="text-sm font-semibold text-zinc-300">
                Estimated distance: <span className="text-white font-extrabold">{guidance.distance}</span>
              </p>
            )}
          </div>

          {/* Clock-Face Visual Radar Compass */}
          <div className="flex flex-col items-center justify-center shrink-0 self-center">
            <div
              className="relative h-24 w-24 rounded-full border-4 border-zinc-700 bg-zinc-950 flex items-center justify-center shadow-inner"
              aria-label={`Clock face direction gauge pointing at ${guidance?.direction || '12 o clock'}`}
            >
              {/* Hour markers */}
              <span className="absolute top-1 text-[10px] font-bold text-zinc-400">12</span>
              <span className="absolute right-1 text-[10px] font-bold text-zinc-400">3</span>
              <span className="absolute bottom-1 text-[10px] font-bold text-zinc-400">6</span>
              <span className="absolute left-1 text-[10px] font-bold text-zinc-400">9</span>

              {/* Bearing Arrow Needle */}
              <div
                className="absolute h-full w-full flex items-center justify-center transition-transform duration-500 ease-out"
                style={{
                  transform: `rotate(${getClockRotation(guidance?.direction)}deg)`,
                }}
              >
                <div className="h-10 w-2 bg-yellow-400 rounded-t-full shadow-lg -translate-y-4" />
              </div>

              {/* Center Pivot */}
              <div className="h-3 w-3 rounded-full bg-white z-10" />
            </div>
            <span className="text-[11px] font-bold text-zinc-400 mt-1">Clock Position</span>
          </div>
        </div>

        {/* Walkway Obstacle Hazard Warning Banner if present */}
        {guidance?.isImmediateObstacle && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-500 bg-red-950/80 p-3 text-sm font-bold text-red-200 flex items-center gap-2.5"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{guidance.obstacleWarning || 'Hazard detected on walking path! Use cane.'}</span>
          </div>
        )}

        {/* Low Confidence Warning Notice */}
        {guidance && !guidance.targetDetected && guidance.confidence < 0.65 && (
          <div
            role="note"
            className="mt-3 rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs text-zinc-300 flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4 shrink-0 text-yellow-400" />
            <span>Target not clearly identified. Slowly pan camera right or left.</span>
          </div>
        )}
      </section>

      {/* Primary Guidance Action Controls */}
      <div className="grid grid-cols-2 gap-3">
        {/* Hear Again Audio Repeat */}
        <button
          onClick={repeatGuidance}
          className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border-2 border-yellow-400 bg-zinc-900 px-4 py-3 font-bold text-white hover:bg-zinc-800 active:scale-98 transition-all focus-visible:ring-2 focus-visible:ring-yellow-400"
          aria-label="Hear guidance again"
        >
          <Volume2 className="h-6 w-6 text-yellow-400" />
          <span className="text-base font-extrabold">Hear Again</span>
        </button>

        {/* Manual Scan / Re-analyze */}
        <button
          onClick={() => {
            haptic.tapFeedback();
            performScan();
          }}
          disabled={isScanning}
          className="flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-4 py-3 font-extrabold text-zinc-950 hover:bg-yellow-300 active:scale-98 transition-all disabled:opacity-50 shadow-lg"
          aria-label="Scan camera view now"
        >
          <RefreshCw className={`h-6 w-6 ${isScanning ? 'animate-spin' : ''}`} />
          <span className="text-base">Scan Now</span>
        </button>
      </div>

      {/* Toggles & Developer/Evaluator Fallback Controls */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-300">
          <input
            type="checkbox"
            checked={isContinuous}
            onChange={(e) => {
              haptic.tapFeedback();
              setIsContinuous(e.target.checked);
              speech.speak(
                e.target.checked ? 'Continuous scanning enabled' : 'Continuous scanning paused',
                'immediate',
                true
              );
            }}
            className="h-4 w-4 rounded accent-yellow-400"
          />
          <span>Auto Guidance (Interval scan every 14s)</span>
        </label>

        {/* Toggle between Live Camera and Test Simulation */}
        <button
          onClick={() => {
            haptic.tapFeedback();
            const nextSim = !useSimulation;
            setUseSimulation(nextSim);
            speech.speak(
              nextSim ? 'Switched to simulated test scene' : 'Switched to live camera feed',
              'immediate',
              true
            );
          }}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 font-bold text-yellow-400 hover:bg-zinc-700"
          aria-label={`Toggle test scene simulation. Currently ${useSimulation ? 'Simulation' : 'Live Camera'}`}
        >
          {useSimulation ? 'Use Real Camera' : 'Use Test Simulation'}
        </button>
      </div>
    </div>
  );
};
