import Aside from "./Aside";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex justify-center gap-10 p-10 lt-sm:p-6">
      <aside className="w-[190px] border-0 border-r-1 border-neutral-1 border-solid dark:border-neutral-7">
        <Aside />
      </aside>
      <main className="max-w-[600px] flex flex-col gap-12">{children}</main>
    </div>
  );
};

export default Layout;
