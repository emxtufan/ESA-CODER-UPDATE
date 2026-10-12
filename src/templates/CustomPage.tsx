// Free-form page created from the admin (collection "pages"), styled like the legal pages.
export default function CustomPage({item}: {item: any}) {
  return (
    <>
      <main className="mx-auto max-w-[1425px] px-6 pt-[clamp(80px,9vw,130px)] pb-[clamp(80px,10vw,140px)] md:px-8">
        <article className="max-w-[812px]">
          <h1 className="font-display text-[clamp(36px,4.4vw,56px)] leading-[1] font-medium tracking-[-0.03em]">
            {item.title}
          </h1>
          {item.intro ? (
            <p className="mt-[26px] text-[16px] leading-[1.6] text-fg">
              {item.intro}
            </p>
          ) : null}
          <div
            className="mt-[42px] text-[16px] leading-[1.6] text-fg-muted [&_a]:text-fg [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-[42px] [&_h2]:text-[18px] [&_h2]:leading-[1.6] [&_h2]:font-medium [&_h2]:text-fg [&_h3]:mt-6 [&_h3]:text-[16px] [&_h3]:font-medium [&_h3]:text-fg [&_li]:leading-[1.6] [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-[26px] [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-[26px] [&_ul]:marker:text-fg-subtle"
            dangerouslySetInnerHTML={{__html: item.body ?? ''}}
          />
        </article>
      </main>
    </>
  );
}
