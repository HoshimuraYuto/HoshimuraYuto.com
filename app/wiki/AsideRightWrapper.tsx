import AsideRight from "./AsideRight";
import AsideToc from "./WikiToc";

const AsideRightWrapper = ({ id }: { id: string[] }) => {
  return (
    <AsideRight>
      <AsideToc id={id} />
    </AsideRight>
  );
};

export default AsideRightWrapper;
