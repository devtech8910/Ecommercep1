import React, { useState } from 'react';
import type { Address } from '../types/location.types';

interface AddressCardProps {
  address: Address;
  onSelect?: (address: Address) => void;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
  onMakeDefault: (id: string) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onSelect,
  onEdit,
  onDelete,
  onMakeDefault,
}) => {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);

  const formatAddress = (): string => {
    const parts = [
      address.houseNumber,
      address.building,
      address.street,
      address.area,
      address.city,
      address.state,
    ].filter(Boolean);

    let result = parts.join(', ');
    if (address.pincode) {
      result += ` - ${address.pincode}`;
    }
    return result;
  };

  const isDefault = address.isDefault;

  const cardStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderRadius: '14px',
    border: '1.5px solid',
    borderColor: hovered || isDefault ? '#c7d2fe' : '#e5e7eb',
    backgroundColor: isDefault ? '#faf5ff' : '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: hovered ? '0 2px 8px rgba(99,102,241,0.08)' : 'none',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#f3f4f6',
    color: '#374151',
  };

  const defaultBadgeStyle: React.CSSProperties = {
    ...badgeStyle,
    backgroundColor: '#6366f1',
    color: '#ffffff',
    marginLeft: '8px',
  };

  const actionBtnStyle: React.CSSProperties = {
    fontSize: '12px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.15s',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger select if clicking action buttons area
    const target = e.target as HTMLElement;
    if (target.closest('[data-actions]')) return;
    if (onSelect) onSelect(address);
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
    >
      {/* Top row: type badge + default badge */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={badgeStyle}>
          {address.addressType === 'home' ? '🏠 Home' : '💼 Work'}
        </span>
        {isDefault && (
          <span style={defaultBadgeStyle}>Default</span>
        )}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#111827',
          marginTop: '10px',
        }}
      >
        {address.fullName}
      </div>

      {/* Address text */}
      <div
        style={{
          fontSize: '13px',
          color: '#6b7280',
          lineHeight: 1.5,
          marginTop: '4px',
        }}
      >
        {formatAddress()}
      </div>

      {/* Phone */}
      {address.mobile && (
        <div
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            marginTop: '6px',
          }}
        >
          📞 {address.mobile}
        </div>
      )}

      {/* Action buttons row */}
      <div
        data-actions="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '12px',
        }}
      >
        <button
          style={actionBtnStyle}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(address);
          }}
        >
          ✏️ Edit
        </button>

        {!confirmDelete ? (
          <button
            style={{
              ...actionBtnStyle,
              color: deleteHovered ? '#ef4444' : '#6b7280',
              borderColor: deleteHovered ? '#fecaca' : '#e5e7eb',
            }}
            onMouseEnter={() => setDeleteHovered(true)}
            onMouseLeave={() => setDeleteHovered(false)}
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(true);
            }}
          >
            🗑️ Delete
          </button>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#6b7280',
            }}
          >
            <span>Delete this address?</span>
            <button
              style={{
                ...actionBtnStyle,
                color: '#ffffff',
                backgroundColor: '#ef4444',
                borderColor: '#ef4444',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(address.id);
              }}
            >
              Yes
            </button>
            <button
              style={actionBtnStyle}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(false);
              }}
            >
              No
            </button>
          </div>
        )}

        {/* Set as default — only if not already default */}
        {!isDefault && (
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#6366f1',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: 'auto',
              padding: '4px 0',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onMakeDefault(address.id);
            }}
          >
            Set as default
          </button>
        )}
      </div>
    </div>
  );
};
