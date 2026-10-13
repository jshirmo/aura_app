import React, { useState } from 'react';
import { Compass, BookmarkCheck, History, Mic, MicOff, AlertTriangle, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { SavedItem, UserSettings } from '../types';
import { speech } from '../services/speechService';
import { haptic } from '../services/hapticService';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';

interface HomeDashboardProps {
  onSelectView: (view: 'find' | 'remember' | 'changed', initialTarget?: string) => void;
  savedItems: SavedItem[];
  settings: UserSettings;
  onOpenFutureModes: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onSelectView,
  savedItems,
  onOpenFutureModes,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);

  // Handle voice or simulation input
  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    haptic.tapFeedback();
    setVoiceStatus(`Processing: "${queryText}"...`);
    speech.speak(`Processing request: ${queryText}`, 'immediate');

    try {
      const environments = storageService.getEnvironments();
      const result = await apiService.parseIntent(queryText, savedItems, environments);

      setVoiceStatus(result.spokenFeedback);
      speech.speak(result.spokenFeedback, 'immediate', true);

      // Route based on parsed action
      setTimeout(() => {
        if (result.action === 'FIND') {
          onSelectView('find', result.target || queryText);
        } else if (result.action === 'REMEMBER') {
          onSelectView('remember', result.target);
        } else if (result.action === 'RECALL_LOCATION') {
          // If asking for a specific item, open Remember view highlighted or Find view
          if (result.matchedSavedItemId) {
            onSelectView('remember');
          } else {
            onSelectView('remember');
          }
        } else if (result.action === 'WHAT_CHANGED') {
          onSelectView('changed');
        } else if (result.action === 'HELP_MODES') {
          onOpenFutureModes();
        }
        setVoiceStatus(null);
      }, 1400);
    } catch (err) {
      console.error(err);
      setVoiceStatus('Could not understand. Please try again.');
      speech.speak('Sorry, I did not catch that. Please try again.', 'immediate', true);
    }
  };

  const startVoiceInput = () => {
    if (isListening) return;
    haptic.tapFeedback();
    setIsListening(true);
    setVoiceStatus('Listening... Speak now.');
    speech.speak('Listening. What would you like to do?', 'immediate', true);

    const stop = speech.startVoiceInput(
      (transcript) => {
        setIsListening(false);
        setVoiceQuery(transcript);
        processQuery(transcript);
      },
      (error) => {
        setIsListening(false);
        setVoiceStatus(`Voice input not available: ${error}. Tap a prompt below.`);
        speech.speak('Microphone was not available. You can use the quick buttons below.', 'immediate');
      }
    );

    // Timeout safety
    setTimeout(() => {
      if (isListening) {
        setIsListening(false);
        stop();
      }
    }, 7000);
  };

  // Quick 1-tap recall for saved items
  const speakItemLocation = (item: SavedItem) => {
    haptic.tapFeedback();
    const answer = `Your ${item.name} was last seen in the ${item.room}: ${item.locationDescription}. Recorded ${item.lastSeenDate}.`;
    speech.speak(answer, 'immediate', true);
    setVoiceStatus(answer);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5 space-y-6">
      {/* Voice Assistant Floating Action Block */}
      <section
        aria-labelledby="voice-section-title"
        className="rounded-3xl border-2 border-yellow-400 bg-zinc-900 p-5 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 id="voice-section-title" className="text-xl font-extrabold text-white tracking-tight">
              Voice Command
            </h2>
            <p className="text-sm text-zinc-300">
              Say what you want to locate or remember
            </p>
          </div>

          <button
            onClick={startVoiceInput}
            className={`flex min-h-[68px] min-w-[68px] items-center justify-center rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-400/50'
                : 'bg-yellow-400 text-zinc-950 hover:bg-yellow-300 ring-2 ring-yellow-400/30'
            }`}
            aria-label={isListening ? 'Microphone listening. Tap to cancel.' : 'Activate microphone. Say what you want to locate or ask where an item is.'}
          >
            {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>
        </div>

        {/* Spoken Feedback or Status Text */}
        {voiceStatus && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 rounded-xl bg-zinc-950 border border-yellow-400/50 p-3 text-sm font-semibold text-yellow-300 flex items-start gap-2"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-yellow-400 mt-0.5" />
            <span>{voiceStatus}</span>
          </div>
        )}

        {/* Quick Voice Simulation Buttons (Allows instant testing on desktop/restricted browsers) */}
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Try asking (Tap to test):
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Find an empty chair',
              'Where are my AirPods?',
              'What changed in my room?',
              'Find the door',
              'Where is my medication?',
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => processQuery(prompt)}
                className="min-h-[44px] rounded-xl border border-zinc-700 bg-zinc-800/90 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-yellow-400 hover:text-white hover:bg-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-yellow-400"
                aria-label={`Ask: "${prompt}"`}
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Primary MVP Feature Buttons (Oversized, High-Contrast) */}
      <nav aria-label="Core Navigation Modes" className="space-y-4">
        {/* 1. FIND IT */}
        <button
          onClick={() => {
            haptic.tapFeedback();
            speech.speak('Find It mode opened. Point camera to locate target.', 'immediate');
            onSelectView('find');
          }}
          className="group w-full min-h-[104px] rounded-3xl border-2 border-yellow-400/80 bg-zinc-900 p-5 text-left transition-all hover:bg-zinc-850 hover:border-yellow-400 active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-yellow-400 shadow-xl"
          aria-label="Find It: Directional camera guidance toward objects, empty chairs, doors, and water bottles."
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-zinc-950 font-black shadow-md group-hover:scale-105 transition-transform">
              <Compass className="h-9 w-9 stroke-[2.5]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black tracking-tight text-white group-hover:text-yellow-400 transition-colors">
                  FIND IT
                </span>
                <ArrowRight className="h-6 w-6 text-yellow-400 opacity-80 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm font-medium text-zinc-300 leading-snug">
                Directional clock-face guidance toward chairs, doors, keys &amp; bottles.
              </p>
            </div>
          </div>
        </button>

        {/* 2. REMEMBER IT */}
        <button
          onClick={() => {
            haptic.tapFeedback();
            speech.speak('Remember It opened. Review saved items or save a new object.', 'immediate');
            onSelectView('remember');
          }}
          className="group w-full min-h-[104px] rounded-3xl border-2 border-sky-400/80 bg-zinc-900 p-5 text-left transition-all hover:bg-zinc-850 hover:border-sky-400 active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-sky-400 shadow-xl"
          aria-label="Remember It: Visual memory system for personal items like medication, AirPods, and backpacks."
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-400 text-zinc-950 font-black shadow-md group-hover:scale-105 transition-transform">
              <BookmarkCheck className="h-9 w-9 stroke-[2.5]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black tracking-tight text-white group-hover:text-sky-400 transition-colors">
                  REMEMBER IT
                </span>
                <ArrowRight className="h-6 w-6 text-sky-400 opacity-80 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm font-medium text-zinc-300 leading-snug">
                Save personal items to visual memory. Recall where you left them anytime.
              </p>
            </div>
          </div>
        </button>

        {/* 3. WHAT CHANGED? */}
        <button
          onClick={() => {
            haptic.tapFeedback();
            speech.speak('What Changed opened. Compare room against baseline for obstacles.', 'immediate');
            onSelectView('changed');
          }}
          className="group w-full min-h-[104px] rounded-3xl border-2 border-emerald-400/80 bg-zinc-900 p-5 text-left transition-all hover:bg-zinc-850 hover:border-emerald-400 active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-emerald-400 shadow-xl"
          aria-label="What Changed: Scan familiar rooms against baseline to detect moved furniture and walkway obstacles."
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-zinc-950 font-black shadow-md group-hover:scale-105 transition-transform">
              <History className="h-9 w-9 stroke-[2.5]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  WHAT CHANGED?
                </span>
                <ArrowRight className="h-6 w-6 text-emerald-400 opacity-80 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm font-medium text-zinc-300 leading-snug">
                Detect moved furniture, trip hazards, and obstacles in familiar spaces.
              </p>
            </div>
          </div>
        </button>
      </nav>

      {/* Quick Visual Memory Strip (Immediate Recall) */}
      <section aria-labelledby="saved-memory-title" className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 id="saved-memory-title" className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-yellow-400" />
            Quick Item Recall
          </h3>
          <span className="text-xs text-zinc-400">{savedItems.length} items saved</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {savedItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => speakItemLocation(item)}
              className="flex min-h-[56px] items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-left hover:border-yellow-400 hover:bg-zinc-900 transition-all focus-visible:ring-2 focus-visible:ring-yellow-400"
              aria-label={`Ask where is ${item.name}. Last seen: ${item.locationDescription}`}
            >
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold text-white truncate">{item.name}</p>
                <p className="text-xs text-zinc-400 truncate">{item.room} · {item.locationDescription}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md">
                Where?
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Safety Mobility Disclaimer Banner */}
      <div
        role="note"
        aria-label="Safety notice"
        className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 text-xs font-medium text-amber-200/90 flex items-start gap-3"
      >
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300 text-sm">Mobility Safety Reminder</p>
          <p className="leading-relaxed">
            Aura assists with directional visual awareness, but does NOT replace a white cane, guide dog, or orientation mobility training. Never rely solely on computer vision for street crossings, drop-offs, or stairs.
          </p>
        </div>
      </div>

      {/* Future Capabilities Drawer Button */}
      <div className="text-center pt-2">
        <button
          onClick={() => {
            haptic.tapFeedback();
            onOpenFutureModes();
          }}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-yellow-400"
          aria-label="Open future modes preview: Appliance Mode, Food Plate Mode, Social Awareness, and Clothing Assistance"
        >
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <span>Explore Future Modes (Appliance, Food Plate, Social)</span>
        </button>
      </div>
    </div>
  );
};
