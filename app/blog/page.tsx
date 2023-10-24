const Page = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex justify-center gap-10 p-10 lt-sm:p-6">{children}</div>
  );
};

export default Page;
