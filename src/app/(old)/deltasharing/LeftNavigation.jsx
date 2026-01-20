import { Database, Share, Users, Settings } from 'lucide-react';

export default function LeftNavigation() {
  return (
    <div style={{ 
      width: '4rem', 
      backgroundColor: '#4338ca', 
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '1.5rem',
      paddingBottom: '1.5rem'
    }}>
      <div style={{ 
        height: '2rem', 
        width: '2rem', 
        borderRadius: '0.5rem', 
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <Database style={{ height: '1.25rem', width: '1.25rem', color: '#4338ca' }} />
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '1.5rem',
        flexGrow: 1
      }}>
        <button style={{ 
          padding: '0.5rem', 
          borderRadius: '0.5rem',
          backgroundColor: '#4f46e5',
          border: 'none',
          color: 'white',
          cursor: 'pointer'
        }}>
          <Share style={{ height: '1.25rem', width: '1.25rem' }} />
        </button>
        <button style={{ 
          padding: '0.5rem', 
          borderRadius: '0.5rem',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer'
        }}>
          <Users style={{ height: '1.25rem', width: '1.25rem' }} />
        </button>
      </div>
      
      <button style={{ 
        padding: '0.5rem', 
        borderRadius: '0.5rem',
        backgroundColor: 'transparent',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        marginTop: 'auto'
      }}>
        <Settings style={{ height: '1.25rem', width: '1.25rem' }} />
      </button>
    </div>
  );
}

