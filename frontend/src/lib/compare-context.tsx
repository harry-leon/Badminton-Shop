'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CompareItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  imageUrl: string;
  priceFrom: number;
  playerType: string;
  balancePoint?: number;
  stiffness?: string;
  weight?: string;
  maxTension?: string;
}

interface CompareContextType {
  items: CompareItem[];
  addToCompare: (item: CompareItem) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE = 3;
const STORAGE_KEY = 'smashcourt_compare_items';

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors
    }
  }, [items, mounted]);

  const addToCompare = (item: CompareItem) => {
    if (items.some((i) => i.id === item.id)) {
      removeFromCompare(item.id);
      return;
    }

    if (items.length >= MAX_COMPARE) {
      return;
    }

    setItems((prev) => [...prev, item]);
  };

  const removeFromCompare = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCompare = () => {
    setItems([]);
  };

  const isInCompare = (id: string) => {
    return items.some((i) => i.id === id);
  };

  return (
    <CompareContext.Provider
      value={{
        items,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

const fallbackCompareContext: CompareContextType = {
  items: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  clearCompare: () => {},
  isInCompare: () => false,
};

export function useCompare() {
  const context = useContext(CompareContext);
  return context || fallbackCompareContext;
}
