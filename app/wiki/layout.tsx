import AsideLeft from "./AsideLeft";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="p-10 lt-sm:p-6">
      <div className="mx-auto max-w-[1200px] flex justify-center gap-10 lt-md:flex-col-reverse">
        <aside
          w="[250px]"
          // border="0 r-1 neutral-1 solid"
          className="lt-md:w-auto lt-md:border-b-1 lt-md:border-r-0 dark:border-neutral-7"
        >
          <AsideLeft />
        </aside>
        {children}
      </div>
    </div>
  );
};

export default Layout;
