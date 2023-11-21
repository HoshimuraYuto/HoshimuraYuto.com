"use client";

import clsx from "clsx";
import React, { useState } from "react";

const WikiAccordion = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleDetailsClick = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <details
      className={`relative flex flex-col cursor-pointer gap-4`}
      onToggle={(e) => {
        handleDetailsClick(e);
      }}
    >
      <WikiAccordionTitle isOpen={isOpen}>{title}</WikiAccordionTitle>
      <WikiAccordionContent>{children}</WikiAccordionContent>
    </details>
  );
};

const WikiAccordionTitle = ({
  children,
  isOpen,
}: {
  children: React.ReactNode;
  isOpen: boolean;
}) => {
  return (
    <summary className="block w-[calc(100%-20px)] overflow-hidden text-ellipsis text-ellipsis whitespace-nowrap">
      {children}
      <span
        className={clsx(
          "i-carbon-chevron-right absolute bottom-0 right-0 top-[2px] my-0 rounded-1 bg-neutral-9 wh-5 dark:bg-white",
          isOpen ? `rotate-90` : "",
        )}
      />
    </summary>
  );
};

const WikiAccordionContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mt-3 flex flex-col gap-4 border-0 border-l-1 border-neutral-1 border-solid pl-4 dark:border-neutral-7">
      {children}
    </div>
  );
};

export default WikiAccordion;
