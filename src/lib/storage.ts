/**
 * Local Storage utility for persisting app data
 * Provides a simple API for saving and loading data with automatic serialization
 */

interface Jar {
  id: number;
  name: string;
  target: number;
  saved: number;
  streak: number;
  withdrawn: number;
  notes?: JarNote[];
  records?: TransactionRecord[];
  currency?: string;
  categoryId?: number;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Note {
  id: number;
  text: string;
  color: string;
}

interface JarNote {
  id: number;
  text: string;
  color: string;
}

interface TransactionRecord {
  id: number;
  type: 'saved' | 'withdrawn';
  amount: number;
  date: Date;
}

const STORAGE_KEYS = {
  JARS: 'jarify_jars',
  CATEGORIES: 'jarify_categories',
  NOTES: 'jarify_notes',
  DARK_MODE: 'jarify_darkMode',
  LAST_NOTIFICATION: 'jarify_lastNotification',
} as const;

/**
 * Save data to localStorage with JSON serialization
 */
const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

/**
 * Load data from localStorage with JSON parsing
 */
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
  }
  return defaultValue;
};

/**
 * Storage API for the Jarify app
 */
export const storage = {
  // Jars
  saveJars: (jars: Jar[]) => {
    saveToStorage(STORAGE_KEYS.JARS, jars);
  },
  
  loadJars: (): Jar[] => {
    const jars = loadFromStorage<Jar[]>(STORAGE_KEYS.JARS, []);
    // Convert date strings back to Date objects for records
    return jars.map(jar => ({
      ...jar,
      records: jar.records?.map(record => ({
        ...record,
        date: new Date(record.date),
      })) || [],
    }));
  },

  // Categories
  saveCategories: (categories: Category[]) => {
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  },
  
  loadCategories: (): Category[] => {
    return loadFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  },

  // Notes
  saveNotes: (notes: Note[]) => {
    saveToStorage(STORAGE_KEYS.NOTES, notes);
  },
  
  loadNotes: (): Note[] => {
    return loadFromStorage<Note[]>(STORAGE_KEYS.NOTES, []);
  },

  // Dark Mode
  saveDarkMode: (darkMode: boolean) => {
    saveToStorage(STORAGE_KEYS.DARK_MODE, darkMode);
  },
  
  loadDarkMode: (): boolean => {
    return loadFromStorage<boolean>(STORAGE_KEYS.DARK_MODE, false);
  },

  // Last Notification Date
  saveLastNotification: (date: string) => {
    saveToStorage(STORAGE_KEYS.LAST_NOTIFICATION, date);
  },
  
  loadLastNotification: (): string | null => {
    return loadFromStorage<string | null>(STORAGE_KEYS.LAST_NOTIFICATION, null);
  },

  // Clear all data (useful for reset functionality)
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
