import WikiMenu from "./WikiMenu";

const AsideLeft = () => {
  return (
    <nav className="sticky top-[100px] flex flex-col select-none gap-4 lt-md:hidden">
      <WikiMenu />
    </nav>
  );
};

export default AsideLeft;
