import Link from "next/link";

import { isInternalLink } from "@/app/utils/regex";

const CustomLink = ({
  children,
  href,
  ...props
}: {
  children: string;
  href: string;
}): JSX.Element =>
  isInternalLink(href) || href === "" ? (
    <Link href={href}>{children}</Link>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );

export default CustomLink;
