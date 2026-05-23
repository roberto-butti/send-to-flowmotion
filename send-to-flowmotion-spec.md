# Send to Flowmotion Tool Plugin Specification

## Purpose

Build a Storyblok Tool Plugin named **Send to Flowmotion**.

The plugin appears in the Storyblok Visual Editor Tools panel. It reads the current story context, checks whether the space has been configured with a Flowmotion webhook URL, and lets an editor send the current story payload to Flowmotion.

## Recommended Stack

- SvelteKit
- TypeScript
- `@storyblok/app-extension-auth` for Storyblok OAuth and app session handling
- Server routes for Storyblok Management API calls and webhook forwarding
- Deployable to Netlify or Vercel

## Storyblok Plugin Details

- Plugin name: `Send to Flowmotion`
- Plugin slug: `your-org@send-to-flowmotion`
- Tool plugin URL: deployed SvelteKit app URL
- App Bridge: enabled
- OAuth: required, because the plugin reads a Storyblok datasource through the Management API

## Storyblok Datasource Configuration

The plugin expects a datasource in the current Storyblok space.

- Datasource slug: `send-to-flowmotion-config`
- Required entry name: `webhook_url`
- Required entry value: the Flowmotion webhook URL

Example:

```txt
Datasource: send-to-flowmotion-config

Entry:
Name: webhook_url
Value: https://your-flowmotion-webhook.example.com/...
```

The webhook URL should not contain secrets if the datasource is editable by many users. If the Flowmotion URL includes secret tokens, consider storing only a profile key in Storyblok and resolving the actual URL server-side.

## User Experience

### Loading State

When opened in the Visual Editor:

```txt
Loading Send to Flowmotion...
```

The app should:

1. Set the iframe height through App Bridge.
2. Request the current Storyblok context.
3. Validate that the backend has an OAuth session for the current space/user.
4. Check the datasource configuration.

### Configured State

If the datasource exists and contains `webhook_url`, show:

```txt
Send to Flowmotion

Story: {story.name}

[Send to Flowmotion]
```

After a successful webhook call:

```txt
Story sent to Flowmotion.
```

### Missing Setup State

If the datasource or entry is missing, show:

```txt
Please set up Send to Flowmotion.

Create a Storyblok datasource with this slug:
send-to-flowmotion-config

Then add this entry:
Name: webhook_url
Value: your Flowmotion webhook URL
```

### Authentication Required State

If OAuth has not been completed yet, show a button:

```txt
Connect Storyblok
```

Clicking it starts the Storyblok OAuth authorization flow.

## App Bridge Behavior

The frontend communicates with Storyblok using `window.postMessage`.

Messages sent to Storyblok must use the tool plugin format:

```ts
window.parent.postMessage(
  {
    action: 'tool-changed',
    tool: 'your-org@send-to-flowmotion',
    event: 'heightChange',
    height: 420
  },
  '*'
);
```

Request context:

```ts
window.parent.postMessage(
  {
    action: 'tool-changed',
    tool: 'your-org@send-to-flowmotion',
    event: 'getContext'
  },
  '*'
);
```

Expected context response:

```ts
{
  action: 'get-context',
  story: {
    id: number,
    uuid: string,
    name: string,
    slug: string,
    full_slug: string,
    content: Record<string, unknown>
  },
  spaceId: number | string,
  language: string
}
```

The plugin can also request an App Bridge validation token:

```ts
window.parent.postMessage(
  {
    action: 'tool-changed',
    tool: 'your-org@send-to-flowmotion',
    event: 'validate'
  },
  '*'
);
```

Expected validation response:

```ts
{
  action: 'validated',
  token: '...'
}
```

The frontend should send this token to backend routes using:

```txt
X-App-Bridge-Token: {token}
```

## OAuth Requirements

OAuth is required because the backend must read datasource entries through the Storyblok Management API.

Use Storyblok's official helper package for the OAuth/session flow:

```txt
@storyblok/app-extension-auth
```

The package should handle the Storyblok OAuth authorization flow and provide the authenticated app session server-side. Backend routes should use the session's `accessToken`, `spaceId`, and `region` when calling the Management API.

Required environment variables:

```txt
STORYBLOK_CLIENT_ID=
STORYBLOK_CLIENT_SECRET=
PUBLIC_STORYBLOK_TOOL_PLUGIN_SLUG=your-org@send-to-flowmotion
PUBLIC_APP_URL=https://your-plugin.example.com
STORYBLOK_OAUTH_REDIRECT_URI=https://your-plugin.example.com/oauth/callback
STORYBLOK_DATASOURCE_SLUG=send-to-flowmotion-config
STORYBLOK_WEBHOOK_ENTRY_NAME=webhook_url
```

The OAuth redirect URI for a Tool Plugin should follow Storyblok's Tool Plugin OAuth flow. Storyblok documents the Tool Plugin redirect target as:

```txt
https://app.storyblok.com/oauth/tool_redirect
```

The app must store OAuth tokens server-side. Tokens must not be exposed to the browser. Prefer the session helpers from `@storyblok/app-extension-auth` instead of manually handling raw tokens in application code.

Any custom session/token storage should be keyed by:

```txt
space_id
user_id
```

For local prototyping, in-memory storage is acceptable. For Netlify/Vercel production deployments, use durable storage such as:

- Vercel KV
- Netlify Blobs
- Supabase
- Upstash Redis
- another small database

Do not rely on process memory for OAuth sessions in production serverless deployments.

## Backend Routes

### `GET /api/config`

Purpose:

- Verify the App Bridge token.
- Resolve the current `space_id` and `user_id`.
- Load the authenticated Storyblok app session using `@storyblok/app-extension-auth`.
- Read the Storyblok datasource.
- Return whether the plugin is configured.

Request headers:

```txt
X-App-Bridge-Token: {token}
```

Success response:

```json
{
  "authenticated": true,
  "configured": true
}
```

Missing setup response:

```json
{
  "authenticated": true,
  "configured": false,
  "setup": {
    "datasourceSlug": "send-to-flowmotion-config",
    "webhookEntryName": "webhook_url"
  },
  "missing": [
    "Add a datasource entry named webhook_url."
  ]
}
```

Unauthenticated response:

```json
{
  "authenticated": false,
  "configured": false,
  "connectUrl": "/oauth/start?space_id=..."
}
```

### `POST /api/trigger-webhook`

Purpose:

- Verify the App Bridge token.
- Load the authenticated Storyblok app session using `@storyblok/app-extension-auth`.
- Load the configured Flowmotion webhook URL from the datasource.
- Forward the current story payload to Flowmotion.

Request body:

```json
{
  "story": {},
  "spaceId": "12345",
  "language": "default"
}
```

Forwarded payload:

```json
{
  "plugin": "your-org@send-to-flowmotion",
  "story": {},
  "spaceId": "12345",
  "language": "default",
  "triggeredAt": "2026-05-23T00:00:00.000Z"
}
```

Success response:

```json
{
  "sent": true
}
```

Failure response:

```json
{
  "sent": false,
  "error": "Flowmotion webhook returned status 500."
}
```

## Storyblok Management API Usage

The backend should use the OAuth access token from the `@storyblok/app-extension-auth` session. OAuth access tokens require the `Bearer` prefix:

```txt
Authorization: Bearer {access_token}
```

Datasource lookup:

```txt
GET /v1/spaces/{space_id}/datasource_entries?datasource_slug=send-to-flowmotion-config
```

The app should find the entry where:

```txt
name === webhook_url
```

and use its `value` as the Flowmotion webhook URL.

## Security Requirements

- Never expose Storyblok OAuth tokens to frontend code.
- Never expose `STORYBLOK_CLIENT_SECRET` to frontend code.
- Verify App Bridge tokens server-side before accepting requests from the iframe.
- Forward webhook calls from a server route, not directly from the browser.
- Set iframe permissions with a CSP header:

```txt
Content-Security-Policy: frame-ancestors https://app.storyblok.com
```

- Do not send `X-Frame-Options: SAMEORIGIN`, because Storyblok must be able to iframe the plugin.

## SvelteKit Suggested Structure

```txt
src/routes/+page.svelte
src/routes/api/config/+server.ts
src/routes/api/trigger-webhook/+server.ts
src/routes/oauth/start/+server.ts
src/routes/oauth/callback/+server.ts
src/lib/app-bridge.ts
src/lib/server/storyblok-auth.ts
src/lib/server/storyblok-management.ts
src/lib/server/session-store.ts
src/hooks.server.ts
```

## Implementation Phases

### Phase 1

- Create SvelteKit app.
- Build the iframe UI.
- Implement App Bridge context loading.
- Show current story name.

### Phase 2

- Add OAuth start/callback routes using `@storyblok/app-extension-auth`.
- Configure durable session storage for deployed environments.
- Add App Bridge token validation for backend requests.

### Phase 3

- Read `send-to-flowmotion-config` datasource.
- Detect missing datasource or missing `webhook_url`.
- Show setup instructions.

### Phase 4

- Add `POST /api/trigger-webhook`.
- Send the current story payload to Flowmotion.
- Add success and error UI states.

### Phase 5

- Add production token storage.
- Deploy to Netlify or Vercel.
- Register the deployed URL in Storyblok.
