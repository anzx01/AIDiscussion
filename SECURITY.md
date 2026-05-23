# Security Policy

## Supported Versions

This project is pre-1.0. Security fixes are handled on the default branch.

## Reporting

Do not open a public issue for secrets, account takeover paths, or data exposure
bugs. Report security concerns privately to the project maintainer and include:

- A short impact summary.
- Reproduction steps.
- Affected routes, files, or dependencies.

## Secret Handling

Never commit real `.env` files, database URLs, API keys, provider tokens, or
private keys. Rotate any credential that may have been committed or exposed in
logs.
