import { Button } from "../components/elements/Button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../components/elements/Sheet";

import WikiMenu from "./WikiMenu";

const WikiHeader = () => {
  return (
    <div className="sticky inset-0 top-[61px] z-10 border-0 border-b-1 border-neutral-1 border-solid bg-white/95 px-10 py-3 backdrop-blur-2 md:hidden dark:border-neutral-7 dark:bg-neutral-9/75 lt-sm:px-6 dark:backdrop-blur-5">
      <div className="m-auto max-w-[1200px] flex items-center justify-between">
        <Sheet>
          <SheetTrigger
            asChild
            className="bg-white dark:bg-neutral-9"
          >
            <Button
              size="icon"
              aria-label="search toggle"
            >
              <div className="i-carbon-menu wh-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="max-w-[250px] w-[250px] bg-white dark:bg-neutral-9"
          >
            <nav className="flex flex-col select-none gap-4">
              <WikiMenu />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default WikiHeader;
