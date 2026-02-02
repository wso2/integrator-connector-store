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

import React, { useEffect, useMemo, useState } from "react";
import { 
  useColorScheme, 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  Divider, 
  useMediaQuery, 
  Button, 
  CircularProgress 
} from "@wso2/oxygen-ui";
import WSO2Header from "@/components/WSO2Header";
import { Clock, Download } from '@wso2/oxygen-ui-icons-react';
import { OpenInNew } from "@mui/icons-material";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import { useParams } from 'react-router-dom';
import { PackageDetails } from '@/types/connector';
import { fetchPackageDetails } from '@/lib/rest-client';
import {
  parseConnectorMetadata,
  formatPullCount,
  formatDaysSince,
  getDisplayName,
} from '@/lib/connector-utils';
import MarkdownContent from '@/components/MarkdownContent';
import Footer from "@/components/Footer";

/**
 * Extracts Overview and Setup sections from README content.
 */
function extractOverviewAndSetup(readme: string): { overview: string; setup: string } {
  const removeCodeBlocks = (text: string) => text.replace(/```[\s\S]*?```/g, '').trim();
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

  if (!overview && readme) {
    const firstHeaderIndex = readme.indexOf('## ');
    if (firstHeaderIndex > 0) {
      const introText = readme.substring(0, firstHeaderIndex).trim();
      if (introText) overview = removeCodeBlocks(introText);
    }
  }

  return { overview, setup };
}

export default function ConnectorDetailPage() {
  const { mode } = useColorScheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('lg'));
  const { org, name, version } = useParams<{ org: string; name: string; version?: string }>();

  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveMode = useMemo(() => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode as 'light' | 'dark';
  }, [mode]);

  useEffect(() => {
    const loadPackageDetails = async () => {
      if (!org || !name) {
        setError('Invalid package URL');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const details = await fetchPackageDetails(org, name, version);
        setPackageDetails(details);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage || 'Failed to load connector details.');
      } finally {
        setLoading(false);
      }
    };
    loadPackageDetails();
  }, [org, name, version]);

  const metadata = useMemo(() => packageDetails ? parseConnectorMetadata(packageDetails.keywords) : null, [packageDetails]);
  const displayName = useMemo(() => packageDetails && metadata ? getDisplayName(packageDetails.name, metadata.vendor) : name || '', [packageDetails, metadata, name]);
  const { overview, setup } = useMemo(() => packageDetails ? extractOverviewAndSetup(String(packageDetails?.readme || '')) : { overview: '', setup: '' }, [packageDetails]);

  const iconColor = useMemo(() => {
    const colors = ['#DC2626', '#2563EB', '#16A34A', '#9333EA', '#EA580C', '#52525B'];
    const hash = displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, [displayName]);

  const MetadataContent = ({ details }: { details: PackageDetails }) => (
    <Box>
      <Box display='flex' flexDirection={isMobile ? 'row' : 'column'} flexWrap="wrap" gap={isMobile ? 4 : 2}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Version</Typography>
          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>v{details.version}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Downloads</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Download size={14} />
            <Typography variant="body2">{formatPullCount(details.pullCount)}</Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Updated</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Clock size={14} />
            <Typography variant="body2">{formatDaysSince(details.createdDate)}</Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>License</Typography>
          {(packageDetails?.licenses ?? []).map((license, index) => (
            <Typography key={index} variant="body2" mt={0.5}>{license}</Typography>
          ))}
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Tags</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          {details.keywords.map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={() => window.open(`https://central.ballerina.io/${details.URL}`, '_blank')}
        endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
      >
        View on Ballerina Central
      </Button>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: effectiveMode === 'dark' ? 'rgba(0, 0, 0, 0.27)' : '#F9FAFB' }}>
      <WSO2Header effectiveMode={effectiveMode} />

      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: effectiveMode === 'dark' ? '#18181B' : '#FFFFFF' }}>
        <Container maxWidth="xl" sx={{ py: 1.5 }}>
          <BreadcrumbsNav connectorName={displayName} />
        </Container>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}><CircularProgress /></Box>
      ) : !packageDetails ? (
        <Container maxWidth="xl" sx={{ py: 5 }}>
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography variant="h5" color="error" gutterBottom>
              Failed to load connector details
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {error || 'The connector could not be found or is unavailable.'}
            </Typography>
          </Box>
        </Container>
      ) : (
        <Container maxWidth="xl" sx={{ py: 5 }}>
          <Box sx={{ 
            display: "flex", 
            gap: 6
          }}>
            
            {/* Main Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 5 }}>
                <Box sx={{
                  width: 64, height: 64, borderRadius: 3,
                  bgcolor: packageDetails.icon ? 'transparent' : iconColor,
                  display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 24, flexShrink: 0
                }}>
                  {packageDetails.icon ? <img src={packageDetails.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : displayName.charAt(0).toUpperCase()}
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{displayName}</Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{packageDetails.organization}/{packageDetails.name}</Typography>
                </Box>
              </Box>

              {isMobile && (
                <Card sx={{ mb: 4 }}><CardContent><MetadataContent details={packageDetails} /></CardContent></Card>
              )}

              <Box sx={{ minHeight: '100vh' }}>
                {overview && <Box component="section" sx={{ mb: 6 }}><MarkdownContent content={overview} /></Box>}
                {setup && <Box component="section"><MarkdownContent content={setup} /></Box>}
              </Box>
            </Box>

            {/* Sticky Sidebar */}
            {!isMobile && (
              <Box sx={{ width: 340, flexShrink: 0 }}>
                <Box sx={{ 
                  position: "sticky", 
                  top: 100
                }}>
                  <Card sx={{
                    bgcolor: effectiveMode === 'dark' ? '#18181B' : '#FFFFFF',
                    border: effectiveMode === 'dark' ? 'none' : '1px solid #E5E7EB',
                    boxShadow: effectiveMode === 'dark' ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <MetadataContent details={packageDetails} />
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            )}
          </Box>
        </Container>
      )}

       {/* Footer */}
            <Footer effectiveMode={effectiveMode} />
    </Box>
  );
}
