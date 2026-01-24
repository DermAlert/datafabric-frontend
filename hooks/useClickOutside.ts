import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook para detectar cliques fora de um elemento
 * @param handler - Função a ser chamada quando clicar fora
 * @param enabled - Se o hook está ativo (padrão: true)
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled = true
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handler, enabled]);

  return ref;
}
