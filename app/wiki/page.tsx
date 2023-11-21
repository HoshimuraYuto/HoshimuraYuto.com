import AsideRight from "./AsideRight";
import Main from "./Main";

const Page = () => {
  return (
    <>
      <main className="w-[620px] flex flex-col gap-12 lt-md:w-auto">
        <Main id={["index"]} />
      </main>
      <aside
        w="[250px]"
        // border="0 l-1 neutral-1 solid"
        className="lt-md:w-auto lt-md:border-b-1 lt-md:border-r-0 dark:border-neutral-7"
      >
        <AsideRight id={["index"]} />
      </aside>
    </>
  );
};

export default Page;
