# Send to Flowmotion

Storyblok Tool Plugin built with SvelteKit to manually trigger a Flowmotion workflow from the Storyblok Visual Editor.

## Why This Plugin Exists

Storyblok webhooks are a good fit for automation. They can trigger external systems when a specific event happens, such as a workflow stage change, an image upload, or a content publication. That model works well when the process should run automatically.

Some editorial workflows need more control. An author may want to trigger a Flowmotion workflow only for a specific story, at a specific moment, and for a specific purpose, such as publishing content to LinkedIn, sending a notification, exporting content to another system, or starting a custom review process.

This Tool Plugin gives editors a manual action inside the Storyblok Visual Editor. It reads the current story context and sends that story as the payload to a configured Flowmotion webhook.

That simplifies the Flowmotion workflow because the content data is already included in the payload. In many cases, the workflow does not need extra nodes only to retrieve the story, resolve the content, or look up the current item again.

This repository is an open-source starting point. Before using the same approach in production, review the security model for your use case. The README includes production and security notes, and the related article explains the main implementation considerations.

## Environment Variables

Create a `.env` file for local development and configure the same values in your deployment platform for production.

| Variable                            | Required | Scope          | Description                                                                                                               |
| ----------------------------------- | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_STORYBLOK_TOOL_PLUGIN_SLUG` | Yes      | Browser/server | Tool Plugin slug configured in Storyblok, for example `your-org@send-to-flowmotion`.                                      |
| `PUBLIC_DEBUG_APP_BRIDGE`           | No       | Browser        | Enables App Bridge console logging. Keep this `false` in production.                                                      |
| `PUBLIC_ENABLE_MOCK_CONTEXT`        | No       | Browser        | Enables local mock story data outside Storyblok. Keep this `false` in production.                                         |
| `APP_CLIENT_ID`                     | Yes      | Server         | Client ID from the Storyblok app OAuth settings.                                                                          |
| `APP_CLIENT_SECRET`                 | Yes      | Server         | Client secret from the Storyblok app OAuth settings. Keep this server-side only.                                          |
| `APP_URL`                           | Yes      | Server         | Absolute HTTPS base URL for this plugin app. Use `https://localhost:5173` locally and the deployed app URL in production. |

Example local values:

```sh
PUBLIC_STORYBLOK_TOOL_PLUGIN_SLUG=your-org@send-to-flowmotion
PUBLIC_DEBUG_APP_BRIDGE=false
PUBLIC_ENABLE_MOCK_CONTEXT=false
APP_CLIENT_ID=your-storyblok-app-client-id
APP_CLIENT_SECRET=your-storyblok-app-client-secret
APP_URL=https://localhost:5173
```

## Local HTTPS Development

Storyblok loads Tool Plugins inside an iframe from the Visual Editor, so the local development server must be available over HTTPS.

Set `PUBLIC_DEBUG_APP_BRIDGE=true` when you need to inspect App Bridge messages in the browser console.
Set `PUBLIC_ENABLE_MOCK_CONTEXT=true` when you want the plugin to show local mock story data outside Storyblok.

The `APP_*` variables are used by the official Storyblok OAuth helper:

- `APP_CLIENT_ID`: Client ID from the Storyblok app OAuth settings.
- `APP_CLIENT_SECRET`: Client secret from the Storyblok app OAuth settings. Keep this server-side only.
- `APP_URL`: Absolute HTTPS base URL for this plugin app.

Register this OAuth callback URL in the Storyblok app settings:

```txt
https://localhost:5173/api/connect/callback
```

The sign-in URL remains:

```txt
https://localhost:5173/api/connect/storyblok
```

This project uses local certificate files from `.cert/` when they exist:

- `.cert/localhost-key.pem`
- `.cert/localhost-cert.pem`

Create trusted local certificates with `mkcert`:

```sh
mkcert -install
mkdir -p .cert
mkcert -key-file .cert/localhost-key.pem -cert-file .cert/localhost-cert.pem localhost 127.0.0.1 ::1
```

Then start the development server:

```sh
npm run dev
```

Open:

```txt
https://localhost:5173
```

If the browser shows `net::ERR_CERT_AUTHORITY_INVALID`, the certificate authority is not trusted yet. Run `mkcert -install` from your normal terminal, restart the dev server, and reload the browser.

## Storyblok Setup

Create or configure a Storyblok Tool Plugin for this app:

1. Set the plugin slug to the same value used in `PUBLIC_STORYBLOK_TOOL_PLUGIN_SLUG`.
2. Enable App Bridge for the Tool Plugin.
3. Enable OAuth for the app.
4. Set the Tool Plugin URL to the local or deployed app URL.
5. Register the OAuth callback URL:

```txt
https://your-plugin.example.com/api/connect/callback
```

For local HTTPS development, use:

```txt
https://localhost:5173/api/connect/callback
```

The OAuth sign-in URL is:

```txt
https://your-plugin.example.com/api/connect/storyblok
```

For local HTTPS development, use:

```txt
https://localhost:5173/api/connect/storyblok
```

## Flowmotion Webhook Settings

Enable space-level settings for the installed Tool Plugin in Storyblok. In each Storyblok space that uses the plugin, add:

```txt
webhook_url=https://your-flowmotion-webhook.example.com/...
http_method=POST
```

The backend reads these values through the Storyblok Management API using the authenticated OAuth session. The webhook URL is not returned to the browser.

Storyblok space-level settings are intended for configuration, not sensitive secrets. If your Flowmotion webhook URL contains private tokens, consider storing only a profile key in Storyblok and resolving the actual secret URL server-side.

## Deploying

This app uses SvelteKit. Install and configure the adapter required by your hosting platform before production deployment.

For Vercel:

```sh
npm install -D @sveltejs/adapter-vercel
```

For Netlify:

```sh
npm install -D @sveltejs/adapter-netlify
```

Then update `svelte.config.js` to use the selected adapter.

Deployment checklist:

- Deploy the app over HTTPS.
- Set all required environment variables in the hosting platform.
- Set `APP_URL` to the deployed app URL.
- Keep `PUBLIC_DEBUG_APP_BRIDGE=false` in production.
- Keep `PUBLIC_ENABLE_MOCK_CONTEXT=false` in production.
- Update the Storyblok Tool Plugin URL to the deployed app URL.
- Update the Storyblok OAuth callback URL to `https://your-plugin.example.com/api/connect/callback`.

## Production Notes

- Storyblok OAuth tokens and the OAuth client secret must stay server-side.
- Webhook forwarding is handled by `/api/trigger-webhook`, not by browser-side calls to Flowmotion.
- The current OAuth/session setup should be reviewed before serverless production. Use durable session storage for production deployments when required by your hosting model.
- App Bridge token validation is a recommended hardening step before production use.
- Do not send `X-Frame-Options: SAMEORIGIN`; Storyblok must be able to load the plugin in an iframe.

## Verification Checklist

- The deployed app loads over HTTPS.
- Storyblok can load the Tool Plugin in the Visual Editor iframe.
- OAuth connect completes successfully.
- The Visual Editor sends the current story context.
- `/api/config` reads the Storyblok space-level settings.
- Missing setup and auth-required states display correctly.
- The send button triggers the configured Flowmotion webhook.

## Developing

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
