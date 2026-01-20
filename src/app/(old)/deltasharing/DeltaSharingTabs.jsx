import { Share, Database, Table, Users, Plus } from 'lucide-react';
import dsStyles from './DeltaSharingUI.module.css';
import ShareRecipientModal from './ShareRecipientModal';
import { useState } from 'react';

export default function DeltaSharingTabs({ 
  activeTab, 
  setActiveTab, 
  openAddShareModal,
  openAddSchemaModal,
  openAddTableModal,
  openAddRecipientModal
}) {
  const tabs = [
    { id: "shares", label: "Shares", icon: Share, action: openAddShareModal },
    { id: "schemas", label: "Schemas", icon: Database, action: openAddSchemaModal },
    { id: "tables", label: "Tables", icon: Table, action: openAddTableModal },
    { id: "recipients", label: "Recipients", icon: Users, action: openAddRecipientModal }
  ];
  const [showShareRecipientModal, setShowShareRecipientModal] = useState(false);

  const openShareRecipientModal = () => setShowShareRecipientModal(true);
  const closeShareRecipientModal = () => setShowShareRecipientModal(false);

  return (
    <div className={dsStyles.tabsContainer}>
      <div className={dsStyles.tabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`${dsStyles.tab} ${activeTab === tab.id ? dsStyles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className={dsStyles.tabIcon} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {showShareRecipientModal && (
        <ShareRecipientModal 
          isOpen={showShareRecipientModal} 
          onClose={closeShareRecipientModal}
          initialRecipientId={null}
          initialShareId={null}
        />
      )}
      <div style={{ display: 'flex', gap: '8px'}}>
      <button
        className={dsStyles.addConnectionButton}
        onClick={openShareRecipientModal}
      >
        <Plus className={dsStyles.addConnectionIcon} />
        Share/Recipient
      </button>
      <button 
        className={dsStyles.addConnectionButton}
        onClick={() => {
          const currentTab = tabs.find(t => t.id === activeTab);
          if (currentTab) currentTab.action();
        }}
      >
        <Plus className={dsStyles.addConnectionIcon} />
        Add {tabs.find(t => t.id === activeTab)?.label.slice(0, -1) || 'Item'}
      </button>
      </div>
    </div>
  );
}