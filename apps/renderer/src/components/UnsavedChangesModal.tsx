import { type FC } from 'react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  fileName: string;
  onSave: () => void;
  onDontSave: () => void;
  onCancel: () => void;
}

export const UnsavedChangesModal: FC<UnsavedChangesModalProps> = ({
  isOpen,
  fileName,
  onSave,
  onDontSave,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="forge-modal-backdrop" onClick={onCancel}>
      <div
        className="forge-palette"
        style={{ width: '420px', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '14px', fontWeight: 600 }}>Save Changes?</div>
        <div style={{ fontSize: '12px', color: 'var(--forge-text-secondary)', lineHeight: 1.5 }}>
          Do you want to save the changes you made to <strong style={{ color: 'var(--forge-text-primary)' }}>{fileName}</strong>?
          <br />
          Your changes will be lost if you don't save them.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <button
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--forge-radius-sm)',
              border: '1px solid var(--forge-border)',
              background: 'transparent',
              color: 'var(--forge-text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--forge-radius-sm)',
              border: '1px solid var(--forge-error)',
              background: 'transparent',
              color: 'var(--forge-error)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            onClick={onDontSave}
          >
            Don't Save
          </button>
          <button
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--forge-radius-sm)',
              border: 'none',
              background: 'var(--forge-accent)',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '12px',
            }}
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
