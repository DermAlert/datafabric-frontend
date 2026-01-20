export default function Sidebar({ 
  expandedSources, 
  toggleSource, 
  openAddDatasetModal, 
  openDatasetExplorer, 
  openAirflowView, 
  openDataDefineModal 
}) {
  return (
    <div style={{ 
      width: '16rem', 
      backgroundColor: 'white', 
      borderRight: '1px solid #e5e7eb',
      padding: '1rem'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
        Data Sources
      </h3>
      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        Sidebar placeholder for Delta Sharing
      </div>
    </div>
  );
}

