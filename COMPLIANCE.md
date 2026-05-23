# Compliance Checklist

This checklist is for publishing the repository on GitHub. It is not legal
advice.

## Completed In This Repository

- MIT project license is present in `LICENSE`.
- `package.json` declares the project license, author, and package manager.
- Third-party license notes are documented in `THIRD_PARTY_NOTICES.md`.
- Privacy notes are documented in `PRIVACY.md`.
- Security reporting and secret-handling guidance are documented in
  `SECURITY.md`.
- Local agent settings are ignored via `.gitignore`.
- The optional Bing image metadata fetcher is disabled by default.
- Debug output no longer exposes API key prefixes.
- Placeholder environment variables avoid realistic sample secrets.
- Unused default template logo assets were removed.

## Before Publishing

- Confirm `LICENSE` uses the correct copyright holder.
- Replace README screenshots or copied media with assets you own or can
  redistribute.
- Add a deployment-specific privacy policy if you publish a hosted instance.
- Confirm optional scraping or image metadata features comply with target
  service terms and image owners' rights before enabling them.
- Rerun a dependency license report after dependency changes.
- Run secret scanning before the first public push.
