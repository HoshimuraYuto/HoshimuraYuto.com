import { decode } from "he";

import { getDescriptionFromHTML, getTitleFromHTML } from "../utils/regex";

const getSiteInformation = async (url: string) => {
  const response = await fetch(url);
  const html = await response.text();
  const title = decode(getTitleFromHTML(html) ?? "");
  const description = decode(getDescriptionFromHTML(html) ?? "");

  return { title, description };
};

export default getSiteInformation;
