import { useRef, useEffect } from 'react';

export default function useInterval(func: Function, delay: number) {
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    func();
    intervalRef.current = setInterval(func, delay);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]);

  return null;
}
