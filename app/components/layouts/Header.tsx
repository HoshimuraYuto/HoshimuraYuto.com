"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import siteConfig from "../../config/siteConfig";
import { ThemeChanger } from "../../theme";
import { Button } from "../elements/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../elements/Dropdown";

const Header = () => {
  const router = useRouter();

  return (
    <header className="sticky inset-0 top-0 border-0 border-b-1 border-neutral-1 border-solid bg-white/95 p-3 backdrop-blur-2 dark:border-neutral-7 dark:bg-neutral-9/75 dark:backdrop-blur-5">
      <div className="m-auto max-w-[1200px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/`}
            className="flex"
          >
            {siteConfig.headerIcon}
          </Link>
          <span className="color-neutral-2 dark:color-neutral-7">/</span>
          <DropdownMenu>
            <div className="flex items-center gap-1">
              <Link
                href={``}
                className="color-neutral-9 decoration-none dark:color-white"
              >
                home
              </Link>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="plain"
                  size="original"
                  className="p-0 outline-0"
                >
                  <div className="i-carbon-chevron-down color-neutral-4 wh-4 dark:color-neutral-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                sideOffset={8}
                className="bg-white dark:bg-neutral-9"
              >
                <DropdownMenuItem
                  onClick={() => router.push("/", { scroll: false })}
                >
                  home
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>
        </div>
        <div>
          <ThemeChanger />
        </div>
      </div>
    </header>
  );
};

export default Header;
