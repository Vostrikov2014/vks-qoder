// Field styling shared by every create/edit dialog. Mirrors the Recordings
// (Entries) page: a frameless filled surface, a soft hover tint (pale blue in
// the light theme, neutral grey in the dark one) shown only while the field is
// still empty, and hint text that brightens together with the tint.
//
// The dialog paper is the darker surface; the fields sit on it lighter, the
// same way they sit on the Recordings page: the default fill is exactly the
// Recordings field surface (white in the light theme, --bg-elevated in the
// dark one).
export const createDialogFieldSx = (isDarkMode: boolean, fieldSurface = isDarkMode ? 'var(--bg-elevated)' : '#ffffff') => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 'var(--radius-lg)',
    // A filled field keeps the exact background it had while it was still empty
    background: fieldSurface,
    transition: 'background-color 0.2s ease',
    // Compact fields: single-line controls share the 40px height of the
    // toolbar search on the conferences dashboard; multiline fields stretch
    '&:not(.MuiOutlinedInput-multiline)': {
      height: 40,
    },
    '& fieldset': {
      border: 'none',
    },
    // The label always floats above the field, so the notch gap in the
    // (invisible) outline is never needed
    '& .MuiOutlinedInput-notchedOutline > legend': {
      display: 'none',
    },
    '&:hover fieldset': {
      border: 'none',
    },
    // Hover tint only while the field is still empty (hint visible): a
    // neutral grey in the dark theme, a pale primary tone in the light theme
    // so the highlight follows the blue theme colour
    '&:hover:not(.Mui-disabled):has(.MuiOutlinedInput-input:placeholder-shown)': {
      background: isDarkMode ? '#2e2e33' : 'var(--primary-100)',
    },
    // No blue highlight on focus
    '&.Mui-focused fieldset': {
      border: 'none',
    },
    // Disabled fields show a flat muted surface instead of the interactive one
    '&.Mui-disabled': {
      background: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
    },
    // The global autofill rule in index.css repaints autofilled inputs with
    // --bg-elevated; pin the fill to the field surface so autofilled values
    // never change the background
    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
      WebkitBoxShadow: `0 0 0 1000px ${fieldSurface} inset !important`,
    },
  },
  // Hover tint for fields with a label: the label floats once a value is
  // picked, so "not shrunk yet" means the field is still empty
  '&:has(.MuiInputLabel-root:not(.MuiInputLabel-shrink)) .MuiOutlinedInput-root:hover:not(.Mui-disabled)': {
    background: isDarkMode ? '#2e2e33' : 'var(--primary-100)',
  },
  '& .MuiOutlinedInput-input': {
    color: 'var(--text-h)',
    // Compact text so the value centers nicely inside the fixed 40px root
    fontSize: '0.8125rem',
    py: 0.5,
    minHeight: 0,
  },
  // Multiline fields (description) keep their original roomier look: default
  // font size and padding, the height is driven by the rows
  '& .MuiOutlinedInput-inputMultiline': {
    fontSize: '1rem',
    py: '12px',
  },
  // Hint is rendered inside the field and disappears once it is filled
  '& .MuiOutlinedInput-input::placeholder': {
    color: 'var(--text-muted)',
    opacity: 1,
  },
  // Grey colour change on hover
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-input::placeholder': {
    color: isDarkMode ? '#ffffff' : '#3f3f46',
  },
  '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-input': {
    color: 'var(--text-muted)',
    WebkitTextFillColor: 'var(--text-muted)',
  },
  // Disabled fields keep the placeholder hint readable: browsers wash out
  // placeholder text with the input's -webkit-text-fill-color otherwise
  '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-input::placeholder': {
    color: 'var(--text-muted)',
    opacity: 1,
    WebkitTextFillColor: 'var(--text-muted)',
  },
  // Label acts as the hint: it always sits above the field, both while the
  // field is empty and once a value is picked, so the compact 40px height is
  // never eaten by a floating label inside the control
  '& .MuiInputLabel-root': {
    color: 'var(--text-muted)',
    top: 'auto',
    bottom: '100%',
    left: 0,
    transform: 'none !important',
    fontSize: '0.75rem',
    mb: '2px',
    pointerEvents: 'none',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'var(--primary-600)',
  },
  // Hint brightens together with the hover tint
  '&:hover .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
    color: isDarkMode ? '#ffffff' : '#3f3f46',
  },
  '& .MuiSelect-select': {
    color: 'var(--text-h)',
    // Drop the theme's min-height so the select fits the fixed 40px root
    minHeight: 0,
  },
  '& .MuiSelect-icon': {
    color: 'var(--text-muted)',
  },
});

// Dialog action buttons (Создать/Отмена/Закрыть and friends): the same 40px
// height as the toolbar controls on the conferences dashboard
export const dialogButtonSx = {
  height: 40,
  py: 0,
  borderRadius: 'var(--radius-lg)',
} as const;

// Dropdown menu of the dialog selects: the app menu colours instead of the
// default white Paper, which would stay white in the dark theme as well
export const dialogMenuProps = {
  PaperProps: {
    sx: {
      background: 'var(--bg-elevated)',
      border: '1px solid var(--glass-border)',
      '& .MuiMenuItem-root': {
        color: 'var(--text-h)',
        '&:hover': { background: 'rgba(var(--primary-rgb), 0.08)' },
        '&.Mui-selected': { background: 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary-600)' },
      },
    },
  },
};
