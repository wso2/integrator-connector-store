import React from 'react';
import { Paper, Typography, Chip, Button } from '@wso2/oxygen-ui';

interface SelectedFiltersProps {
  selectedAreas: string[];
  selectedTypes: string[];
  selectedVendors: string[];
  selectedIndustries: string[];
  onAreaDelete: (area: string) => void;
  onTypeDelete: (type: string) => void;
  onVendorDelete: (vendor: string) => void;
  onIndustryDelete: (industry: string) => void;
  onClearAll: () => void;
  WSO2_ORANGE?: string;
  effectiveMode?: 'light' | 'dark';
}

const SelectedFilters: React.FC<SelectedFiltersProps> = ({
  selectedAreas,
  selectedTypes,
  selectedVendors,
  selectedIndustries,
  onAreaDelete,
  onTypeDelete,
  onVendorDelete,
  onIndustryDelete,
  onClearAll,
  WSO2_ORANGE = '#FF7300',
  effectiveMode = 'light',
}) => {
  if (
    selectedAreas.length === 0 &&
    selectedTypes.length === 0 &&
    selectedVendors.length === 0 &&
    selectedIndustries.length === 0
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
            bgcolor: effectiveMode === 'dark' ? `${WSO2_ORANGE}20` : 'transparent',
            color: WSO2_ORANGE,
            border: `1px solid ${WSO2_ORANGE}`,
            '& .MuiChip-deleteIcon': {
              color: WSO2_ORANGE,
              '&:hover': {
                color: WSO2_ORANGE,
                opacity: 0.7,
              },
            },
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

      {selectedIndustries.map((industry) => (
        <Chip
          key={`industry-${industry}`}
          label={industry}
          size="small"
          onDelete={() => onIndustryDelete(industry)}
          sx={{
            bgcolor: effectiveMode === 'dark' ? 'transparent' : '#18181B',
            color: effectiveMode === 'dark' ? '#FFFFFF' : '#FFFFFF',
            border: effectiveMode === 'dark' ? '1px solid #FFFFFF' : 'none',
            '& .MuiChip-deleteIcon': {
              color: '#FFFFFF',
              '&:hover': {
                color: effectiveMode === 'dark' ? '#D1D5DB' : '#D1D5DB',
              },
            },
          }}
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
