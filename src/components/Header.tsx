import React from 'react';
import { Volume2, VolumeX, Eye, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import { UserSettings, TextSize } from '../types';
import { speech } from '../services/speechService';
import { haptic } from '../services/hapticService';

interface HeaderProps {
  currentView: 'home' | 'find' | 'remember' | 'changed';
  onNavigateHome: () => void;
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateHome,
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenHelp,
}) => {
  const toggleMute = () => {
    haptic.tapFeedback();
    const newMuted = !speech.isSpeechMuted();
    speech.setMuted(newMuted);
    onUpdateSettings({ soundEffects: !newMuted });
    speech.speak(newMuted ? 'Audio muted' : 'Audio guidance active', 'immediate', true);
  };

  const cycleTextSize = () => {
    haptic.tapFeedback();
    const sizes: TextSize[] = ['standard', 'large', 'xl'];
    const currentIdx = sizes.indexOf(settings.textSize);
    const nextSize = sizes[(currentIdx + 1) % sizes.length];
    onUpdateSettings({ textSize: nextSize });
    speech.speak(`Text size set to ${nextSize}`, 'immediate', true);
  };

  const toggleContrast = () => {
    haptic.tapFeedback();
    const nextTheme = settings.theme === 'high-contrast-dark' ? 'high-contrast-light' : 'high-contrast-dark';
    onUpdateSettings({ theme: nextTheme });
    speech.speak(`Switched to ${nextTheme === 'high-contrast-dark' ? 'Dark' : 'Light'} theme`, 'immediate', true);
  };

  const isHome = currentView === 'home';

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md px-4 py-3 text-white"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        {/* Brand & Home Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              haptic.tapFeedback();
              onNavigateHome();
              if (!isHome) {
                speech.speak('Returned to home screen', 'immediate', true);
              }
            }}
            className="flex items-center gap-2 rounded-xl p-1.5 font-bold tracking-tight text-yellow-400 hover:text-yellow-300 focus-visible:ring-2 focus-visible:ring-yellow-400"
            aria-label="Aura Home, return to main screen"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-zinc-950 font-black text-xl">
              A
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-extrabold tracking-wider leading-none text-white">
                AURA
              </span>
              <span className="text-[11px] font-medium tracking-wide text-zinc-400">
                Visual Companion
              </span>
            </div>
          </button>
        </div>

        {/* View Indicator if not home */}
        {!isHome && (
          <div className="hidden sm:flex items-center text-xs font-semibold tracking-wider text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/30">
            {currentView === 'find' && 'FIND IT MODE'}
            {currentView === 'remember' && 'REMEMBER IT MODE'}
            {currentView === 'changed' && 'WHAT CHANGED MODE'}
          </div>
        )}

        {/* Accessibility Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Text Size Switcher */}
          <button
            onClick={cycleTextSize}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white"
            aria-label={`Current text size ${settings.textSize}. Tap to change text size.`}
            title="Cycle Text Size (Standard, Large, Extra Large)"
          >
            <span className="text-sm font-extrabold">Aa</span>
            <span className="ml-1 text-[10px] text-yellow-400 uppercase">
              {settings.textSize === 'standard' ? '1x' : settings.textSize === 'large' ? '2x' : '3x'}
            </span>
          </button>

          {/* High Contrast Toggle */}
          <button
            onClick={toggleContrast}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-200 hover:bg-zinc-800 hover:text-white"
            aria-label={`Toggle high contrast theme. Currently ${settings.theme}.`}
            title="Toggle High Contrast Light/Dark"
          >
            <Eye className="h-5 w-5 text-yellow-400" />
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleMute}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border p-2 transition-colors ${
              speech.isSpeechMuted()
                ? 'border-red-500/50 bg-red-950/40 text-red-400 hover:bg-red-900/50'
                : 'border-zinc-800 bg-zinc-900 text-yellow-400 hover:bg-zinc-800'
            }`}
            aria-label={speech.isSpeechMuted() ? 'Audio guidance is muted. Tap to enable speech.' : 'Audio guidance is active. Tap to mute.'}
            title={speech.isSpeechMuted() ? 'Unmute Audio Guidance' : 'Mute Audio Guidance'}
          >
            {speech.isSpeechMuted() ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          {/* Help & Modes */}
          <button
            onClick={() => {
              haptic.tapFeedback();
              onOpenHelp();
            }}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-200 hover:bg-zinc-800 hover:text-white"
            aria-label="App guide and future modes"
            title="App Guide & Future Modes"
          >
            <HelpCircle className="h-5 w-5 text-zinc-300" />
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              haptic.tapFeedback();
              onOpenSettings();
            }}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-200 hover:bg-zinc-800 hover:text-white"
            aria-label="Settings and privacy"
            title="Settings & Privacy"
          >
            <SettingsIcon className="h-5 w-5 text-zinc-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
