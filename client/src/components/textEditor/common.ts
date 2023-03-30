export const toggleButtonGroupStyle = {
  maxHeight: 34,
  borderRadius: 0.5,
  '& .MuiToggleButtonGroup-grouped, span .MuiToggleButtonGroup-grouped': {
    margin: 0.5,
    border: 0,
    '&.Mui-disabled': {
      border: 0,
    },
    '&:not(:first-of-type)': {
      borderRadius: 0.5,
    },
    '&:first-of-type': {
      borderRadius: 0.5,
    },
  },
};
