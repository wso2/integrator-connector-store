# WSO2 Integrator Connector Store

## Role

You are a senior frontend developer with experience on working with GraphQL APIs, designing and developing web
applications, UI/UX expert.

## Task

Your task is to build a connector store for WSO2 Integrator. It will be linked from the existing WSO2 Integrator page. So you have to follow the same design language and the color themes as the WSO2 page [WSO2 Integrator](https://wso2.com/integrator/). Ideally, we should have something like the [RefoldAI Connector Store](https://www.refold.ai/integrations).

## Features

- Connector Fetching
  Connector information are fetched from the Ballerina Central, via Ballerina Central GraphQL API. (I will provide the GraphQL Query)
- Connector Filtering
  Each connector contains an array of keywords. These keywords are used to filter the connectors. Filtering mechanism is based on the following:
  - Area: Use the `Area/<>` keyword from the keyword array and filter the connectors. If the `Area/<>` keyword is not present, tPut the connector to "Other" area.
  - Vendor: Use the `Vendor/<>` keyword from the keyword array and filter the connectors. If the `Vendor/<>` keyword is not present, use `Other` as the vendor.
  - Type: Use the `Type/<>` keyword from the keyword array and filter the connectors. If the `Type/<>` keyword is not present, use `Other` as the type.I
- The page should include a left pane to filter the connectors, and main area should show the connectors as cards. These cards can be filtered using the above mentioned categories, and also can be searched using the search bar.
- Each connector card should be linked to the API documentation page (in Ballerina Central). This link will be retrieved from the GraphQL API.

## Context

### Central APIs

YYou can use either the Ballerina Central REST API or the GraphQL API to retrieve data. You can decide on what to use. One main issue is that the GraphQL API does not return the total pull count, even though it has a field named totalPullCount.

#### Ballerina Central GraphQL API

URL: https://api.central.ballerina.io/2.0/graphql
Query:

```
query GetBallerinaxConnectors(
  $orgName:String!
  $limit: Int!
  $offset:Int!
) {
  packages(
    orgName: $orgName
    limit: $limit
    offset: $offset
  ) {
    packages {
      name
      version
      URL
      summary
      keywords
      icon
      createdDate
      totalPullCount
      pullCount
    }
  }
}
```

The `orgName` should be `ballerinax` for connectors. We can improve this to include the `ballerina` as well, but let's keep that for later. Limit and Offset can be used for pagination.

#### Ballerina Central REST API

URL: https://api.central.ballerina.io/2.0/registry/packages

One issue is I don't have the OpenAPI spec for this API. Can you introspect and and/or find it out somehow? This is a public URL. This will return the total pull count also, but I'm not sure how to get that.

### Filtering

Filters should be available for Area, Vendor, and Type. The values can be either hard coded or fetched from the data we
retrieve from the central/registry.

## Rules

- Use MaterialUI for UI components.
- Decide a frontend framework to use based on the requirements. Specially consider the loading time and the performance, also how to support filtering, while reducing the network calls as well. Let me know before finalize it.
- Use the same design language and the color themes as the WSO2 page [WSO2 Integrator](https://wso2.com/integrator/).
- Use the same color themes as the WSO2 page [WSO2 Integrator](https://wso2.com/integrator/). A saved website can be
  found in "<wso2 integrator page>". Copy the files from there if you need. Keep the same styles, logos, etc.
- Support both dark and light themes.
- Use the same font as the WSO2 page [WSO2 Integrator](https://wso2.com/integrator/).
- Use the icons from the Ballerina Central (GraphQL query will return the icon URL as well)
- Page load time should be <2s

## References

- [WSO2 Integrator](https://wso2.com/integrator/)
- [RefoldAI Connector Store](https://www.refold.ai/integrations)

You can ask questions from the user if you are unclear of anything.
