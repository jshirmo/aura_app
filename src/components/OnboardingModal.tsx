import React, { useState } from 'react';
import { Compass, BookmarkCheck, History, ArrowRight, Check, Volume2, Vibrate } from 'lucide-react';
import { FeedbackMethod } from '../types';
import { speech } from '../services/speechService';
import { haptic } from '../services/hapticService';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (preferredFeedback: FeedbackMethod) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackMethod>('both');

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to Aura',
      subtitle: 'Your Visual Environment Companion',
      description:
        'Aura is designed for action rather than generic image descriptions. Instead of saying "I see a room", Aura tells you where your water bottle is, in which direction, and how many feet away.',
      icon: Compass,
      color: 'text-yellow-400 bg-yellow-400/20 border-yellow-400',
    },
    {
      title: '1. FIND IT',
      subtitle: 'Directional Clock-Face Navigation',
      description:
        'Ask to find an empty chair, door, elevator, or water bottle. Aura guides you with concise directions: "Chair at 2 o’clock, approximately 7 feet away. Move slightly left."',
      icon: Compass,
      color: 'text-yellow-400 bg-yellow-400/20 border-yellow-400',
    },
    {
      title: '2. REMEMBER IT',
      subtitle: 'Personal Visual Memory System',
      description:
        'Point your camera at personal items and say "Remember this as my medication". Later, ask "Where are my AirPods?" and Aura recalls their location and helps you locate them.',
      icon: BookmarkCheck,
      color: 'text-sky-400 bg-sky-400/20 border-sky-400',
    },
    {
      title: '3. WHAT CHANGED?',
      subtitle: 'Room Differential & Hazard Detection',
      description:
        'Save a baseline of your bedroom, kitchen, or classroom. Later, Aura spots moved chairs, backpacks on the walkway, or trip hazards without redescribing the entire room.',
      icon: History,
      color: 'text-emerald-400 bg-emerald-400/20 border-emerald-400',
    },
    {
      title: 'Preferred Feedback',
      subtitle: 'How should Aura guide you?',
      description:
        'Choose how you want to receive directions and alerts. You can change this anytime in Settings.',
      icon: Volume2,
      color: 'text-yellow-400 bg-yellow-400/20 border-yellow-400',
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const nextStep = () => {
    haptic.tapFeedback();
    if (step < steps.length - 1) {
      setStep(step + 1);
      speech.speak(steps[step + 1].title + '. ' + steps[step + 1].description, 'immediate', true);
    } else {
      onComplete(selectedFeedback);
      speech.speak('Setup complete. Welcome to Aura home screen.', 'immediate', true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-lg rounded-3xl border-2 border-yellow-400 bg-zinc-950 p-6 text-white shadow-2xl space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
          <span>Step {step + 1} of {steps.length}</span>
          <button
            onClick={() => onComplete('both')}
            className="text-yellow-400 hover:underline"
          >
            Skip to App
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-4 text-center">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border-2 ${currentStep.color}`}>
            <Icon className="h-10 w-10" />
          </div>

          <div className="space-y-1">
            <h2 id="onboarding-step-title" className="text-2xl font-black text-white">
              {currentStep.title}
            </h2>
            <p className="text-sm font-bold text-yellow-300">
              {currentStep.subtitle}
            </p>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
            {currentStep.description}
          </p>

          {/* Feedback method selector on final step */}
          {step === steps.length - 1 && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { id: 'both', label: 'Both Audio & Haptics' },
                { id: 'audio', label: 'Audio Only' },
                { id: 'haptic', label: 'Haptic Only' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    haptic.tapFeedback();
                    setSelectedFeedback(opt.id as any);
                  }}
                  className={`min-h-[56px] rounded-xl p-2 text-xs font-bold transition-all ${
                    selectedFeedback === opt.id
                      ? 'bg-yellow-400 text-zinc-950 font-black ring-2 ring-yellow-400 shadow-lg'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Next / Complete button */}
        <button
          onClick={nextStep}
          className="w-full min-h-[60px] flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 font-black text-zinc-950 text-lg hover:bg-yellow-300 shadow-xl active:scale-98 transition-all"
        >
          <span>{step === steps.length - 1 ? 'Start Using Aura' : 'Next'}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
