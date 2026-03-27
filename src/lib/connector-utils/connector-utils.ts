/*
 Copyright (c) 2026 WSO2 LLC. (http://www.wso2.com) All Rights Reserved.

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

import { BallerinaPackage, ConnectorMetadata, FilterOptions } from '@/types/connector';

/** Default metadata value for connectors missing Area/Vendor/Type keywords */
export const METADATA_FALLBACK = 'Other';

/**
 * Dictionary for proper brand/term capitalization
 * Maps lowercase to proper capitalization
 */
const CAPITALIZATION_DICTIONARY: Record<string, string> = {
  // AI/ML Services
  openai: 'OpenAI',
  ai: 'AI',
  ml: 'ML',

  // Cloud Providers & Services
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
  s3: 'S3',
  sqs: 'SQS',
  sns: 'SNS',
  dynamodb: 'DynamoDB',

  // Protocols & Standards
  api: 'API',
  http: 'HTTP',
  https: 'HTTPS',
  ftp: 'FTP',
  sftp: 'SFTP',
  ssh: 'SSH',
  sql: 'SQL',
  nosql: 'NoSQL',
  graphql: 'GraphQL',
  grpc: 'gRPC',
  rest: 'REST',
  soap: 'SOAP',
  smtp: 'SMTP',
  imap: 'IMAP',
  pop3: 'POP3',
  tcp: 'TCP',
  udp: 'UDP',
  ip: 'IP',
  dns: 'DNS',
  ldap: 'LDAP',
  scim: 'SCIM',
  fhir: 'FHIR',
  hl7: 'HL7',
  cdc: 'CDC',

  // Data Formats
  xml: 'XML',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  csv: 'CSV',
  yaml: 'YAML',
  toml: 'TOML',

  // Auth & Security
  jwt: 'JWT',
  oauth: 'OAuth',
  saml: 'SAML',
  openid: 'OpenID',

  // Messaging
  rss: 'RSS',
  sms: 'SMS',
  mms: 'MMS',
  mqtt: 'MQTT',
  amqp: 'AMQP',

  // Databases
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
  redis: 'Redis',
  mssql: 'MSSQL',
  mariadb: 'MariaDB',

  // Business
  crm: 'CRM',
  adp: 'ADP',
  nytimes: 'NYTimes',

  // Platforms & Companies (common ones)
  godaddy: 'GoDaddy',
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
  salesforce: 'Salesforce',
  workday: 'Workday',
  servicenow: 'ServiceNow',
  shopify: 'Shopify',
  stripe: 'Stripe',
  paypal: 'PayPal',
  twilio: 'Twilio',
  sendgrid: 'SendGrid',
  hubspot: 'HubSpot',
  zendesk: 'Zendesk',
  jira: 'Jira',
  confluence: 'Confluence',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitter: 'Twitter',
  slack: 'Slack',
  discord: 'Discord',
  dropbox: 'Dropbox',
  onedrive: 'OneDrive',
  googledrive: 'GoogleDrive',
  googleapis: 'GoogleAPIs',

  // Technologies
  iot: 'IoT',
  sdk: 'SDK',
  cli: 'CLI',
  ui: 'UI',
  ux: 'UX',
  url: 'URL',
  uri: 'URI',
  uuid: 'UUID',
  pdf: 'PDF',
  gif: 'GIF',
  png: 'PNG',
  jpg: 'JPG',
  jpeg: 'JPEG',
  svg: 'SVG',
};

/**
 * Packages to hide from the connector store.
 * These are excluded from all search results, pagination, and filter options.
 */
export const HIDDEN_PACKAGES = new Set<string>([
  'asyncapi.native.handler',
  'choreo',
  'client.config',
  'health.base',
  'trigger.aayu.mftg.as2',
  'trigger.asb',
  'trigger.asgardeo',
  'trigger.github',
  'trigger.google.calendar',
  'trigger.google.drive',
  'trigger.google.mail',
  'trigger.google.sheets',
  'trigger.hubspot',
  'trigger.identityserver',
  'trigger.quickbooks',
  'trigger.salesforce',
  'trigger.shopify',
  'trigger.slack',
  'trigger.twilio',
]);

/**
 * Full package name to display name overrides.
 * These take highest priority and bypass all other name resolution.
 */
const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  'aayu.mftg.as2': 'Aayu MFTG AS2',
  'activemq.driver': 'ActiveMQ Driver',
  'ai.deepseek': 'DeepSeek AI Connector',
  'ai.memory.mssql': 'AI Memory - MS SQL Server',
  'ai.openrouter': 'OpenRouter AI Gateway',
  'ai.pgvector': 'PostgreSQL Vectorstore',
  asb: 'Azure Service Bus',
  'asyncapi.native.handler': 'AsyncAPI Native Handler',
  'aws.marketplace.mpe': 'AWS Marketplace MPE',
  'aws.marketplace.mpm': 'AWS Marketplace MPM',
  'aws.redshiftdata': 'AWS Redshift Data',
  'aws.secretmanager': 'AWS Secret Manager',
  'aws.ses': 'AWS SES',
  'aws.simpledb': 'AWS SimpleDB',
  activecampaign: 'ActiveCampaign',
  'adp.paystatements': 'ADP Pay Statements',
  'adp.workerpayrollinstructions': 'ADP Worker Payroll Instructions',
  'azure.ad': 'Azure AD',
  'azure.anomalydetector': 'Azure Anomaly Detector',
  'azure.iothub': 'Azure IoT Hub',
  'azure.openai.finetunes': 'Azure OpenAI Fine-Tunes',
  'azure.qnamaker': 'Azure QnA Maker',
  'azure.sqldb': 'Azure SQL DB',
  azure_cosmosdb: 'Azure Cosmos DB',
  azure_eventhub: 'Azure Event Hub',
  azure_storage_service: 'Azure Storage Service',
  'beezup.merchant': 'BeezUP Merchant',
  bintable: 'BINTable',
  bisstats: 'BIS Stats',
  bulksms: 'BulkSMS',
  'bmc.truesightpresentationserver': 'BMC TrueSight Presentation Server',
  boxapi: 'Box API',
  capsulecrm: 'Capsule CRM',
  'cdata.connect': 'CData Connect',
  'cdata.connect.driver': 'CData Connect Driver',
  cdc: 'CDC',
  'cloudmersive.virusscan': 'Cloudmersive Virus Scan',
  'commercetools.cartsordershoppinglists': 'Commercetools Carts, Orders & Shopping Lists',
  'commercetools.customizebehavior': 'Commercetools Customize Behavior',
  'commercetools.customizedata': 'Commercetools Customize Data',
  constantcontact: 'Constant Contact',
  'confluent.cavroserdes': 'Confluent Avro SerDes',
  'confluent.cregistry': 'Confluent Schema Registry',
  'docusign.admin': 'DocuSign Admin',
  'docusign.click': 'DocuSign Click',
  'docusign.dsadmin': 'DocuSign Admin',
  'docusign.dsclick': 'DocuSign Click',
  'docusign.dsesign': 'DocuSign eSign',
  'docusign.monitor': 'DocuSign Monitor',
  'docusign.rooms': 'DocuSign Rooms',
  'edifact.d03a.finance': 'EDIFACT D03A Finance',
  'edifact.d03a.logistics': 'EDIFACT D03A Logistics',
  'edifact.d03a.manufacturing': 'EDIFACT D03A Manufacturing',
  'edifact.d03a.retail': 'EDIFACT D03A Retail',
  'edifact.d03a.services': 'EDIFACT D03A Services',
  'edifact.d03a.shipping': 'EDIFACT D03A Shipping',
  'edifact.d03a.supplychain': 'EDIFACT D03A Supply Chain',
  edocs: 'eDocs',
  'elastic.elasticcloud': 'Elastic Cloud',
  'ellucian.studentcharges': 'Ellucian Student Charges',
  exchangerates: 'Exchange Rates',
  'files.com': 'Files.com',
  flatapi: 'Flat API',
  'fraudlabspro.smsverification': 'FraudLabs Pro SMS Verification',
  freshbooks: 'FreshBooks',
  'financial.iso20022': 'Financial ISO 20022',
  'financial.iso20022ToSwiftmt': 'Financial ISO 20022 to SWIFT MT',
  'financial.iso8583': 'Financial ISO 8583',
  'financial.swift.mt': 'Financial SWIFT MT',
  'financial.swiftmtToIso20022': 'Financial SWIFT MT to ISO 20022',
  'gcloud.pubsub': 'Google Cloud Pub/Sub',
  'googleapis.bigquery': 'Google BigQuery',
  'googleapis.bigquery.datatransfer': 'Google BigQuery Data Transfer',
  'googleapis.cloudbillingaccount': 'Google Cloud Billing Account',
  'googleapis.cloudbuild': 'Google Cloud Build',
  'googleapis.clouddatastore': 'Google Cloud Datastore',
  'googleapis.cloudfilestore': 'Google Cloud Filestore',
  'googleapis.cloudfunctions': 'Google Cloud Functions',
  'googleapis.cloudnaturallanguage': 'Google Cloud Natural Language',
  'googleapis.cloudpubsub': 'Google Cloud Pub/Sub',
  'googleapis.cloudscheduler': 'Google Cloud Scheduler',
  'googleapis.cloudtalentsolution': 'Google Cloud Talent Solution',
  'googleapis.cloudtranslation': 'Google Cloud Translation',
  gototraining: 'GoToTraining',
  gotomeeting: 'GoToMeeting',
  gotowebinar: 'GoToWebinar',
  'googleapis.appsscript': 'Google Apps Script',
  'googleapis.gcalendar': 'Google Calendar',
  'googleapis.gmail': 'Gmail',
  'googleapis.manufacturercenter': 'Google Manufacturer Center',
  'googleapis.mybusiness': 'Google My Business',
  'ibm.ctg': 'IBM CTG',
  'ibm.ibmmq': 'IBM MQ',
  idetraceprovider: 'IDE Trace Provider',
  ipgeolocation: 'IP Geolocation',
  iptwist: 'ipTwist',
  'iris.disputeresponder': 'IRIS Dispute Responder',
  'iris.esignature': 'IRIS eSignature',
  'iris.helpdesk': 'IRIS Helpdesk',
  'iris.merchants': 'IRIS Merchants',
  'iris.residuals': 'IRIS Residuals',
  'iris.subscriptions': 'IRIS Subscriptions',
  isendpro: 'iSendPro',
  'interzoid.convertcurrency': 'Interzoid Convert Currency',
  'interzoid.currencyexchange': 'Interzoid Currency Exchange',
  'interzoid.currencyrate': 'Interzoid Currency Rate',
  'interzoid.globalnumberinfo': 'Interzoid Global Number Info',
  'interzoid.globaltime': 'Interzoid Global Time',
  'interzoid.statedata': 'Interzoid State Data',
  'interzoid.weatherzip': 'Interzoid Weather Zip',
  ip2whois: 'IP2WHOIS',
  isbndb: 'ISBNdb',
  'java.jdbc': 'Java JDBC',
  'jira.servicemanagement': 'Jira Service Management',
  'java.jms': 'Java JMS',
  launchdarkly: 'LaunchDarkly',
  'microsoft.dynamics365businesscentral': 'Microsoft Dynamics 365 Business Central',
  'mssql.cdc.driver': 'MSSQL CDC Driver',
  'mysql.cdc.driver': 'MySQL CDC Driver',
  namsor: 'NamSor',
  netsuite: 'NetSuite',
  newsapi: 'News API',
  newrelic: 'New Relic',
  nowpayments: 'NOWPayments',
  'nytimes.articlesearch': 'NYTimes Article Search',
  'nytimes.moviereviews': 'NYTimes Movie Reviews',
  'nytimes.topstories': 'NYTimes Top Stories',
  np: 'NP',
  odweather: 'OD Weather',
  onepassword: '1Password',
  orbitcrm: 'Orbit CRM',
  openair: 'OpenAir',
  openfigi: 'OpenFIGI',
  openweathermap: 'OpenWeatherMap',
  'openai.finetunes': 'OpenAI Fine-Tunes',
  'oracledb.driver': 'OracleDB Driver',
  pagerduty: 'PagerDuty',
  pandadoc: 'PandaDoc',
  pdfbroker: 'PDF Broker',
  peoplehr: 'PeopleHR',
  pocketsmith: 'PocketSmith',
  'persist.googlesheets': 'Persist Google Sheets',
  'persist.inmemory': 'Persist In-Memory',
  'postgresql.cdc.driver': 'PostgreSQL CDC Driver',
  'power.bi': 'Power BI',
  'powertoolsdeveloper.data': 'Powertools Developer Data',
  'powertoolsdeveloper.files': 'Powertools Developer Files',
  'powertoolsdeveloper.math': 'Powertools Developer Math',
  'powertoolsdeveloper.weather': 'Powertools Developer Weather',
  'quickbooks.online': 'QuickBooks Online',
  sap: 'SAP',
  'sap.fieldglass.approval': 'SAP Fieldglass Approval',
  'sap.jco': 'SAP JCo',
  'sap.s4hana.api_sales_inquiry_srv': 'SAP S/4HANA Sales Inquiry API',
  'sap.s4hana.api_sales_order_simulation_srv': 'SAP S/4HANA Sales Order Simulation API',
  'sap.s4hana.api_sales_order_srv': 'SAP S/4HANA Sales Order API',
  'sap.s4hana.api_sales_quotation_srv': 'SAP S/4HANA Sales Quotation API',
  'sap.s4hana.api_salesdistrict_srv': 'SAP S/4HANA Sales District API',
  'sap.s4hana.api_salesorganization_srv': 'SAP S/4HANA Sales Organization API',
  'sap.s4hana.api_sd_incoterms_srv': 'SAP S/4HANA SD Incoterms API',
  'sap.s4hana.api_sd_sa_soldtopartydetn': 'SAP S/4HANA SD Sold-to-Party Determination',
  'sap.s4hana.ce_salesorder_0001': 'SAP S/4HANA CE Sales Order',
  'sap.s4hana.salesarea_0001': 'SAP S/4HANA Sales Area',
  'sap.successfactors.litmos': 'SAP SuccessFactors Litmos',
  'siemens.platformcore.identitymanagement': 'Siemens Platform Core Identity Management',
  'saps4hana.externaltaxcalculation.taxquote': 'SAP S/4HANA External Tax Calculation',
  'saps4hana.itcm.agreement': 'SAP S/4HANA ITCM Agreement',
  'saps4hana.itcm.customer': 'SAP S/4HANA ITCM Customer',
  'saps4hana.itcm.product': 'SAP S/4HANA ITCM Product',
  'saps4hana.itcm.user': 'SAP S/4HANA ITCM User',
  'saps4hana.wls.screeninghits': 'SAP S/4HANA WLS Screening Hits',
  ritekit: 'RiteKit',
  samcart: 'SamCart',
  shipstation: 'ShipStation',
  soundcloud: 'SoundCloud',
  squareup: 'SquareUp',
  stabilityai: 'Stability AI',
  sugarcrm: 'SugarCRM',
  symantotextanalytics: 'Symanto Text Analytics',
  techport: 'TechPort',
  themoviedb: 'TheMovieDB',
  'trigger.aayu.mftg.as2': 'Trigger Aayu MFTG AS2',
  'trigger.asb': 'Trigger Azure Service Bus',
  'trigger.quickbooks': 'Trigger QuickBooks',
  'webscraping.ai': 'Web Scraping AI',
  whohoststhis: 'WhoHostsThis',
  'whatsapp.business': 'WhatsApp Business',
  visiblethread: 'VisibleThread',
  'vonage.numberinsight': 'Vonage Number Insight',
  'workday.absencemanagement': 'Workday Absence Management',
  'workday.businessprocess': 'Workday Business Process',
  'workday.coreaccounting': 'Workday Core Accounting',
  wordpress: 'WordPress',
  worldtimeapi: 'World Time API',
  'wso2.apim.catalog': 'WSO2 API Manager Catalog',
  'wso2.controlplane': 'WSO2 Control Plane',
  'wso2.icp': 'WSO2 ICP',
};

/**
 * Converts a package name to a display name.
 *
 * Resolution order:
 * 1. DISPLAY_NAME_OVERRIDES dictionary (full package name match)
 * 2. Name/ keyword tag from Ballerina.toml
 * 3. Smart capitalization using CAPITALIZATION_DICTIONARY per word
 * 4. Vendor metadata match
 * 5. Default: capitalize first letter of each part
 */
export function getDisplayName(packageName: string, vendor?: string, keywords?: string[]): string {
  // 1. Check full name overrides first
  if (DISPLAY_NAME_OVERRIDES[packageName]) {
    return DISPLAY_NAME_OVERRIDES[packageName];
  }

  // 2. Check Name/ keyword tag
  if (keywords) {
    const nameTag = keywords.find((k) => k.startsWith('Name/'));
    if (nameTag) {
      const extracted = nameTag.slice('Name/'.length).trim();
      if (extracted) {
        return extracted;
      }
    }
  }

  // 3. Fall back to word-level capitalization
  const parts = packageName.split('.');

  const transformedParts = parts.map((part, index) => {
    const lowerPart = part.toLowerCase();

    // Check dictionary first
    if (CAPITALIZATION_DICTIONARY[lowerPart]) {
      return CAPITALIZATION_DICTIONARY[lowerPart];
    }

    // If we have vendor info and this is the first part, try to match with vendor
    if (index === 0 && vendor && vendor.toLowerCase() !== METADATA_FALLBACK.toLowerCase()) {
      const vendorLower = vendor.toLowerCase();
      if (
        lowerPart === vendorLower ||
        vendorLower.includes(lowerPart) ||
        lowerPart.includes(vendorLower)
      ) {
        return vendor;
      }
    }

    // Default: capitalize first letter
    return part.charAt(0).toUpperCase() + part.slice(1);
  });

  return transformedParts.join(' ');
}

/**
 * Extracts metadata from connector keywords
 */
export function parseConnectorMetadata(keywords: string[]): ConnectorMetadata {
  const area =
    keywords.find((k) => k.startsWith('Area/'))?.replace('Area/', '') || METADATA_FALLBACK;
  const vendor =
    keywords.find((k) => k.startsWith('Vendor/'))?.replace('Vendor/', '') || METADATA_FALLBACK;
  const type =
    keywords.find((k) => k.startsWith('Type/'))?.replace('Type/', '') || METADATA_FALLBACK;
  return { area, vendor, type };
}

/**
 * Extracts all unique filter options from connectors
 * Includes all connector types to populate filter dropdowns
 */
export function extractFilterOptions(connectors: BallerinaPackage[]): FilterOptions {
  const areas = new Set<string>();
  const vendors = new Set<string>();
  const types = new Set<string>();

  connectors.forEach((connector) => {
    const metadata = parseConnectorMetadata(connector.keywords);
    areas.add(metadata.area);
    vendors.add(metadata.vendor);
    types.add(metadata.type);
  });

  return {
    areas: Array.from(areas).sort(),
    vendors: Array.from(vendors).sort(),
    types: Array.from(types).sort(),
  };
}

/**
 * Filters connectors based on selected criteria
 * Note: Automatically filters to only show connectors with type "connector"
 */
export function filterConnectors(
  connectors: BallerinaPackage[],
  filters: {
    selectedAreas: string[];
    selectedVendors: string[];
    searchQuery: string;
  }
): BallerinaPackage[] {
  return connectors.filter((connector) => {
    const metadata = parseConnectorMetadata(connector.keywords);

    // Area filter
    if (filters.selectedAreas.length > 0 && !filters.selectedAreas.includes(metadata.area)) {
      return false;
    }

    // Vendor filter
    if (filters.selectedVendors.length > 0 && !filters.selectedVendors.includes(metadata.vendor)) {
      return false;
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const displayName = getDisplayName(connector.name, metadata.vendor);
      const searchableText = [
        connector.name,
        displayName,
        connector.summary,
        ...connector.keywords,
        metadata.area,
        metadata.vendor,
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Formats pull count for display
 */
export function formatPullCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Formats a date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculates days since a date
 */
export function getDaysSinceUpdate(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Formats time since update in a human-readable way
 */
export function formatDaysSince(dateString: string): string {
  const days = getDaysSinceUpdate(dateString);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * Sort options
 */
export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'pullCount-desc'
  | 'pullCount-asc'
  | 'date-desc'
  | 'date-asc';

/**
 * Sorts connectors based on selected option
 */
export function sortConnectors(
  connectors: BallerinaPackage[],
  sortBy: SortOption
): BallerinaPackage[] {
  const sorted = [...connectors];

  switch (sortBy) {
    case 'name-asc':
      return sorted.sort((a, b) => {
        const vendorA = parseConnectorMetadata(a.keywords).vendor;
        const vendorB = parseConnectorMetadata(b.keywords).vendor;
        return getDisplayName(a.name, vendorA).localeCompare(getDisplayName(b.name, vendorB));
      });

    case 'name-desc':
      return sorted.sort((a, b) => {
        const vendorA = parseConnectorMetadata(a.keywords).vendor;
        const vendorB = parseConnectorMetadata(b.keywords).vendor;
        return getDisplayName(b.name, vendorB).localeCompare(getDisplayName(a.name, vendorA));
      });

    case 'pullCount-desc':
      return sorted.sort((a, b) => (b.totalPullCount || 0) - (a.totalPullCount || 0));

    case 'pullCount-asc':
      return sorted.sort((a, b) => (a.totalPullCount || 0) - (b.totalPullCount || 0));

    case 'date-desc':
      return sorted.sort(
        (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      );

    case 'date-asc':
      return sorted.sort(
        (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
      );

    default:
      return sorted;
  }
}
