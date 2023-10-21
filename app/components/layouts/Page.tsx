const Page = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <main className="p-10 lt-sm:p-6">
      <div className="m-auto max-w-[600px] flex flex-col gap-16 lt-sm:gap-8">
        <h1 className="font-size-8 font-700">{title}</h1>
        {children}
      </div>
    </main>
  );
};

export default Page;
