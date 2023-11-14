"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import Search from "@/app/components/elements/Search";

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
  const pathname = usePathname();

  const pageTitle = pathname === "/" ? "home" : /\w+/.exec(pathname);

  return (
    <header className="sticky inset-0 top-0 z-10 border-0 border-b-1 border-neutral-1 border-solid bg-white/95 px-10 py-3 backdrop-blur-2 dark:border-neutral-7 dark:bg-neutral-9/75 lt-sm:px-6 dark:backdrop-blur-5">
      <div className="m-auto max-w-[1200px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/`}
            className="flex"
            aria-label="home"
          >
            {siteConfig.headerIcon}
          </Link>
          <span className="color-neutral-2 dark:color-neutral-7">/</span>
          <DropdownMenu>
            <div className="flex items-center gap-1">
              <Link
                href={``}
                className="color-neutral-9 decoration-none dark:color-white"
                aria-label="page title"
              >
                {pageTitle}
              </Link>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="plain"
                  size="original"
                  className="p-0 outline-0"
                  aria-label="page changer"
                >
                  <div className="i-carbon-caret-down color-neutral-4 wh-5 dark:color-neutral-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                sideOffset={8}
                className="bg-white dark:bg-neutral-9"
                aria-label="page dropdown"
              >
                {siteConfig.headerPageNav.map(({ title, slug }) => (
                  <DropdownMenuItem
                    onClick={() => router.push(slug, { scroll: false })}
                    key={title}
                  >
                    {title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </div>
          </DropdownMenu>
        </div>
        <div className="flex gap-4">
          <Search />
          <ThemeChanger />
        </div>
      </div>
    </header>
  );
};

export default Header;
