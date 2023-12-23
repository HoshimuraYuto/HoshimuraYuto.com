"use client";

import { useEffect, useRef, ReactNode } from "react";

const AsideRight = ({ children }: { children: ReactNode }) => {
  const navRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const navElement = navRef.current;
    if (navElement) {
      navElement.style.height = `${window.innerHeight - 140}px`;
    }
  }, []);

  return (
    <nav className="sticky top-[100px] select-none lt-xl:top-[160px]">
      <div
        ref={navRef}
        className="scroll-shadows relative flex flex-col gap-4 overflow-y-scroll"
      >
        <span className="font-size-4.5">目次</span>
        {children}
      </div>
    </nav>
  );
};

export default AsideRight;
