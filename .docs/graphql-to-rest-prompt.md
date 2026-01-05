## Role

You are a senior front end engineer with experience on React and Integration technologies.

## Task

Your task is to replace a set of GraphQL APIs with a REST API.

## Context

The current setup is using GraphQL APIs to retrieve package data from the Ballerina central. But this is too slow.
Therefore, the plan is to use the new REST API to retrieve the data.

Here's the existing GraphQL API endpoint: https://api.central.ballerina.io/2.0/graphql

Here's the new REST API: https://api.central.ballerina.io/2.0/registry/search-packages

This new REST API is a Solace-based one, so we can use filters here to filter out the connectors.

## Implementation

Do the following tasks, plan accordingly

1. Replace the GraphQL API call with the REST API. This will resolve the issue where we have to call the API again to
   retrieve the total pull count.
2. Instead of caching all the packages in frontend, call the API and retrieve data with pagination. (The REST API
   supports pagination)
3. When sorting with Popularity, Newest, or alphabetical, use the same API and retrieve the data accordingly.

## Examples

1. Example API call (not URL encoded): https://api.central.ballerina.io/2.0/registry/search-packages?q=keyword:connector
   org:ballerinax&offset=0&limit=10&readme=false&sort=relevance,DESC
