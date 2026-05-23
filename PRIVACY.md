# Privacy Notes

This project is source code for a self-hosted application. The repository does
not provide a hosted privacy policy for your deployment.

## Data The App Can Store

Depending on enabled features and database configuration, the app can store:

- User travel prompts, preferences, generated discussion messages, and session
  metadata.
- Optional email addresses submitted through the email capture endpoint.
- Analytics event names, session IDs, and optional event metadata.
- Authentication users, sessions, accounts, verification records, and provider
  tokens managed by Better Auth.

## Third-Party Processing

When real API mode is enabled, prompts and generated context may be sent to the
configured AI providers, including Zhipu-compatible endpoints and DeepSeek.
Operators are responsible for making sure their provider configuration,
retention settings, and user disclosures match their deployment.

## Operator Responsibilities

Before publishing or deploying this project, add a deployment-specific privacy
policy that explains:

- What data is collected and why.
- Which AI, database, analytics, email, and hosting providers process data.
- How users can request export or deletion of their data.
- Retention periods and security controls.

Do not commit real `.env` files or production secrets.
