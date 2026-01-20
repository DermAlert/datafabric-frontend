import { useState } from 'react';
import { Share, Database, Table, Users } from 'lucide-react';
import styles from './delta-sharing.module.css';
import dsStyles from './DeltaSharingUI.module.css';

import DeltaSharingTabs from './DeltaSharingTabs';
import SharesView from './SharesView';
import SchemasView from './SchemasView';
import TablesView from './TablesView';
import RecipientsView from './RecipientsView';
import ShareModal from './ShareModal';
import SchemaModal from './SchemaModal';
import TableModal from './TableModal';
import RecipientModal from './RecipientModal';
import DeltaSharingHeader from './DeltaSharingHeader';
export default function DeltaSharingContent({ returnToDashboard, currentUser }) {
  const [activeTab, setActiveTab] = useState("shares");
  const [showAddShareModal, setShowAddShareModal] = useState(false);
  const [showAddSchemaModal, setShowAddSchemaModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingShare, setEditingShare] = useState(null);
  const [editingSchema, setEditingSchema] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [selectedShareId, setSelectedShareId] = useState(null);
  const [selectedSchemaId, setSelectedSchemaId] = useState(null);

  // Share modal handlers
  const openAddShareModal = () => {
    setShowAddShareModal(true);
    setEditingShare(null);
  };
  const openEditShareModal = (share) => {
    setEditingShare(share);
    setShowAddShareModal(true);
  };
  const closeShareModal = () => {
    setShowAddShareModal(false);
    setEditingShare(null);
  };

  // Schema modal handlers
  const openAddSchemaModal = () => {
    setShowAddSchemaModal(true);
    setEditingSchema(null);
  };
  const openEditSchemaModal = (schema) => {
    setEditingSchema(schema);
    setShowAddSchemaModal(true);
  };
  const closeSchemaModal = () => {
    setShowAddSchemaModal(false);
    setEditingSchema(null);
  };

  // Table modal handlers
  const openAddTableModal = () => {
    setShowAddTableModal(true);
    setEditingTable(null);
  };
  const openEditTableModal = (table) => {
    setEditingTable(table);
    setShowAddTableModal(true);
  };
  const closeTableModal = () => {
    setShowAddTableModal(false);
    setEditingTable(null);
  };

  // Recipient modal handlers
  const openAddRecipientModal = () => {
    setShowAddRecipientModal(true);
    setEditingRecipient(null);
  };
  const openEditRecipientModal = (recipient) => {
    setEditingRecipient(recipient);
    setShowAddRecipientModal(true);
  };
  const closeRecipientModal = () => {
    setShowAddRecipientModal(false);
    setEditingRecipient(null);
  };

  const handleSelectItem = (itemId) => {
    if (selectedItem === itemId) {
      setSelectedItem(null);
    } else {
      setSelectedItem(itemId);
    }
  };

  return (
    <div className={styles.mainContent}>
      {/* Header */}
      <DeltaSharingHeader currentUser={currentUser} />

      {/* Tabs */}
      <DeltaSharingTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        openAddShareModal={openAddShareModal}
        openAddSchemaModal={openAddSchemaModal}
        openAddTableModal={openAddTableModal}
        openAddRecipientModal={openAddRecipientModal}
      />

      {/* Content */}
      <div className={styles.content}>
        {activeTab === "shares" && (
          <SharesView 
            selectedItem={selectedItem}
            handleSelectItem={handleSelectItem}
            openEditShareModal={openEditShareModal}
            setSelectedShareId={setSelectedShareId}
          />
        )}
        {activeTab === "schemas" && (
          <SchemasView 
            selectedItem={selectedItem}
            handleSelectItem={handleSelectItem}
            openEditSchemaModal={openEditSchemaModal}
            selectedShareId={selectedShareId}
            setSelectedSchemaId={setSelectedSchemaId}
          />
        )}
        {activeTab === "tables" && (
          <TablesView 
            selectedItem={selectedItem}
            handleSelectItem={handleSelectItem}
            openEditTableModal={openEditTableModal}
            selectedShareId={selectedShareId}
            selectedSchemaId={selectedSchemaId}
          />
        )}
        {activeTab === "recipients" && (
          <RecipientsView 
            selectedItem={selectedItem}
            handleSelectItem={handleSelectItem}
            openEditRecipientModal={openEditRecipientModal}
          />
        )}
      </div>

      {showAddShareModal && (
        <ShareModal 
          editingShare={editingShare}
          onClose={closeShareModal}
        />
      )}
      {showAddSchemaModal && (
        <SchemaModal
          editingSchema={editingSchema}
          selectedShareId={selectedShareId}
          onClose={closeSchemaModal}
        />
      )}
      {showAddTableModal && (
        <TableModal
          editingTable={editingTable}
          selectedShareId={selectedShareId}
          selectedSchemaId={selectedSchemaId}
          onClose={closeTableModal}
        />
      )}
      {showAddRecipientModal && (
        <RecipientModal
          editingRecipient={editingRecipient}
          onClose={closeRecipientModal}
        />
      )}
    </div>
  );
}

