import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Cpu,
  Utensils,
  Users,
  Shirt,
  FileText,
  Volume2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { speech } from '../services/speechService';
import { haptic } from '../services/hapticService';

interface FutureModesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FutureModesModal: React.FC<FutureModesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeMode, setActiveMode] = useState<
    'appliance' | 'plate' | 'social' | 'clothing' | 'reading'
  >('appliance');

  // Appliance simulator state
  const [fingerPosition, setFingerPosition] = useState<string>('Power Button');
  const [applianceGuidance, setApplianceGuidance] = useState<string>(
    'Finger on Power button. To reach Start, move finger 2 inches right.'
  );

  // Food plate simulator state
  const [plateSpoken, setPlateSpoken] = useState<string>(
    'Chicken at 12 o’clock, vegetables at 3 o’clock, potatoes at 7 o’clock.'
  );

  if (!isOpen) return null;

  const testApplianceButton = (btnName: string, guidanceText: string) => {
    haptic.tapFeedback();
    setFingerPosition(btnName);
    setApplianceGuidance(guidanceText);
    speech.speak(guidanceText, 'immediate', true);
  };

  const testPlateSpeak = () => {
    haptic.tapFeedback();
    speech.speak(plateSpoken, 'immediate', true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="future-modes-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-3xl border-2 border-yellow-400 bg-zinc-950 p-6 text-white shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-yellow-400" />
            <div>
              <h2 id="future-modes-title" className="text-xl font-black text-white">
                Future Capabilities Architecture
              </h2>
              <p className="text-xs text-zinc-400">
                Designed for upcoming releases beyond the 3 MVP modes
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              haptic.tapFeedback();
              onClose();
            }}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
            aria-label="Close future modes preview"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="tablist">
          {[
            { id: 'appliance', label: 'Appliance', icon: Cpu },
            { id: 'plate', label: 'Food Plate', icon: Utensils },
            { id: 'social', label: 'Social', icon: Users },
            { id: 'clothing', label: 'Clothing', icon: Shirt },
            { id: 'reading', label: 'Reading', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  haptic.tapFeedback();
                  setActiveMode(tab.id as any);
                  speech.speak(`Showing ${tab.label} mode architecture`, 'immediate');
                }}
                className={`flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-xl p-2 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-yellow-400 text-zinc-950 font-black shadow-md'
                    : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MODE 1: APPLIANCE MODE */}
        {activeMode === 'appliance' && (
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-yellow-400">Appliance Mode Simulator</h3>
              <p className="text-sm text-zinc-300">
                Helps blind users operate microwaves, washing machines, and vending machines by guiding their finger directly to physical buttons.
              </p>
            </div>

            {/* Interactive Microwave Simulator */}
            <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4 space-y-3">
              <p className="text-xs font-bold uppercase text-zinc-400">
                Simulated Microwave Panel (Tap buttons to test guidance):
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Time Cook', guidance: 'Finger on Time Cook. Move finger 1 inch down for 30 Seconds.' },
                  { name: 'Popcorn', guidance: 'Finger on Popcorn preset. Move finger right for Beverage.' },
                  { name: 'Defrost', guidance: 'Finger on Defrost. Move finger 2 inches down for Start.' },
                  { name: 'Power Level', guidance: 'Finger on Power Level.' },
                  { name: 'Stop / Clear', guidance: 'Stop and Cancel button reached.' },
                  { name: 'START +30s', guidance: 'Start button reached directly under finger! Press to run.' },
                ].map((btn) => (
                  <button
                    key={btn.name}
                    onClick={() => testApplianceButton(btn.name, btn.guidance)}
                    className={`min-h-[50px] rounded-xl border p-2 text-xs font-bold text-center transition-all ${
                      fingerPosition === btn.name
                        ? 'border-yellow-400 bg-yellow-400 text-zinc-950 font-black'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-yellow-400'
                    }`}
                  >
                    {btn.name}
                  </button>
                ))}
              </div>

              {/* Spoken Guidance Box */}
              <div className="rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-3 text-sm font-bold text-yellow-300 flex items-center justify-between">
                <span>"{applianceGuidance}"</span>
                <Volume2 className="h-5 w-5 text-yellow-400 shrink-0 ml-2" />
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: FOOD / PLATE MODE */}
        {activeMode === 'plate' && (
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-yellow-400">Food / Plate Clock-Face Mode</h3>
              <p className="text-sm text-zinc-300">
                Translates dinner plates and buffet trays into standard clock-face coordinates so users know exactly where each food item is located.
              </p>
            </div>

            {/* Simulated Plate Diagram */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative h-56 w-56 rounded-full border-4 border-zinc-700 bg-zinc-950 shadow-inner flex items-center justify-center">
                {/* 12 o'clock */}
                <div className="absolute top-3 text-center">
                  <span className="block text-xs font-black text-amber-400">12:00</span>
                  <span className="text-xs font-bold text-white">Grilled Chicken</span>
                </div>
                {/* 3 o'clock */}
                <div className="absolute right-3 text-right">
                  <span className="block text-xs font-black text-emerald-400">3:00</span>
                  <span className="text-xs font-bold text-white">Steamed Veggies</span>
                </div>
                {/* 7 o'clock */}
                <div className="absolute bottom-5 left-5 text-left">
                  <span className="block text-xs font-black text-yellow-400">7:00</span>
                  <span className="text-xs font-bold text-white">Roasted Potatoes</span>
                </div>

                <div className="h-10 w-10 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-400">
                  Fork
                </div>
              </div>
            </div>

            <button
              onClick={testPlateSpeak}
              className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-xl bg-yellow-400 text-zinc-950 font-black"
            >
              <Volume2 className="h-5 w-5" />
              <span>Speak Plate Layout</span>
            </button>
          </div>
        )}

        {/* MODE 3: SOCIAL AWARENESS */}
        {activeMode === 'social' && (
          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
            <h3 className="text-lg font-bold text-yellow-400">Social Awareness &amp; Ethics</h3>
            <p className="leading-relaxed">
              Provides practical ambient social information without infringing on bystander privacy.
            </p>
            <div className="space-y-2 rounded-xl bg-zinc-950 p-3 text-xs">
              <p className="font-bold text-white uppercase tracking-wider">Features Architected:</p>
              <ul className="list-disc list-inside space-y-1 text-zinc-300">
                <li><strong className="text-white">People Count:</strong> "3 people standing near the conference table."</li>
                <li><strong className="text-white">Speaker Direction:</strong> "Speaker is addressing you from 10 o'clock."</li>
                <li><strong className="text-white">Gesture Detection:</strong> "Person at 2 o'clock is waving or raising their hand."</li>
                <li><strong className="text-amber-400">Strict Privacy Guarantee:</strong> Zero facial recognition or identity tracking of strangers.</li>
              </ul>
            </div>
          </div>
        )}

        {/* MODE 4: CLOTHING ASSISTANCE */}
        {activeMode === 'clothing' && (
          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
            <h3 className="text-lg font-bold text-yellow-400">Clothing &amp; Wardrobe Mode</h3>
            <p className="leading-relaxed">
              Objective, practical assistance with garment matching and inspection without subjective appearance judgments.
            </p>
            <div className="space-y-2 rounded-xl bg-zinc-950 p-3 text-xs">
              <ul className="list-disc list-inside space-y-1 text-zinc-300">
                <li><strong className="text-white">Color Identification:</strong> "Navy blue ribbed sweater with silver buttons."</li>
                <li><strong className="text-white">Palette Matching:</strong> "Matches with your charcoal slacks."</li>
                <li><strong className="text-white">Orientation Inspection:</strong> "Garment is currently inside out; tags visible at top left."</li>
                <li><strong className="text-white">Stain Check:</strong> "Noticeable coffee spill spot on lower right hem."</li>
              </ul>
            </div>
          </div>
        )}

        {/* MODE 5: READING & SIGNS */}
        {activeMode === 'reading' && (
          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
            <h3 className="text-lg font-bold text-yellow-400">Reading &amp; Sign Identification</h3>
            <p className="leading-relaxed">
              Focused optical identification of signs, room numbers, bus routes, medication labels, and currency.
            </p>
            <div className="space-y-2 rounded-xl bg-zinc-950 p-3 text-xs">
              <ul className="list-disc list-inside space-y-1 text-zinc-300">
                <li><strong className="text-white">Door &amp; Room Signs:</strong> "Room 304, Department of Linguistics."</li>
                <li><strong className="text-white">Prescription Bottles:</strong> "Lisinopril 10mg. Take 1 tablet daily in the morning."</li>
                <li><strong className="text-white">Currency Reader:</strong> "Twenty dollar bill, face up."</li>
                <li><strong className="text-white">Restroom Signs:</strong> "All-gender accessible restroom directly ahead."</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 text-right">
          <button
            onClick={() => {
              haptic.tapFeedback();
              onClose();
            }}
            className="min-h-[48px] rounded-xl bg-zinc-800 px-5 text-sm font-bold text-white hover:bg-zinc-700"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
