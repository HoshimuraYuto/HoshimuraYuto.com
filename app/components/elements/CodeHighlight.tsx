"use client";

import { highlightElement } from "prismjs";
import { useEffect, useRef } from "react";
import "@/app/prism.css";

const CodeHighlight = ({
  children,
  lang,
  key,
}: {
  children: React.ReactNode;
  lang: string;
  key: string;
}) => {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (ref.current) {
      highlightElement(ref.current);
    }
  }, []);

  return (
    <pre
      className={`my-4 py-4 px-6 language-${lang}`}
      key={key}
      tabIndex={0}
    >
      <code
        className={`language-${lang}`}
        ref={ref}
      >
        {children}
      </code>
    </pre>
  );
};

export default CodeHighlight;
