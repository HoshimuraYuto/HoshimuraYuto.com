import { cn } from "../../utils/chadcn-ui";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  circle?: boolean;
  wrapperClassName?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  count = 1,
  circle = false,
  wrapperClassName = "",
  ...props
}) => {
  const skeltonEl = Array.from({ length: count }, (_, i) => i).map((index) => (
    <div
      className={cn(
        "animate-pulse bg-neutral-9/10 dark:bg-white/10",
        circle ? "rd-50%" : "",
        className,
      )}
      key={index}
      {...props}
    />
  ));

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{skeltonEl}</div>;
  }
  return skeltonEl;
};

export default Skeleton;
