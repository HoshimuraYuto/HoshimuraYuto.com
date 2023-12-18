"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Avatar from "boring-avatars";
import clsx from "clsx";
import moment from "moment";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import "moment/locale/ja";

import useIntersectionObserver from "@/app/hooks/useIntersectionObserver";

interface Comment {
  id: number;
  article: string;
  created_at: string;
  author_name: string;
  content: string;
}

type CommentsList = Comment[];

const CommentSchema = z.object({
  author_name: z.string().max(10, "名前は10文字以内にしてください"),
  content: z.string().max(500, "コメント本文は500文字以内にしてください"),
});

type CommentType = z.infer<typeof CommentSchema>;

const Comments = ({ id }: { id: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);
  const [comments, setComments] = useState<CommentsList>([]);

  const { elementRef } = useIntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      }
    },
    {
      rootMargin: "40px",
    },
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CommentType>({
    resolver: zodResolver(CommentSchema),
  });

  const onSubmit: SubmitHandler<CommentType> = async (data: CommentType) => {
    try {
      const res = await fetch(
        process.env.NODE_ENV === "development"
          ? "http://localhost:50431/comments"
          : "https://api.hoshimurayuto.com/comments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            post: id,
            author_name: data.author_name,
            content: data.content,
          }),
        },
      );
      if (!res.ok) {
        throw new Error("submit error");
      }
      setIsSubmit(true);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      void (async () => {
        try {
          const res = await fetch(
            process.env.NODE_ENV === "development"
              ? `http://localhost:50431/comments?post=${id}`
              : `https://api.hoshimurayuto.com/comments?post=${id}`,
          );
          // ! : This line causes errors only in GitHub Actions
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const json: CommentsList = await res.json();
          setComments(json);
        } catch (e) {
          console.error(e);
        }
      })();
    }
  }, [id, isVisible]);

  return (
    <section
      ref={elementRef}
      className="border-0 border-t-2 border-color-neutral-4 border-solid dark:border-color-neutral-5"
    >
      <h2 className="my-16 font-size-8 font-bold tracking-[0.05rem]">
        コメント
      </h2>
      <div>
        {!isVisible ? (
          <p>読み込み中...</p>
        ) : comments.length > 0 ? (
          comments.map((comment, index) => {
            return (
              <div key={index}>
                <div className="flex items-center gap-2">
                  <Avatar
                    size={32}
                    name={comment.author_name}
                    variant="beam"
                    colors={[
                      "#EB7F7F",
                      "#EB9A7F",
                      "#EBB57F",
                      "#EBD07F",
                      "#EBEB7F",
                    ]}
                  />
                  <div className="flex items-baseline gap-2">
                    <span className="font-size-3.5 font-semibold">
                      {comment.author_name}
                    </span>
                    <span className="font-size-3.5 color-neutral-4 dark:color-neutral-5">
                      {moment(comment.created_at).fromNow()}
                    </span>
                  </div>
                </div>
                <p>{comment.content}</p>
              </div>
            );
          })
        ) : (
          <p>コメントがありません</p>
        )}
      </div>
      <h3>コメントを投稿する</h3>
      <form
        className="flex flex-col gap-8"
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
      >
        <div className="flex flex-col gap-4">
          <label
            htmlFor="name"
            className="font-bold"
          >
            名前
          </label>
          <input
            id="name"
            type="text"
            className="h-10 w-full flex border border-1 border-neutral-4 rounded-md border-solid px-3 py-2 text-sm dark:border-neutral-5 focus:border-neutral-4 focus:outline-none focus:ring-1 focus:ring-neutral-4 focus:dark:border-neutral-5 focus:dark:ring-neutral-5"
            placeholder="名前に応じてアイコンが自動生成されます"
            {...register("author_name")}
            required
          />
          {errors.author_name && (
            <span className="font-size-3">{errors.author_name.message}</span>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <label
            htmlFor="comment"
            className="font-bold"
          >
            コメント
          </label>
          <textarea
            id="comment"
            className="h-30 w-full flex resize-y border border-1 border-neutral-4 rounded-md border-solid px-3 py-2 text-sm dark:border-neutral-5 focus:border-neutral-4 focus:outline-none focus:ring-1 focus:ring-neutral-4 focus:dark:border-neutral-5 focus:dark:ring-neutral-5"
            {...register("content")}
            required
          ></textarea>
          {errors.content && (
            <span className="font-size-3">{errors.content.message}</span>
          )}
        </div>
        <input
          type="submit"
          className={clsx(
            "cursor-pointer border-0 rounded-md bg-neutral-7 p-2 color-neutral-1 font-bold dark:bg-neutral-2 dark:color-neutral-9",
            isSubmit ? "opacity-50" : "",
          )}
          value={isSubmit ? "コメント感謝🙏" : "送信"}
          disabled={isSubmit}
        />
      </form>
    </section>
  );
};

export default Comments;
