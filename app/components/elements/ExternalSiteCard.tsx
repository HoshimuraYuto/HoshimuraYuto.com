import getSiteInformation from "@/app/services/getSiteInformation";
import { getBaseDomainFromURL } from "@/app/utils/regex";

const ExternalSiteCardWrapper = ({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) => {
  return (
    <a
      href={url}
      className="my-4 flex flex-col gap-3 border-1 border-neutral-1 border-solid p-4 decoration-none transition duration-100 dark:border-neutral-7 hover:bg-neutral-1 dark:hover:bg-neutral-7"
    >
      {children}
    </a>
  );
};

export const ExternalSiteCardPlaceholder = ({ url }: { url: string }) => {
  const domain = getBaseDomainFromURL(url);

  return (
    <ExternalSiteCardWrapper url={url}>
      <span className="color-neutral-9 dark:color-neutral-1">{domain}</span>
      <div className="flex items-center gap-2">
        <span className="font-size-3 color-neutral-9 dark:color-neutral-1">
          {url}
        </span>
      </div>
    </ExternalSiteCardWrapper>
  );
};

export const ExternalSiteCard = async ({ url }: { url: string }) => {
  const { title, description } = await getSiteInformation(url);

  return (
    <ExternalSiteCardWrapper url={url}>
      <span className="color-neutral-9 dark:color-neutral-1">{title}</span>
      <span className="font-size-2 color-neutral-4 dark:color-neutral-5">
        {description}
      </span>
      <div className="flex items-center gap-2">
        <img
          src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=32`}
          alt=""
          className="rd-50% wh-5"
          loading="lazy"
        />
        <span className="font-size-3 color-neutral-9 dark:color-neutral-1">
          {url}
        </span>
      </div>
    </ExternalSiteCardWrapper>
  );
};
