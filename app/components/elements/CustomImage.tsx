/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FC, ImgHTMLAttributes } from "react";

import { isInternalLink } from "@/app/utils/regex";

const CustomImage: FC<ImgHTMLAttributes<HTMLImageElement>> = async ({
  src = "",
  ...props
}) => {
  if (!src) return <span>src が指定されていません。</span>;
  if (isInternalLink(src)) {
    const imageModule = await import(`@/content/${src}`);
    const image = imageModule.default;

    return (
      <img
        src={image}
        {...props}
        loading="lazy"
      />
    );
  }
  return (
    <img
      src={src}
      {...props}
      loading="lazy"
    />
  );
};

export default CustomImage;
