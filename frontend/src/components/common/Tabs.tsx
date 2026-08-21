import React from 'react';
import './Tabs.css';

export interface TabItem {
  label: string;
  value: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`custom-tabs-container ${className}`}>
      <div className="custom-tabs-header" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              className={`custom-tab-button ${isActive ? 'active' : ''}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.value)}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="custom-tab-badge">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
