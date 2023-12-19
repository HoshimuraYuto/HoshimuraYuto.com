import { useEffect, useRef } from "react";

const useIntersectionObserver = (
  callback: (
    entries: IntersectionObserverEntry[],
    observer?: IntersectionObserver,
  ) => void,
  options: {
    root?: null | Element;
    rootMargin?: string;
    threshold?: number;
  } = {
    root: null,
    rootMargin: "0px",
    threshold: 0,
  },
) => {
  const elementRef = useRef<null | HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(callback, options);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return { elementRef };
};

export default useIntersectionObserver;
