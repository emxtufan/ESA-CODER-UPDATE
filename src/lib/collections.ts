// Content collections (projects, blog posts, testimonials, …) stored in
// source_data.json under "_collections" and editable from the admin.
import {sourceData} from './text';

/** Published records only: `published: false` hides a record from the whole site (the admin reads the raw data). */
export function collection<T = any>(name: string): T[] {
  const list = sourceData._collections?.[name];
  return Array.isArray(list) ? list.filter((item) => item?.published !== false) : [];
}

export function findInCollection<T = any>(name: string, field: string, value: string): T | undefined {
  return collection<any>(name).find((item) => item?.[field] === value);
}
