import { SavedItem, SavedEnvironment, UserSettings } from '../types';
import {
  SAMPLE_AIRPODS_IMAGE,
  SAMPLE_MEDICATION_IMAGE,
  SAMPLE_WATER_BOTTLE_IMAGE,
  SAMPLE_KEYS_IMAGE,
  SAMPLE_LIVING_ROOM_BASELINE,
} from './sampleImages';

const STORAGE_KEYS = {
  ITEMS: 'aura_saved_items_v1',
  ENVIRONMENTS: 'aura_saved_environments_v1',
  SETTINGS: 'aura_user_settings_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  feedbackMethod: 'both',
  speechRate: 1.0,
  theme: 'high-contrast-dark',
  textSize: 'large', // Accessibility default: large text
  autoContinuousGuidance: true,
  hapticIntensity: 'high',
  soundEffects: true,
  hasCompletedOnboarding: false,
};

const INITIAL_ITEMS: SavedItem[] = [
  {
    id: 'item-airpods',
    name: 'AirPods Pro',
    category: 'Electronics',
    room: 'Bedroom',
    locationDescription: 'Bedroom desk next to the desk lamp',
    lastSeenDate: 'Yesterday at 9:42 PM',
    capturedImage: SAMPLE_AIRPODS_IMAGE,
    notes: 'White gloss wireless charging case with green battery LED.',
    distinctiveFeatures: ['White rounded pebble case', 'Front charging indicator pinhole', 'Lightning / USB-C port at base'],
    confidence: 0.96,
  },
  {
    id: 'item-medication',
    name: 'Blood Pressure Medication',
    category: 'Healthcare',
    room: 'Bedroom',
    locationDescription: 'Nightstand top right surface',
    lastSeenDate: 'Today at 7:15 AM',
    capturedImage: SAMPLE_MEDICATION_IMAGE,
    notes: 'Amber prescription bottle with white childproof push-and-turn cap.',
    distinctiveFeatures: ['Amber plastic cylinder', 'Textured white push-down cap', 'Square white Rx pharmacy label'],
    confidence: 0.94,
  },
  {
    id: 'item-water-bottle',
    name: 'Hydro Flask Water Bottle',
    category: 'Personal Item',
    room: 'Kitchen',
    locationDescription: 'Kitchen island counter next to fruit bowl',
    lastSeenDate: 'Today at 8:30 AM',
    capturedImage: SAMPLE_WATER_BOTTLE_IMAGE,
    notes: 'Cobalt blue 24oz insulated bottle with black carrying loop.',
    distinctiveFeatures: ['Cobalt blue powder coat', 'Rigid black lid loop', 'Silver base rim'],
    confidence: 0.98,
  },
  {
    id: 'item-keys',
    name: 'Apartment Keys & Fob',
    category: 'Essentials',
    room: 'Entryway',
    locationDescription: 'Entryway wooden key tray by front door',
    lastSeenDate: 'Today at 9:00 AM',
    capturedImage: SAMPLE_KEYS_IMAGE,
    notes: 'Ring with 2 brass keys and blue RFID building fob.',
    distinctiveFeatures: ['Blue oval electronic fob', 'Brass serrated house key', 'Stainless steel split ring'],
    confidence: 0.92,
  },
];

const INITIAL_ENVIRONMENTS: SavedEnvironment[] = [
  {
    id: 'env-living-room',
    name: 'Living Room',
    baselineImage: SAMPLE_LIVING_ROOM_BASELINE,
    baselineDate: 'Baseline recorded 2 days ago',
    notes: 'Standard clear walking path between hallway and balcony door.',
    walkwayClear: true,
  },
  {
    id: 'env-bedroom',
    name: 'Bedroom Walkway',
    baselineImage: SAMPLE_LIVING_ROOM_BASELINE,
    baselineDate: 'Baseline recorded 1 week ago',
    notes: 'Path between bed and ensuite bathroom door.',
    walkwayClear: true,
  },
];

export const storageService = {
  // Settings
  getSettings(): UserSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  },

  updateSettings(partial: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
    return updated;
  },

  // Saved Items
  getItems(): SavedItem[] {
    if (typeof window === 'undefined') return INITIAL_ITEMS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (stored) {
        return JSON.parse(stored);
      }
      // Seed initially
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
      return INITIAL_ITEMS;
    } catch (e) {
      console.warn('Failed to load items:', e);
      return INITIAL_ITEMS;
    }
  },

  getItem(id: string): SavedItem | undefined {
    return this.getItems().find((item) => item.id === id);
  },

  saveItem(item: Omit<SavedItem, 'id'> & { id?: string }): SavedItem {
    const items = this.getItems();
    const newItem: SavedItem = {
      ...item,
      id: item.id || `item-${Date.now()}`,
    };

    const existingIdx = items.findIndex((i) => i.id === newItem.id);
    if (existingIdx >= 0) {
      items[existingIdx] = newItem;
    } else {
      items.unshift(newItem);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist item:', e);
    }
    return newItem;
  },

  deleteItem(id: string): boolean {
    const items = this.getItems().filter((i) => i.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      return true;
    } catch {
      return false;
    }
  },

  // Environments
  getEnvironments(): SavedEnvironment[] {
    if (typeof window === 'undefined') return INITIAL_ENVIRONMENTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify(INITIAL_ENVIRONMENTS));
      return INITIAL_ENVIRONMENTS;
    } catch (e) {
      console.warn('Failed to load environments:', e);
      return INITIAL_ENVIRONMENTS;
    }
  },

  getEnvironment(id: string): SavedEnvironment | undefined {
    return this.getEnvironments().find((e) => e.id === id);
  },

  saveEnvironment(env: Omit<SavedEnvironment, 'id'> & { id?: string }): SavedEnvironment {
    const list = this.getEnvironments();
    const newEnv: SavedEnvironment = {
      ...env,
      id: env.id || `env-${Date.now()}`,
    };

    const existingIdx = list.findIndex((e) => e.id === newEnv.id);
    if (existingIdx >= 0) {
      list[existingIdx] = newEnv;
    } else {
      list.unshift(newEnv);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to persist environment:', e);
    }
    return newEnv;
  },

  deleteEnvironment(id: string): boolean {
    const list = this.getEnvironments().filter((e) => e.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  },

  // Privacy: Purge all local data
  deleteAllUserData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ITEMS);
      localStorage.removeItem(STORAGE_KEYS.ENVIRONMENTS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch {}
  },
};
