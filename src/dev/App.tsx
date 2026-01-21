import React, { useState } from 'react';
import { BasicExample } from '../examples/Examples';
import { AdvancedExample } from '../examples/Examples';
import { MultiWindowExample } from '../examples/Examples';
import { ContextExample } from '../examples/Examples';
import { FullscreenExample } from '../examples/Examples';

type ExampleTab = 'basic' | 'advanced' | 'multi' | 'context' | 'fullscreen';

export function ExamplesApp() {
  const [activeTab, setActiveTab] = useState<ExampleTab>('basic');

  const tabs: { id: ExampleTab; label: string; component: React.ReactNode }[] = [
    { id: 'basic', label: 'Basic Example', component: <BasicExample /> },
    { id: 'advanced', label: 'Advanced Example', component: <AdvancedExample /> },
    { id: 'multi', label: 'Multi-Window Example', component: <MultiWindowExample /> },
      { id: 'context', label: 'Undock/Context Example', component: <ContextExample /> },
      { id: 'fullscreen', label: 'Fullscreen Example', component: <FullscreenExample /> },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          padding: '40px 20px',
          marginBottom: '30px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}
      >
        <h1 style={{ fontSize: '2.5em', marginBottom: '10px' }}>useExternalWindow</h1>
        <p style={{ fontSize: '1.1em', opacity: 0.9 }}>
          React hook for managing external windows in multiscreen UX applications
        </p>
      </header>

      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '16px 20px',
                border: 'none',
                background: activeTab === tab.id ? '#667eea' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#333',
                fontSize: '1em',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  (e.target as HTMLButtonElement).style.background =
                    'rgba(102, 126, 234, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  (e.target as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '30px' }}>
          {tabs.find((tab) => tab.id === activeTab)?.component}
        </div>
      </div>

      <footer
        style={{
          marginTop: '40px',
          padding: '20px',
          textAlign: 'center',
          color: 'white',
          opacity: 0.8,
        }}
      >
        <p>
          Check the console for any warnings or errors. Click the buttons to open external
          windows!
        </p>
      </footer>
    </div>
  );
}
