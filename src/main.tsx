import {createRoot, hydrateRoot} from 'react-dom/client';
import App from '@/App';
import './styles/fonts.css';
import './styles/site.css';
// stilurile paginilor în același main.css: un singur fișier CSS blocant în loc de 7 (render-blocking pe HTTP/1.1)
import './styles/hero-studio.css';
import './styles/automation.css';
import './styles/automation-more.css';
import './styles/pricing.css';
import './styles/software.css';
import './styles/services-extra.css';
import './styles/article.css';
import './styles/chat.css';

const root = document.getElementById('root')!;
// The server sends the page already rendered (server/ssr.mjs): take it over in place, so the
// content stays put while the page's code loads. Without it (e.g. `vite` alone), render fresh.
if (root.firstChild) hydrateRoot(root, <App />);
else createRoot(root).render(<App />);
