// module 9755 (country list) — the names live in source_data.json
import {textList} from '@/lib/text';

const countries: string[] = textList('components/contact/ContactForm', 'countries');

export default countries;
