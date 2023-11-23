"use client";

import { useRef, useState } from "react";

import { Button } from "./Button";

const CustomCode = ({
  children,
  ...props
}: {
  children: string;
}): JSX.Element => {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    const codeElement = preRef.current?.querySelector(
      "code",
    ) as HTMLElement | null;

    await navigator.clipboard.writeText(codeElement?.textContent ?? "");

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <pre
      ref={preRef}
      {...props}
    >
      <Button
        onClick={() => void handleCopy()}
        size="icon"
        aria-label="code copy"
        className="absolute right-[10px] top-[10px]"
      >
        {copied ? (
          <div className="min-wh-4 i-carbon-checkmark color-green" />
        ) : (
          <div className="min-wh-4 i-carbon-copy" />
        )}
      </Button>
      {children}
    </pre>
  );
};

export default CustomCode;
