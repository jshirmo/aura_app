import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { FindItView } from './components/FindItView';
import { RememberItView } from './components/RememberItView';
import { WhatChangedView } from './components/WhatChangedView';
import { FutureModesModal } from './components/FutureModesModal';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { UserSettings, SavedItem, FeedbackMethod } from './types';
import { storageService } from './services/storageService';
import { speech } from './services/speechService';
import { haptic } from './services/hapticService';
import { Compass, BookmarkCheck, History, Home as HomeIcon } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'find' | 'remember' | 'changed'>('home');
  const [activeFindTarget, setActiveFindTarget] = useState<string>('empty chair');

  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => storageService.getItems());

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!settings.hasCompletedOnboarding);

  // Sync settings with speech service and document root classes
  useEffect(() => {
    speech.setSpeechRate(settings.speechRate);

    // Apply text size to root html element
    const root = document.documentElement;
    root.classList.remove('font-size-standard', 'font-size-large', 'font-size-xl');
    root.classList.add(`font-size-${settings.textSize}`);

    // Apply theme
    if (settings.theme === 'high-contrast-light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [settings]);

  const updateSettings = (partial: Partial<UserSettings>) => {
    const updated = storageService.updateSettings(partial);
    setSettings(updated);
  };

  const handleSelectView = (view: 'find' | 'remember' | 'changed', initialTarget?: string) => {
    if (initialTarget) {
      setActiveFindTarget(initialTarget);
    }
    setCurrentView(view);
  };

  const handleLocateFromMemory = (itemName: string) => {
    setActiveFindTarget(itemName);
    setCurrentView('find');
  };

  const completeOnboarding = (preferredFeedback: FeedbackMethod) => {
    updateSettings({
      feedbackMethod: preferredFeedback,
      hasCompletedOnboarding: true,
    });
    setIsOnboardingOpen(false);
  };

  const isLight = settings.theme === 'high-contrast-light';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        isLight ? 'bg-zinc-100 text-zinc-950' : 'bg-black text-white'
      }`}
    >
      {/* Screen Reader Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-yellow-400 focus:px-4 focus:py-3 focus:text-zinc-950 focus:font-black focus:shadow-2xl"
      >
        Skip to main content
      </a>

      {/* Screen Reader Live Region Announcer Container */}
      <div id="aura-aria-live-announcer" aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Top Application Header */}
      <Header
        currentView={currentView}
        onNavigateHome={() => setCurrentView('home')}
        settings={settings}
        onUpdateSettings={updateSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 pb-24 outline-none">
        {currentView === 'home' && (
          <HomeDashboard
            onSelectView={handleSelectView}
            savedItems={savedItems}
            settings={settings}
            onOpenFutureModes={() => setIsHelpOpen(true)}
          />
        )}

        {currentView === 'find' && (
          <FindItView
            initialTarget={activeFindTarget}
            onBack={() => setCurrentView('home')}
            settings={settings}
          />
        )}

        {currentView === 'remember' && (
          <RememberItView
            onBack={() => {
              setSavedItems(storageService.getItems());
              setCurrentView('home');
            }}
            onLocateWithCamera={handleLocateFromMemory}
            settings={settings}
          />
        )}

        {currentView === 'changed' && (
          <WhatChangedView
            onBack={() => setCurrentView('home')}
            settings={settings}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Ergonomic Natural Thumb Reach) */}
      <nav
        aria-label="Main Navigation Bar"
        className={`fixed bottom-0 left-0 right-0 z-40 border-t ${
          isLight
            ? 'border-zinc-300 bg-white/95 text-zinc-900'
            : 'border-zinc-800 bg-zinc-950/95 text-white'
        } backdrop-blur-md pb-safe`}
      >
        <div className="mx-auto grid max-w-md grid-cols-4 items-center h-16 px-2">
          {/* Home Tab */}
          <button
            onClick={() => {
              haptic.tapFeedback();
              setCurrentView('home');
              speech.speak('Home dashboard', 'immediate');
            }}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all ${
              currentView === 'home'
                ? 'text-yellow-400 font-extrabold scale-105'
                : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="Home screen"
            aria-current={currentView === 'home' ? 'page' : undefined}
          >
            <HomeIcon className="h-5 w-5" />
            <span className="text-[10px] tracking-tight mt-1">Home</span>
          </button>

          {/* Find It Tab */}
          <button
            onClick={() => {
              haptic.tapFeedback();
              setCurrentView('find');
              speech.speak('Find It mode', 'immediate');
            }}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all ${
              currentView === 'find'
                ? 'text-yellow-400 font-extrabold scale-105'
                : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="Find It mode"
            aria-current={currentView === 'find' ? 'page' : undefined}
          >
            <Compass className="h-5 w-5" />
            <span className="text-[10px] tracking-tight mt-1">Find</span>
          </button>

          {/* Remember It Tab */}
          <button
            onClick={() => {
              haptic.tapFeedback();
              setCurrentView('remember');
              speech.speak('Remember It mode', 'immediate');
            }}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all ${
              currentView === 'remember'
                ? 'text-sky-400 font-extrabold scale-105'
                : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="Remember It mode"
            aria-current={currentView === 'remember' ? 'page' : undefined}
          >
            <BookmarkCheck className="h-5 w-5" />
            <span className="text-[10px] tracking-tight mt-1">Remember</span>
          </button>

          {/* What Changed Tab */}
          <button
            onClick={() => {
              haptic.tapFeedback();
              setCurrentView('changed');
              speech.speak('What Changed mode', 'immediate');
            }}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all ${
              currentView === 'changed'
                ? 'text-emerald-400 font-extrabold scale-105'
                : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="What Changed mode"
            aria-current={currentView === 'changed' ? 'page' : undefined}
          >
            <History className="h-5 w-5" />
            <span className="text-[10px] tracking-tight mt-1">Changed</span>
          </button>
        </div>
      </nav>

      {/* Auxiliary Modals */}
      <FutureModesModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={completeOnboarding}
      />
    </div>
  );
}
