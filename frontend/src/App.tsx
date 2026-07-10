import { useState } from 'react';
import { AddressBottomSheet } from './modules/location/components/AddressBottomSheet';
import type { Address } from './modules/location/types/location.types';

export default function App({ isIntegrated = false }: { isIntegrated?: boolean }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeAddress, setActiveAddress] = useState<Address | null>(null);

  const handleAddressSelected = (address: Address) => {
    setActiveAddress(address);
    setSheetOpen(false);
  };

  // Integrated navbar mode — renders a compact button + bottom sheet
  if (isIntegrated) {
    return (
      <div style={{ display: 'inline-block' }}>
        <button
          onClick={() => setSheetOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: 'rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#000000',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginRight: '8px',
            fontFamily: "'Inter', -apple-system, sans-serif"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = '#000000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
          }}
        >
          <span>📍</span>
          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeAddress
              ? `${activeAddress.area}, ${activeAddress.city}`
              : 'Set Location'
            }
          </span>
        </button>

        <AddressBottomSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onAddressSelected={handleAddressSelected}
        />
      </div>
    );
  }

  // Standalone fallback — just opens bottom sheet
  return (
    <div style={{ padding: '40px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <button
        onClick={() => setSheetOpen(true)}
        style={{
          padding: '14px 28px',
          backgroundColor: '#6366f1',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        📍 Set Location
      </button>

      <AddressBottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAddressSelected={handleAddressSelected}
      />
    </div>
  );
}
