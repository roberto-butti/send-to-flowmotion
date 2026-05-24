# Send to Flowmotion Implementation TODO

This project is intentionally split into small, commit-friendly steps so each phase can be tested, committed, and documented for an article about building a first Storyblok Tool Plugin.

## 1. Baseline Project Setup

- [x] Confirm the app runs locally over trusted HTTPS.
- [x] Document the `mkcert` setup.
- [x] Clean up the starter page into a minimal plugin shell.

Suggested commit:

```txt
chore: prepare local https development setup
```

## 2. Tool Plugin Shell UI

- [x] Build the first visible tool plugin screen.
- [x] Add title, loading state, empty/error state, and disabled send action area.
- [x] Do not add Storyblok communication yet.

Suggested commit:

```txt
feat: add tool plugin shell
```

## 3. App Bridge Context

- [x] Add the Storyblok App Bridge `postMessage` flow.
- [x] Request the current Storyblok context.
- [x] Listen for Storyblok messages.
- [x] Resize the iframe.
- [x] Display the current story name when available.

Suggested commit:

```txt
feat: read story context from storyblok app bridge
```

## 4. Local Mock Mode

- [x] Add a development fallback or mock context.
- [x] Make the plugin testable outside Storyblok.
- [x] Keep the mock mode useful for article screenshots and local iteration.

Suggested commit:

```txt
feat: add local mock context for development
```

## 5. Backend API Skeleton

- [ ] Add `GET /api/config`.
- [ ] Add `POST /api/trigger-webhook`.
- [ ] Return mocked responses first.
- [ ] Establish the client/server contract before adding real Storyblok API logic.

Suggested commit:

```txt
feat: add backend api route skeleton
```

## 6. Client API Integration

- [ ] Wire the Svelte UI to call `/api/config`.
- [ ] Show configured, missing setup, and auth-required states.
- [ ] Call `/api/trigger-webhook` from the send button.

Suggested commit:

```txt
feat: connect plugin ui to backend api
```

## 7. Storyblok Datasource Lookup

- [ ] Implement real datasource lookup through the Storyblok Management API.
- [ ] Read datasource slug `send-to-flowmotion-config`.
- [ ] Read entry name `webhook_url`.
- [ ] Handle missing datasource and missing entry states.

Suggested commit:

```txt
feat: load flowmotion webhook config from storyblok datasource
```

## 8. OAuth / Session Handling

- [ ] Add Storyblok OAuth/session handling needed by Management API calls.
- [ ] Store and validate the session server-side.
- [ ] Return an authentication-required state when no valid session exists.

Suggested commit:

```txt
feat: add storyblok oauth session handling
```

## 9. Webhook Forwarding

- [ ] Implement real Flowmotion webhook forwarding in `POST /api/trigger-webhook`.
- [ ] Use the story context payload from the frontend.
- [ ] Resolve the configured webhook URL on the backend.
- [ ] Return success and failure responses for the UI.

Suggested commit:

```txt
feat: forward story payload to flowmotion webhook
```

## 10. Security Hardening

- [ ] Validate request payloads.
- [ ] Avoid exposing the webhook URL to the browser where possible.
- [ ] Keep secrets and private config server-side.
- [ ] Improve backend error handling and user-facing error messages.

Suggested commit:

```txt
chore: harden webhook and config handling
```

## 11. Polish Plugin UX

- [ ] Finalize loading, success, failure, missing setup, and auth-required states.
- [ ] Make the UI compact and suitable for the Storyblok Visual Editor tools panel.
- [ ] Ensure the button states and messages are clear.

Suggested commit:

```txt
feat: polish tool plugin editor states
```

## 12. Production Readiness

- [ ] Add environment variable documentation.
- [ ] Add deployment notes for Vercel or Netlify.
- [ ] Add Storyblok plugin registration notes.
- [ ] Update the README with the final setup flow.

Suggested commit:

```txt
docs: document setup and deployment
```

## 13. Final Verification

- [ ] Local HTTPS works.
- [ ] The iframe loads in Storyblok.
- [ ] App Bridge returns story context.
- [ ] The config datasource is read.
- [ ] The Flowmotion webhook is triggered.
- [ ] Missing config and auth-required states work.

Suggested commit:

```txt
test: verify storyblok tool plugin flow
```
