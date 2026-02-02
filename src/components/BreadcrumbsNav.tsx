import React from "react";
import { Breadcrumbs, Link, Typography } from "@wso2/oxygen-ui";
import { ArrowBack, ChevronRight } from "@mui/icons-material";

interface BreadcrumbsNavProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connectorName: any;
}

const BreadcrumbsNav: React.FC<BreadcrumbsNavProps> = ({ connectorName }) => (
  <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 16 }} />} sx={{ fontSize: 14 }}>
    <Link
      href="/"
      underline="hover"
      sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}
    >
      <ArrowBack sx={{ fontSize: 16 }} />
      Connector Store
    </Link>
    <Typography variant="body2" color="text.primary">
      {connectorName}
    </Typography>
  </Breadcrumbs>
);

export default BreadcrumbsNav;
