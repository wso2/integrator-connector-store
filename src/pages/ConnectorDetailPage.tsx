/*
 Copyright (c) 2026 WSO2 LLC. (http://www.wso2.com).

 WSO2 LLC. licenses this file to you under the Apache License,
 Version 2.0 (the "License"); you may not use this file except
 in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Button,
  Paper,
  Breadcrumbs,
  Link,
} from '@wso2/oxygen-ui';
import {
  ArrowBack as ArrowBackIcon,
  AccessTime as ClockIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import {
  Download as DownloadIcon,
} from '@wso2/oxygen-ui-icons-react';
import { PackageDetails } from '@/types/connector';
import { fetchPackageDetails } from '@/lib/rest-client';
import {
  parseConnectorMetadata,
  formatPullCount,
  formatDate,
  formatDaysSince,
  getDisplayName,
} from '@/lib/connector-utils';
import WSO2Header from '@/components/WSO2Header';
import MarkdownContent from '@/components/MarkdownContent';

/**
 * Extract only Overview and Setup sections from README, removing code blocks
 */
function extractOverviewAndSetup(readme: string): { overview: string; setup: string } {
  // Remove code blocks (``` ... ```)
  const removeCodeBlocks = (text: string) => {
    return text.replace(/```[\s\S]*?```/g, '').trim();
  };

  // Split by ## headers to find sections
  const sections = readme.split(/(?=^## )/m);

  let overview = '';
  let setup = '';

  for (const section of sections) {
    const lowerSection = section.toLowerCase();

    if (lowerSection.startsWith('## overview')) {
      overview = removeCodeBlocks(section);
    } else if (lowerSection.startsWith('## setup') || lowerSection.startsWith('## prerequisites')) {
      setup = removeCodeBlocks(section);
    }
  }

  // If no ## Overview found, check for content before first ## header (intro text)
  if (!overview) {
    const firstHeaderIndex = readme.indexOf('## ');
    if (firstHeaderIndex > 0) {
      const introText = readme.substring(0, firstHeaderIndex).trim();
      if (introText) {
        overview = removeCodeBlocks(introText);
      }
    }
  }

  return { overview, setup };
}

export default function ConnectorDetailPage() {
  const { org, name, version } = useParams<{ org: string; name: string; version?: string }>();
  const navigate = useNavigate();

  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPackageDetails = async () => {
      if (!org || !name) {
        setError('Invalid package URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const details = await fetchPackageDetails(org, name, version);
        setPackageDetails(details);
      } catch (err) {
        console.error('Failed to load package details:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load connector details. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadPackageDetails();
  }, [org, name, version]);

  const metadata = useMemo(
    () => (packageDetails ? parseConnectorMetadata(packageDetails.keywords) : null),
    [packageDetails]
  );

  const displayName = useMemo(
    () =>
      packageDetails && metadata
        ? getDisplayName(packageDetails.name, metadata.vendor)
        : name || '',
    [packageDetails, metadata, name]
  );

  const centralUrl = useMemo(
    () => (packageDetails ? `https://central.ballerina.io/${packageDetails.URL}` : ''),
    [packageDetails]
  );
  
  // Extract only Overview and Setup sections
  const { overview, setup } = useMemo(
    () => (packageDetails ? extractOverviewAndSetup(packageDetails.readme) : { overview: '', setup: '' }),
    [packageDetails]
  );

  return (
    <>
      <WSO2Header effectiveMode={'light'} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component={RouterLink}
            to="/"
            color="inherit"
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            Connector Store
          </Link>
          <Typography color="text.primary">{displayName}</Typography>
        </Breadcrumbs>

        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
          variant="text"
        >
          Back
        </Button>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Content */}
        {packageDetails && !loading && (
          <>
            {/* Header Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {/* Icon and Title */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                  <Avatar
                    src={packageDetails.icon}
                    alt={packageDetails.name}
                    sx={{ width: 64, height: 64 }}
                    variant="rounded"
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                      {displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {packageDetails.organization}/{packageDetails.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      v{packageDetails.version}
                    </Typography>
                  </Box>
                </Box>

                {/* Stats */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    alignItems: { xs: 'flex-start', sm: 'flex-end' },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                    <DownloadIcon style={{ fontSize: '1rem' }} />
                    <Typography variant="body2">
                      {formatPullCount(packageDetails.pullCount)} downloads
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                    <ClockIcon sx={{ fontSize: '1rem' }} />
                    <Typography variant="body2" title={formatDate(packageDetails.createdDate)}>
                      Updated {formatDaysSince(packageDetails.createdDate)}
                    </Typography>
                  </Box>
                  <Button
                    href={centralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                    endIcon={<OpenInNewIcon />}
                    sx={{ mt: 1 }}
                  >
                    View on Ballerina Central
                  </Button>
                </Box>
              </Box>

              {/* Overview Content */}
              {overview && (
                <Box sx={{ mt: 2 }}>
                  <MarkdownContent content={overview} />
                </Box>
              )}

              {/* Metadata Chips */}
              {metadata && (
                <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                  <Chip
                    label={metadata.type}
                    size="small"
                    color="primary"
                    sx={{ fontSize: '0.75rem' }}
                  />
                  {metadata.vendor !== 'Other' && (
                    <Chip label={metadata.vendor} size="small" sx={{ fontSize: '0.75rem' }} />
                  )}
                  {metadata.area !== 'Other' && (
                    <Chip
                      label={metadata.area}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  )}
                  {packageDetails.licenses.map((license) => (
                    <Chip
                      key={license}
                      label={license}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              )}
            </Paper>

            {/* Setup Section */}
            {setup && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <MarkdownContent content={setup} />
              </Paper>
            )}

            {/* Source Code Link */}
            {packageDetails.sourceCodeLocation && (
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  href={packageDetails.sourceCodeLocation}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="text"
                  endIcon={<OpenInNewIcon />}
                >
                  View Source Code
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>
    </>
  );
}
