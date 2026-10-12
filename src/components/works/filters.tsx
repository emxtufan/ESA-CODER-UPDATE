// module 6792
// Exports (compiled name -> readable name):
//   Ay -> CategoryFilter, y2 -> ALL_CATEGORY, SM -> getCategories, mQ -> getCategoryCounts
import RollText from '@/components/RollText';
import CategorySelect from '@/components/blog/CategorySelect';

export const ALL_CATEGORY = 'All';

export function getCategories(items: any[]) {
  const list: string[] = [];
  for (const item of items) {
    if (item.category && !list.includes(item.category)) list.push(item.category);
  }
  return [ALL_CATEGORY, ...list];
}

export function getCategoryCounts(items: any[]) {
  const counts: Record<string, number> = {[ALL_CATEGORY]: items.length};
  for (const item of items) {
    if (item.category) counts[item.category] = (counts[item.category] ?? 0) + 1;
  }
  return counts;
}

export function CategoryFilter({categories, counts, active, onSelect, label}: any) {
  return (
    <div className="relative z-10 mx-auto max-w-[1425px] px-6 pb-[clamp(32px,4vw,56px)] md:px-8">
      <CategorySelect
        className="mx-auto w-full max-w-[380px] md:hidden"
        label={label}
        active={active}
        onSelect={onSelect}
        options={categories.map((c: string) => ({key: c, label: c, count: counts?.[c]}))}
      />
      <div
        role="tablist"
        aria-label={label}
        className="-m-1 hidden text-center [text-wrap:balance] md:block"
      >
        {categories.map((c: string) => (
          <button
            key={c}
            role="tab"
            aria-selected={active === c}
            onClick={() => onSelect(c)}
            className={`m-1 inline-block h-[34px] rounded-full border px-4 align-middle text-[15px] leading-none font-medium transition-colors ${active === c ? 'border-transparent bg-fg text-bg' : 'border-line bg-bg text-fg-muted hover:border-line-strong hover:text-fg'}`}
          >
            <RollText text={c} />
          </button>
        ))}
      </div>
    </div>
  );
}
