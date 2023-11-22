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

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative flex flex-col cursor-pointer gap-4`}>
      <WikiAccordionTitle
        handleClick={handleClick}
        isOpen={isOpen}
      >
        {title}
      </WikiAccordionTitle>
      {isOpen && <WikiAccordionContent>{children}</WikiAccordionContent>}
    </div>
  );
};

const WikiAccordionTitle = ({
  children,
  isOpen,
  handleClick,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  handleClick: () => void;
}) => {
  return (
    <div className="block overflow-hidden text-ellipsis text-ellipsis whitespace-nowrap">
      {children}
      <span
        className={clsx(
          "i-carbon-chevron-right absolute bottom-0 right-0 top-[2px] my-0 rounded-1 bg-neutral-9 wh-5 dark:bg-white",
          isOpen ? `rotate-90` : "",
        )}
        onClick={() => void handleClick()}
      />
    </div>
  );
};

const WikiAccordionContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-4 border-0 border-l-1 border-neutral-1 border-solid pl-4 dark:border-neutral-7">
      {children}
    </div>
  );
};

export default WikiAccordion;
