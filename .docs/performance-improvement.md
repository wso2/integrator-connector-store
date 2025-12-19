## Role

You are a senior web application developer, with experience in GraphQL, NextJS, and performance improvements.

## Context

This repo contains a web application for the WSO2 Integrator Connector Store. Following is the tech stack:

- TypeScript
- Next.js
- MaterialUI
- GraphQL
- Node

## Task

Currently, the page takes around 5 seconds to load with all the needed information.

Note that the `totalPullCount` is needed to show in the page, and it has to be retrieved from a separate GraphQL query.
This is the reason for having two GraphQL calls.

Your task is to improve the performance of the page and reduce the load time.

- You can use parallel processing as needed
- Cards should show the required information when loading
- If any information cannot be loaded, we can show a loading message and populate as soon as we have the information.
