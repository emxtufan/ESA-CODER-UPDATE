import {useState} from 'react';
import {AiAnalytics, Conversations, KnowledgeBase, Sync} from './AiData';
import {Models, Overview, Providers, Settings} from './AiConfig';

// ---------------------------------------------------------------------------
// AI Assistant: one pane per tab, in the same right-hand pane as the rest of
// the admin. Data panes live in AiData, the configuration ones in AiConfig.
// ---------------------------------------------------------------------------
type Tab = 'overview' | 'providers' | 'models' | 'kb' | 'sync' | 'conversations' | 'analytics' | 'settings';
const TABS: {key: Tab; label: string}[] = [
  {key: 'overview', label: 'Overview'},
  {key: 'providers', label: 'Providers'},
  {key: 'models', label: 'Models'},
  {key: 'kb', label: 'Knowledge Base'},
  {key: 'sync', label: 'Synchronization'},
  {key: 'conversations', label: 'Conversations'},
  {key: 'analytics', label: 'Analytics'},
  {key: 'settings', label: 'Settings'},
];

export default function Ai() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <main className="a-main">
      <header className="a-bar">
        <div className="a-bar-title">
          <h1>AI Assistant</h1>
        </div>
        <div className="a-bar-actions">
          <div className="a-seg" role="group" aria-label="Secțiuni AI Assistant">
            {TABS.map((t) => (
              <button key={t.key} className={t.key === tab ? 'is-active' : ''} aria-pressed={t.key === tab} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="a-content">
        {tab === 'overview' ? (
          <Overview />
        ) : tab === 'providers' ? (
          <Providers />
        ) : tab === 'models' ? (
          <Models />
        ) : tab === 'kb' ? (
          <KnowledgeBase />
        ) : tab === 'sync' ? (
          <Sync />
        ) : tab === 'conversations' ? (
          <Conversations />
        ) : tab === 'analytics' ? (
          <AiAnalytics />
        ) : (
          <Settings />
        )}
      </div>
    </main>
  );
}
