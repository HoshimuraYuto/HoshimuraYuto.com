import WikiPage from "@/app/components/fragments/WikiPage";

const Main = ({
  id,
  relatedWikis,
}: {
  id: string[];
  relatedWikis: { title: string; path: string }[] | null;
}) => {
  return (
    <WikiPage
      id={id}
      relatedWikis={relatedWikis}
    />
  );
};

export default Main;
