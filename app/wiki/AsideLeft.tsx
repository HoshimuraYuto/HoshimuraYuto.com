"use client";

import { useEffect, useRef, ReactNode } from "react";

const AsideLeft = ({ children }: { children: ReactNode }) => {
  const navRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const navElement = navRef.current;
    if (navElement) {
      navElement.style.height = `${window.innerHeight - 140}px`;
    }
  }, []);

  return (
    <nav className="sticky top-[100px] select-none lt-md:hidden">
      <div
        ref={navRef}
        className="scroll-shadows relative flex flex-col gap-4 overflow-y-scroll"
      >
        {children}
      </div>
    </nav>
  );
};

export default AsideLeft;
