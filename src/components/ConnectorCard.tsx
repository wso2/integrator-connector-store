import { memo, useMemo } from 'react';
import { Card, CardContent, CardActionArea, Typography, Chip, Box, Avatar } from '@mui/material';
import { Download as DownloadIcon, AccessTime as ClockIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { BallerinaPackage } from '@/types/connector';
import {
  parseConnectorMetadata,
  formatPullCount,
  formatDate,
  formatDaysSince,
  getDisplayName,
} from '@/lib/connector-utils';

interface ConnectorCardProps {
  connector: BallerinaPackage;
}

// Extract first sentence from summary (moved outside to avoid recreation)
const getFirstSentence = (text: string): string => {
  // Match first sentence (ending with . ! ? followed by space or end of string)
  const match = text.match(/^[^.!?]+[.!?](?:\s|$)/);
  return match ? match[0].trim() : text;
};

function ConnectorCard({ connector }: ConnectorCardProps) {
  // Memoize expensive computations
  const metadata = useMemo(
    () => parseConnectorMetadata(connector.keywords),
    [connector.keywords]
  );

  const displayName = useMemo(
    () => getDisplayName(connector.name, metadata.vendor),
    [connector.name, metadata.vendor]
  );

  const centralUrl = useMemo(
    () => `https://central.ballerina.io/${connector.URL}`,
    [connector.URL]
  );

  const firstSentence = useMemo(
    () => getFirstSentence(connector.summary),
    [connector.summary]
  );

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardActionArea
        href={centralUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <CardContent sx={{ flexGrow: 1, width: '100%' }}>
          {/* Icon and Title */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar
              src={connector.icon}
              alt={connector.name}
              sx={{ width: 48, height: 48 }}
              variant="rounded"
            >
              {connector.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                v{connector.version}
              </Typography>
            </Box>
          </Box>

          {/* Summary */}
          <Box
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '40px',
              '& p': {
                margin: 0,
                fontSize: '0.8125rem',
                lineHeight: 1.43,
                color: 'text.secondary',
              },
              '& code': {
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
              },
              '& strong': {
                fontWeight: 600,
              },
              '& em': {
                fontStyle: 'italic',
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
            }}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => <span>{children}</span>,
                // Don't render links - the whole card is already clickable
                a: ({ children }) => <span>{children}</span>,
              }}
            >
              {firstSentence}
            </ReactMarkdown>
          </Box>

          {/* Metadata Chips */}
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {/* Type chip - always visible */}
            <Chip
              label={metadata.type}
              size="small"
              color="primary"
              sx={{
                fontSize: '0.7rem',
                height: '24px',
                '& .MuiChip-label': {
                  textTransform: 'none',
                }
              }}
            />

            {metadata.vendor !== 'Other' && (
              <Chip
                label={metadata.vendor}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: '24px',
                  '& .MuiChip-label': {
                    textTransform: 'none',
                  }
                }}
              />
            )}

            {metadata.area !== 'Other' && (
              <Chip
                label={metadata.area}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: '24px',
                  '& .MuiChip-label': {
                    textTransform: 'none',
                  }
                }}
              />
            )}
          </Box>

          {/* Pull Count and Last Updated */}
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
              <DownloadIcon sx={{ fontSize: '1rem' }} />
              <Typography variant="caption">
                {connector.totalPullCount
                  ? `${formatPullCount(connector.totalPullCount)} downloads`
                  : 'Loading downloads...'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
              <ClockIcon sx={{ fontSize: '1rem' }} />
              <Typography variant="caption" title={formatDate(connector.createdDate)}>
                {formatDaysSince(connector.createdDate)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export default memo(ConnectorCard);
