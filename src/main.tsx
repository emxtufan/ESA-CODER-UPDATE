import {createRoot, hydrateRoot} from 'react-dom/client';
import App from '@/App';
import './styles/fonts.css';
import './styles/site.css';

const root = document.getElementById('root')!;
// The server sends the page already rendered (server/ssr.mjs): take it over in place, so the
// content stays put while the page's code loads. Without it (e.g. `vite` alone), render fresh.
if (root.firstChild) hydrateRoot(root, <App />);
else createRoot(root).render(<App />);
