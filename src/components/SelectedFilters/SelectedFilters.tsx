import React from 'react';
import { Paper, Typography, Chip, Button } from '@wso2/oxygen-ui';

interface SelectedFiltersProps {
  selectedAreas: string[];
  selectedTypes: string[];
  selectedVendors: string[];
  onAreaDelete: (area: string) => void;
  onTypeDelete: (type: string) => void;
  onVendorDelete: (vendor: string) => void;
  onClearAll: () => void;
  WSO2_ORANGE?: string;
}

const SelectedFilters: React.FC<SelectedFiltersProps> = ({
  selectedAreas,
  selectedTypes,
  selectedVendors,
  onAreaDelete,
  onTypeDelete,
  onVendorDelete,
  onClearAll,
  WSO2_ORANGE = '#FF7300',
}) => {
  if (
    selectedAreas.length === 0 &&
    selectedTypes.length === 0 &&
    selectedVendors.length === 0
  ) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: 1.5,
        mb: 2.5,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        bgcolor: 'action.hover',
      }}
    >
      <Typography variant="body2" fontWeight={500} sx={{ mr: 1 }}>
        Active filters:
      </Typography>

      {selectedAreas.map((area) => (
        <Chip
          key={`area-${area}`}
          label={area}
          size="small"
          onDelete={() => onAreaDelete(area)}
          sx={{
            bgcolor: `${WSO2_ORANGE}20`,
            color: WSO2_ORANGE,
          }}
        />
      ))}

      {selectedTypes.map((type) => (
        <Chip
          key={`type-${type}`}
          label={type}
          size="small"
          onDelete={() => onTypeDelete(type)}
          color="default"
        />
      ))}

      {selectedVendors.map((vendor) => (
        <Chip
          key={`vendor-${vendor}`}
          label={vendor}
          size="small"
          onDelete={() => onVendorDelete(vendor)}
          color="primary"
        />
      ))}

      <Button
        size="small"
        onClick={onClearAll}
        sx={{ ml: 'auto', textDecoration: 'underline', color: 'text.secondary' }}
      >
        Clear all
      </Button>
    </Paper>
  );
};

export default SelectedFilters;
