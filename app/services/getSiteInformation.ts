import { getDescriptionFromHTML, getTitleFromHTML } from "../utils/regex";

const getSiteInformation = async (url: string) => {
  const response = await fetch(url);
  const html = (await response.text()) as string;
  const title = getTitleFromHTML(html);
  const description = getDescriptionFromHTML(html);

  return { title, description };
};

export default getSiteInformation;
