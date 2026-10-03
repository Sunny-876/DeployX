# DeployX Test Matrix

This document defines the minimum validation gates for the beta. It is intentionally practical: validate the flows that matter to real users, while avoiding broad claims about production readiness.

## Local validation

### Dashboard
- Load the public homepage without console errors.
- Confirm route navigation works: home, get started, download, login, register, beta limitations, feedback.
- Verify dashboard layout renders and links are not broken.

### API
- Confirm `/health` returns a healthy status payload.
- Confirm `/agent/health` behaves correctly when the agent is offline or online.
- Verify upload validation and guardrail limits are enforced.

### Agent
- Confirm the agent reports version information and startup state.
- Verify pairing status and API connectivity are displayed clearly.
- Confirm Docker status is reported without exposing sensitive values.

### Docker
- Test a successful project build in a local container.
- Test a failed build scenario and confirm safe cleanup.
- Validate memory and time limits are enforced.

## Production validation

- Login flow works from a real browser session.
- Agent pairing works against the live API.
- Upload request succeeds with a valid project archive.
- Deployment reaches the `BUILDING` and `READY` states.
- Public URL is created successfully using the tunnel flow.
- Pause, resume, and delete flows work as expected.

## Failure validation

- Build failure shows a degraded status instead of a silent hang.
- Startup failure reports a clear reason and relevant log excerpt.
- Agent offline state is visible in the dashboard.
- API offline state is visible without exposing internal details.
- Docker unavailable state is surfaced with user-friendly instructions.
- Tunnel failure does not expose secrets or create a fake success state.

## Security validation

- Authorization checks reject cross-user access.
- Upload validation prevents zip traversal and zip bomb attempts.
- Resource limits are enforced.
- Secret redaction is verified in logs and diagnostics.
- No credentials are included in support copies or public health endpoints.

## Execution checklist

Before closing beta access, the following workflow should be exercised end-to-end:

1. Public website
2. Account creation
3. Dashboard access
4. Agent download
5. Agent installation
6. Pairing
7. Upload project
8. Build project
9. Docker runtime health
10. Tunnel creation
11. Temporary public URL
12. Pause / resume
13. Delete deployment

## Current status

This repository has not completed a full live end-to-end beta workflow in this environment. The documented test matrix remains the required validation target before declaring the beta ready.
