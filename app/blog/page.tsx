import MainAndSidebar from "../components/layouts/MainAndSidebar";

import Aside from "./Aside";
import Main from "./Main";

const BlogPost = () => {
  return (
    <MainAndSidebar
      aside={<Aside />}
      main={<Main />}
    />
  );
};

export default BlogPost;
