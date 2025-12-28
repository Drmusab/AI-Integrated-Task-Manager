/**
 * @fileoverview Main editor component with tabs and content area
 */

import React from 'react';
import { X } from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  content: string;
}

interface MainEditorProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  activeTab?: Tab;
  children?: React.ReactNode;
}

const MainEditor: React.FC<MainEditorProps> = ({ 
  tabs, 
  activeTabId, 
  onTabClick, 
  onTabClose, 
  activeTab,
  children 
}) => {
  return (
    <div className="obsidian-main">
      {/* Tab bar */}
      <div className="obsidian-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`obsidian-tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => onTabClick(tab.id)}
          >
            <span>{tab.title}</span>
            {tabs.length > 1 && (
              <div
                className="obsidian-tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              >
                <X size={14} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Editor content */}
      <div className="obsidian-editor">
        {children ? (
          children
        ) : activeTab ? (
          <div className="obsidian-editor-content">
            {/* Basic markdown rendering for demo purposes
                For production use, consider using a proper markdown library like:
                - react-markdown (already in dependencies)
                - remark/unified for advanced parsing
                This simple parser handles H1-H3 headings only */}
            {activeTab.content.split('\n').map((line, index) => {
              const key = `${activeTab.id}-line-${index}`;
              if (line.startsWith('# ')) {
                return <h1 key={key}>{line.substring(2)}</h1>;
              } else if (line.startsWith('## ')) {
                return <h2 key={key}>{line.substring(3)}</h2>;
              } else if (line.startsWith('### ')) {
                return <h3 key={key}>{line.substring(4)}</h3>;
              } else if (line.trim() === '') {
                return <br key={key} />;
              } else {
                return <p key={key}>{line}</p>;
              }
            })}
          </div>
        ) : (
          <div className="obsidian-editor-content">
            <p style={{ color: 'var(--obsidian-text-muted)' }}>No file open</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainEditor;
