import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  Search,
  Volume2,
  Trash2,
  Compass,
  Check,
  Plus,
  RefreshCw,
  Sparkles,
  MapPin,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { SavedItem, UserSettings } from '../types';
import { speech } from '../services/speechService';
import { haptic } from '../services/hapticService';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import { SAMPLE_AIRPODS_IMAGE, SAMPLE_MEDICATION_IMAGE } from '../services/sampleImages';

interface RememberItViewProps {
  onBack: () => void;
  onLocateWithCamera: (itemName: string) => void;
  settings: UserSettings;
}

export const RememberItView: React.FC<RememberItViewProps> = ({
  onBack,
  onLocateWithCamera,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'capture'>('library');
  const [items, setItems] = useState<SavedItem[]>(() => storageService.getItems());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('All');

  // Capture Mode State
  const [userPrompt, setUserPrompt] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedAnalysis, setDetectedAnalysis] = useState<{
    objectName: string;
    category: string;
    suggestedRoom: string;
    distinctiveFeatures: string[];
    audioConfirmation: string;
  } | null>(null);

  // Form edit states
  const [editRoom, setEditRoom] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Camera video ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera for capture mode
  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (activeTab !== 'capture') {
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
        console.warn('Camera failed in capture mode:', err);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeTab]);

  const refreshItems = () => {
    setItems(storageService.getItems());
  };

  // Capture frame & analyze
  const handleSnapAndAnalyze = async (presetPrompt?: string) => {
    haptic.tapFeedback();
    setIsCapturing(true);

    const promptToUse = presetPrompt || userPrompt || 'Remember this item';
    speech.speak(`Inspecting item: ${promptToUse}... Hold steady.`, 'immediate');

    let base64 = SAMPLE_MEDICATION_IMAGE;
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(videoRef.current.videoWidth, 800);
      canvas.height = Math.min(videoRef.current.videoHeight, 600);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        base64 = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    setCapturedImage(base64);

    try {
      const analysis = await apiService.analyzeObject(base64, promptToUse);
      setDetectedAnalysis(analysis);
      setEditRoom(analysis.suggestedRoom || 'Living Room');
      setEditNotes(analysis.distinctiveFeatures.join(', '));

      speech.speak(analysis.audioConfirmation || `Identified ${analysis.objectName}.`, 'immediate', true);
    } catch (err: any) {
      console.error(err);
      speech.speak('Could not identify object. Please adjust lighting and try again.', 'immediate');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSaveItem = () => {
    if (!detectedAnalysis) return;
    haptic.tapFeedback();

    const now = new Date();
    const timeStr = `Today at ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

    const saved = storageService.saveItem({
      name: detectedAnalysis.objectName,
      category: detectedAnalysis.category || 'Personal Item',
      room: editRoom || detectedAnalysis.suggestedRoom || 'Living Room',
      locationDescription: `${editRoom || detectedAnalysis.suggestedRoom} (${editNotes || 'Saved item'})`,
      lastSeenDate: timeStr,
      capturedImage: capturedImage || SAMPLE_AIRPODS_IMAGE,
      notes: editNotes,
      distinctiveFeatures: detectedAnalysis.distinctiveFeatures,
      confidence: 0.95,
    });

    refreshItems();
    speech.speak(`Saved ${saved.name} in ${saved.room}. Added to your memory library.`, 'immediate', true);

    // Reset capture view
    setDetectedAnalysis(null);
    setCapturedImage(null);
    setUserPrompt('');
    setActiveTab('library');
  };

  const speakItemDetails = (item: SavedItem) => {
    haptic.tapFeedback();
    const narration = `Your ${item.name} was last seen in the ${item.room}: ${item.locationDescription}. Recorded ${item.lastSeenDate}. Distinctive traits: ${item.distinctiveFeatures?.join(', ') || item.notes}.`;
    speech.speak(narration, 'immediate', true);
  };

  const handleDeleteItem = (id: string, name: string) => {
    haptic.tapFeedback();
    if (confirm(`Remove ${name} from your remembered items?`)) {
      storageService.deleteItem(id);
      refreshItems();
      speech.speak(`Removed ${name} from memory.`, 'immediate', true);
    }
  };

  // Filtering
  const rooms = ['All', ...Array.from(new Set(items.map((i) => i.room)))];
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoom = selectedRoom === 'All' || item.room === selectedRoom;
    return matchesSearch && matchesRoom;
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            haptic.tapFeedback();
            onBack();
          }}
          className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400"
          aria-label="Back to home screen"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        <h1 className="text-xl font-black text-white tracking-tight">Remember It</h1>
      </div>

      {/* Accessible Segmented Tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'library'}
          onClick={() => {
            haptic.tapFeedback();
            setActiveTab('library');
            speech.speak('Browsing saved items library', 'immediate');
          }}
          className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition-all ${
            activeTab === 'library'
              ? 'bg-sky-400 text-zinc-950 shadow-md ring-2 ring-sky-400'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Saved Items ({items.length})</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'capture'}
          onClick={() => {
            haptic.tapFeedback();
            setActiveTab('capture');
            speech.speak('Remember new item mode. Point camera and say what to save.', 'immediate');
          }}
          className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition-all ${
            activeTab === 'capture'
              ? 'bg-sky-400 text-zinc-950 shadow-md ring-2 ring-sky-400'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>Save New Item</span>
        </button>
      </div>

      {/* TAB 1: SAVED ITEMS LIBRARY */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Where are my AirPods? (or type item name)"
              className="w-full min-h-[52px] rounded-2xl border border-zinc-700 bg-zinc-900 pl-12 pr-4 text-sm font-semibold text-white placeholder-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label="Search saved items by name or room"
            />
          </div>

          {/* Room Filter Pills */}
          <div className="flex flex-wrap gap-2" role="region" aria-label="Room filter">
            {rooms.map((room) => {
              const isSelected = selectedRoom === room;
              return (
                <button
                  key={room}
                  onClick={() => {
                    haptic.tapFeedback();
                    setSelectedRoom(room);
                    speech.speak(`Showing items in ${room}`, 'immediate');
                  }}
                  className={`min-h-[44px] rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-sky-400 text-zinc-950 ring-2 ring-sky-400'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                  aria-pressed={isSelected}
                >
                  {room}
                </button>
              );
            })}
          </div>

          {/* List of Saved Items */}
          <div className="space-y-3" role="feed" aria-label="Saved Items List">
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400 space-y-2">
                <AlertCircle className="mx-auto h-8 w-8 text-zinc-500" />
                <p className="text-base font-bold text-white">No items found</p>
                <p className="text-sm">Try searching another name or switch to "Save New Item" tab.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border-2 border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-700 shadow-xl space-y-3"
                  aria-label={`${item.name}, saved in ${item.room}. Last seen: ${item.lastSeenDate}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Item Thumbnail / Reference Image */}
                    {item.capturedImage ? (
                      <img
                        src={item.capturedImage}
                        alt={`Photo of ${item.name}`}
                        className="h-20 w-20 shrink-0 rounded-2xl border border-zinc-700 object-cover bg-zinc-950"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 text-sky-400">
                        <Tag className="h-8 w-8" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-black text-white truncate">{item.name}</h2>
                        <span className="shrink-0 text-xs font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/30">
                          {item.room}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-yellow-300">
                        {item.locationDescription}
                      </p>

                      <p className="text-xs text-zinc-400">
                        Last seen: <span className="text-zinc-200">{item.lastSeenDate}</span>
                      </p>
                    </div>
                  </div>

                  {/* Distinctive Features List */}
                  {item.distinctiveFeatures && item.distinctiveFeatures.length > 0 && (
                    <div className="rounded-xl bg-zinc-950/70 p-2.5 text-xs text-zinc-300">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] block mb-1">
                        Tactile &amp; Visual Identifiers
                      </span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {item.distinctiveFeatures.map((feat, idx) => (
                          <li key={idx} className="truncate">{feat}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800">
                    {/* Speak Location */}
                    <button
                      onClick={() => speakItemDetails(item)}
                      className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-xs font-bold text-white hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-sky-400"
                      aria-label={`Read location of ${item.name} aloud`}
                    >
                      <Volume2 className="h-4 w-4 text-sky-400" />
                      <span>Speak</span>
                    </button>

                    {/* Locate with Camera */}
                    <button
                      onClick={() => {
                        haptic.tapFeedback();
                        speech.speak(`Launching camera to locate ${item.name}`, 'immediate');
                        onLocateWithCamera(item.name);
                      }}
                      className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-sky-400 px-3 text-xs font-extrabold text-zinc-950 hover:bg-sky-300 focus-visible:ring-2 focus-visible:ring-white"
                      aria-label={`Open camera to locate ${item.name}`}
                    >
                      <Compass className="h-4 w-4" />
                      <span>Locate</span>
                    </button>

                    {/* Delete Item */}
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-xs font-bold text-zinc-400 hover:text-red-400 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-red-400"
                      aria-label={`Delete ${item.name} from saved items`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REMEMBER NEW ITEM */}
      {activeTab === 'capture' && (
        <div className="space-y-4">
          {/* Quick Voice / Text prompt suggestions */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              What are you saving? (Choose or type):
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Remember this as my shampoo',
                'Remember my medication is here',
                'This is my black backpack',
                'Remember where I put my keys',
              ].map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => {
                    setUserPrompt(phrase);
                    handleSnapAndAnalyze(phrase);
                  }}
                  className="min-h-[44px] rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-200 hover:border-sky-400 hover:text-white"
                >
                  "{phrase}"
                </button>
              ))}
            </div>
          </div>

          {/* Camera Viewfinder */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-zinc-800 bg-black aspect-video sm:aspect-[4/3] flex items-center justify-center shadow-2xl">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured reference photo of the item"
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
                aria-label="Camera viewfinder for saving object"
              />
            )}

            {isCapturing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-sky-400 font-bold text-sm">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span>Analyzing object features...</span>
              </div>
            )}
          </div>

          {/* Capture Trigger Button */}
          {!detectedAnalysis ? (
            <button
              onClick={() => handleSnapAndAnalyze()}
              disabled={isCapturing}
              className="w-full min-h-[64px] flex items-center justify-center gap-3 rounded-2xl bg-sky-400 px-6 py-4 font-black text-zinc-950 hover:bg-sky-300 text-lg shadow-xl active:scale-98 transition-all disabled:opacity-50"
              aria-label="Capture and inspect item with camera"
            >
              <Camera className="h-6 w-6" />
              <span>Capture &amp; Analyze Item</span>
            </button>
          ) : (
            /* Analysis Confirmation & Form */
            <div className="rounded-3xl border-2 border-sky-400 bg-zinc-900 p-5 space-y-4 shadow-2xl">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  Detected Item
                </span>
                <h3 className="text-2xl font-black text-white">{detectedAnalysis.objectName}</h3>
                <p className="text-sm font-semibold text-yellow-300">
                  {detectedAnalysis.audioConfirmation}
                </p>
              </div>

              {/* Room selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-400">Room Location:</label>
                <div className="flex flex-wrap gap-2">
                  {['Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Entryway', 'Backpack'].map((rm) => (
                    <button
                      key={rm}
                      type="button"
                      onClick={() => {
                        haptic.tapFeedback();
                        setEditRoom(rm);
                      }}
                      className={`min-h-[44px] rounded-xl px-3.5 py-1.5 text-xs font-bold ${
                        editRoom === rm
                          ? 'bg-sky-400 text-zinc-950 ring-2 ring-sky-400'
                          : 'border border-zinc-700 bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {rm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-400">Tactile &amp; Placement Notes:</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. On desk by lamp, amber prescription bottle"
                  className="w-full min-h-[48px] rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-white"
                />
              </div>

              {/* Confirmation buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    haptic.tapFeedback();
                    setDetectedAnalysis(null);
                    setCapturedImage(null);
                  }}
                  className="min-h-[52px] rounded-xl border border-zinc-700 bg-zinc-800 font-bold text-zinc-300 hover:bg-zinc-700"
                >
                  Retake Photo
                </button>

                <button
                  onClick={handleSaveItem}
                  className="min-h-[52px] flex items-center justify-center gap-2 rounded-xl bg-sky-400 font-black text-zinc-950 hover:bg-sky-300 shadow-lg"
                >
                  <Check className="h-5 w-5" />
                  <span>Save to Memory</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
