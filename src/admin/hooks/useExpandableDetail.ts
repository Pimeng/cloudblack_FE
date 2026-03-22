import { useState, useRef, useCallback, type RefObject } from 'react';

export type AnimationPhase = 'initial' | 'expanding' | 'content' | 'closing-start' | 'closing';

interface UseExpandableDetailOptions<T> {
  onOpen?: (item: T) => void;
  onClose?: () => void;
}

interface UseExpandableDetailReturn<T> {
  isOpen: boolean;
  viewingItem: T | null;
  animating: boolean;
  animationPhase: AnimationPhase;
  cardRect: DOMRect | null;
  lastItemId: string | null;
  refs: RefObject<Map<string, HTMLElement>>;
  openDetail: (item: T, itemId: string) => void;
  closeDetail: () => void;
}

export function useExpandableDetail<T>(
  options: UseExpandableDetailOptions<T> = {}
): UseExpandableDetailReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<T | null>(null);
  const [animating, setAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('initial');
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const [lastItemId, setLastItemId] = useState<string | null>(null);
  const refs = useRef<Map<string, HTMLElement>>(new Map());

  const openDetail = useCallback((item: T, itemId: string) => {
    const element = refs.current.get(itemId);
    if (element) {
      const rect = element.getBoundingClientRect();
      
      setLastItemId(itemId);
      setViewingItem(item);
      setCardRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      } as DOMRect);
      setAnimating(true);
      setAnimationPhase('initial');
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationPhase('expanding');
        });
      });
      
      setTimeout(() => {
        setIsOpen(true);
        options.onOpen?.(item);
      }, 250);
      
      setTimeout(() => {
        setAnimationPhase('content');
      }, 350);
    } else {
      setViewingItem(item);
      setIsOpen(true);
      options.onOpen?.(item);
    }
  }, [options]);

  const closeDetail = useCallback(() => {
    if (lastItemId) {
      const element = refs.current.get(lastItemId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setCardRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        } as DOMRect);
      }
    }
    
    setAnimationPhase('closing-start');
    
    requestAnimationFrame(() => {
      setAnimationPhase('closing');
    });
    
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
    
    setTimeout(() => {
      setAnimationPhase('initial');
      setAnimating(false);
      setCardRect(null);
      setLastItemId(null);
      setViewingItem(null);
      options.onClose?.();
    }, 350);
  }, [lastItemId, options]);

  return {
    isOpen,
    viewingItem,
    animating,
    animationPhase,
    cardRect,
    lastItemId,
    refs,
    openDetail,
    closeDetail,
  };
}
