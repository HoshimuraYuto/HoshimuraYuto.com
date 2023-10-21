const MainAndSidebar = ({
  aside,
  main,
}: {
  aside: React.ReactNode;
  main: React.ReactNode;
}) => {
  return (
    <div className="flex justify-center gap-10 p-10 lt-sm:p-6">
      <aside className="w-[190px] border-0 border-r-1 border-neutral-1 border-solid dark:border-neutral-7">
        {aside}
      </aside>
      <main className="max-w-[600px] flex flex-col gap-12">{main}</main>
    </div>
  );
};

export default MainAndSidebar;
