import React from 'react';
import {
  X,
  Volume2,
  Vibrate,
  Sliders,
  Eye,
  Trash2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { UserSettings, FeedbackMethod, TextSize, ContrastTheme } from '../types';
import { speech } from '../services/speechService';
import { haptic } from '../services/hapticService';
import { storageService } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleFeedbackChange = (method: FeedbackMethod) => {
    haptic.tapFeedback();
    onUpdateSettings({ feedbackMethod: method });
    speech.speak(`Feedback set to ${method === 'both' ? 'both audio and haptics' : method}`, 'immediate', true);
  };

  const handleRateChange = (rate: number) => {
    onUpdateSettings({ speechRate: rate });
    speech.setSpeechRate(rate);
  };

  const testVoiceRate = () => {
    haptic.tapFeedback();
    speech.speak('This is how Aura announces navigation guidance at this speed.', 'immediate', true);
  };

  const handlePurgeAll = () => {
    haptic.hazardAlert();
    if (confirm('Warning: This will delete all remembered items and baseline environments. Proceed?')) {
      storageService.deleteAllUserData();
      speech.speak('All personal data and saved environments have been deleted.', 'immediate', true);
      window.location.reload();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-3xl border-2 border-yellow-400 bg-zinc-950 p-6 text-white shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 id="settings-title" className="text-xl font-black text-white">
            Accessibility Settings
          </h2>
          <button
            onClick={() => {
              haptic.tapFeedback();
              onClose();
            }}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
            aria-label="Close settings"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 1. Preferred Feedback Method */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Preferred Feedback Channels:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'both', label: 'Both Audio & Haptics' },
              { id: 'audio', label: 'Audio Only' },
              { id: 'haptic', label: 'Haptic Only' },
            ].map((opt) => {
              const isSelected = settings.feedbackMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleFeedbackChange(opt.id as any)}
                  className={`min-h-[50px] rounded-xl p-2 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-yellow-400 text-zinc-950 font-black shadow-md ring-2 ring-yellow-400'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                  aria-pressed={isSelected}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Speech Rate Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Speech Announcement Speed ({settings.speechRate.toFixed(1)}x):
            </label>
            <button
              onClick={testVoiceRate}
              className="text-xs font-bold text-yellow-400 hover:underline flex items-center gap-1"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Test Voice</span>
            </button>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.4"
            step="0.1"
            value={settings.speechRate}
            onChange={(e) => handleRateChange(parseFloat(e.target.value))}
            className="w-full accent-yellow-400 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            aria-label="Speech rate slider from 0.8x to 1.4x"
          />
        </div>

        {/* 3. Text Scaling */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Text Size Scale:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'standard', label: 'Standard (16px)' },
              { id: 'large', label: 'Large (19px)' },
              { id: 'xl', label: 'Extra Large (22px)' },
            ].map((size) => {
              const isSelected = settings.textSize === size.id;
              return (
                <button
                  key={size.id}
                  onClick={() => {
                    haptic.tapFeedback();
                    onUpdateSettings({ textSize: size.id as any });
                    speech.speak(`Text size set to ${size.id}`, 'immediate', true);
                  }}
                  className={`min-h-[50px] rounded-xl p-2 text-xs font-bold ${
                    isSelected
                      ? 'bg-yellow-400 text-zinc-950 font-black ring-2 ring-yellow-400'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-300'
                  }`}
                >
                  {size.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Contrast Themes */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Contrast Theme:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'high-contrast-dark', label: 'High Contrast Dark' },
              { id: 'high-contrast-light', label: 'High Contrast Light' },
            ].map((theme) => {
              const isSelected = settings.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    haptic.tapFeedback();
                    onUpdateSettings({ theme: theme.id as any });
                  }}
                  className={`min-h-[50px] rounded-xl p-2 text-xs font-bold ${
                    isSelected
                      ? 'bg-yellow-400 text-zinc-950 font-black ring-2 ring-yellow-400'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-300'
                  }`}
                >
                  {theme.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Privacy & Data Protection Policy */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm text-white">Privacy Guarantee</span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            Live camera video feeds are analyzed transiently in memory and are NEVER permanently stored on any remote cloud server. Only items and room baselines you explicitly tap to save are kept in your local browser storage.
          </p>
        </div>

        {/* 6. Purge All Data */}
        <div className="pt-2">
          <button
            onClick={handlePurgeAll}
            className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-950/30 font-bold text-red-300 hover:bg-red-900/50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Purge All Saved Items &amp; Environments</span>
          </button>
        </div>
      </div>
    </div>
  );
};
