"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";

import { Dialog, DialogTrigger } from "@/app/components/elements/Dialog";

import { Button } from "./Button";
import { CommandDialog } from "./Command";

import type { FileMetadata } from "../../types";

interface SearchResult {
  item: FileMetadata;
  refIndex: number;
}

const Search = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const fuseRef = useRef<Fuse<FileMetadata> | null>(null);
  const isDataLoaded = useRef(false);

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "k") {
        setOpen(true);
      }
    };

    document.addEventListener("keydown", keyDownHandler);

    return () => document.removeEventListener("keydown", keyDownHandler);
  }, []);

  useEffect(() => {
    if (fuseRef.current) {
      const searchResults = fuseRef.current.search(query);
      setResults(searchResults);
    }
  }, [query]);

  const handleFocus = async () => {
    if (!isDataLoaded.current) {
      const BlogFlat = (await import("@/blog-flat.json")).default;
      const formattedBlogs: FileMetadata[] = BlogFlat.map((blog) => ({
        ...blog,
        birthtime: new Date(blog.birthtime),
        mtime: new Date(blog.mtime),
      }));
      fuseRef.current = new Fuse(formattedBlogs, {
        includeScore: true,
        minMatchCharLength: 2,
        keys: [
          {
            name: "data.title",
            weight: 5,
          },
          {
            name: "data.description",
            weight: 3,
          },
          "data.tags",
        ],
      });

      isDataLoaded.current = true;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          size="icon"
          aria-label="search toggle"
        >
          <div className="i-carbon-search wh-4" />
        </Button>
      </DialogTrigger>
      <CommandDialog className="bg-neutral-1 dark:bg-neutral-7">
        <div>
          <div className="flex items-center gap-4">
            <div className="i-carbon-search wh-6" />
            <input
              type="text"
              value={query}
              onFocus={() => {
                void handleFocus();
              }}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, tags, or something..."
              className="w-[100%] border-none bg-transparent font-size-5 outline-0"
            />
          </div>
          {query !== "" ? (
            <div className="mt-6 flex flex-col">
              {results.length === 0 ? (
                <p>Not Found...</p>
              ) : (
                results.map((searchResult, index) => (
                  <Link
                    key={index}
                    href={["/blog", ...searchResult.item.path].join("/")}
                    onClick={() => {
                      setQuery("");
                      setOpen(false);
                    }}
                    className="rounded-2 bg-transparent p-4 color-neutral-7 decoration-none transition duration-200 hover:bg-neutral-3 dark:color-neutral-1 dark:hover:bg-neutral-6"
                  >
                    {searchResult.item.data.title}
                  </Link>
                ))
              )}
            </div>
          ) : null}
        </div>
      </CommandDialog>
    </Dialog>
  );
};

export default Search;
