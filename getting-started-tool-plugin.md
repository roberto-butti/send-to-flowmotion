# Creating Your First Storyblok Tool Plugin with App Bridge

This guide walks through how to build a tool plugin, register it in Storyblok, and connect it to the editor using App Bridge. By the end, your plugin will read the current story context directly from the Visual Editor.

## What is a Tool Plugin?

A tool plugin is a custom web application that runs inside the Storyblok Visual Editor. It appears in the Tools panel when you edit a story.

Your plugin is a standalone web app, hosted on your own server, loaded by Storyblok in an iframe. It can be built with any framework: React, Vue, plain HTML, Laravel, Next.js, anything that renders in a browser.

Typical use cases: exporting content, bulk operations, analytics on the current story, custom editing tools.

To communicate with the editor, your plugin needs App Bridge.

## What is App Bridge?

Your plugin runs in an iframe. The browser sandbox prevents it from accessing the parent page directly, including the story currently being edited. The only way to pass data across that boundary is `window.postMessage`.

App Bridge is the communication layer that wraps this mechanism. It defines a message protocol: each message has an `action` field that identifies the intent, a `tool` field with your plugin slug, and an `event` field with optional payload data. Instead of implementing this protocol yourself, App Bridge handles the exchange between your plugin and the Storyblok editor.

With App Bridge, your plugin can:

- Read the current story being edited (name, slug, content)
- Know which space and language the editor is working in
- Resize its own iframe to fit the content
- React to changes in the editor

App Bridge does not require OAuth. It works out of the box for read-only interactions with the editor context. OAuth becomes necessary only when your plugin needs to call the Storyblok Management API (creating, updating, or deleting content).

With that in mind, here is what you need before getting started.

## Prerequisites

- A Storyblok account with a paid plan (tool plugins are a premium feature)
- A web application served over HTTPS

Storyblok runs on HTTPS, and browsers block mixed content, so your plugin URL must also be HTTPS. HTTP will not work, including plain `http://localhost`.

For your own development and testing, a local HTTPS setup is enough. You can use mkcert to generate a locally trusted certificate, or a local proxy like Caddy that handles HTTPS automatically.

For editors or other people to use the plugin, the URL must be publicly accessible. In that case, use a tunnel (ngrok, Cloudflare Tunnel) or deploy to a hosted environment.

With those in place, start by building the plugin itself.

## Step 1: Create a simple web app

You need a page that renders at the root URL of your application. The framework does not matter. The App Bridge logic is pure JavaScript and works in any environment that runs in a browser.

Here is the minimal plugin code:

```tsx
import { useCallback, useEffect, useState } from 'react';

// This must match your plugin slug in Storyblok
const PLUGIN_SLUG = 'your-org@your-plugin-slug';

function postToStoryblok(event: string, data: Record<string, unknown> = {}) {
    window.parent.postMessage(
        {
            action: 'tool-changed',
            tool: PLUGIN_SLUG,
            event,
            ...data,
        },
        '*',
    );
}

export default function ToolPlugin() {
    const [context, setContext] = useState(null);

    const handleMessage = useCallback((event: MessageEvent) => {
        const { action, story, spaceId, language } = event.data || {};

        if (action === 'get-context' || action === 'loaded' || story) {
            setContext({ story, spaceId, language });
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleMessage);

        // Tell Storyblok how tall the iframe should be
        postToStoryblok('heightChange', { height: 300 });

        // Ask Storyblok for the current story context
        postToStoryblok('getContext');

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);

    return (
        <div>
            <h1>Hello from my Tool Plugin</h1>
            {context?.story ? (
                <p>Editing story: {context.story.name}</p>
            ) : (
                <p>Waiting for story context...</p>
            )}
        </div>
    );
}
```

Three things happen when the plugin loads:

1. **`heightChange`** tells Storyblok how many pixels the iframe needs. Without this, the iframe may collapse to zero height.
2. **`getContext`** asks Storyblok to send back the current story data.
3. **`message` listener** receives the response from Storyblok with the story, space ID, and language.

With the plugin code ready, register it in Storyblok so the editor knows where to load it from.

## Step 2: Register the plugin in Storyblok

1. Go to your Storyblok space.
2. Navigate to **Settings > Apps > Tool Plugins** (or the equivalent section for your plan).
3. Click **New Tool Plugin**.
4. Fill in the details:
   - **Name**: a human-readable name (e.g., "My Tool Plugin")
   - **Slug**: a unique identifier (e.g., `your-org@my-tool-plugin`). This must match the `PLUGIN_SLUG` constant in your code.
   - **URL**: the HTTPS URL where your app is hosted (e.g., `https://my-plugin.test/`)

With the plugin registered, one final configuration step is needed before testing.

## Step 3: Enable App Bridge

In the plugin settings, find the **"Use App Bridge"** toggle and enable it.

Without this toggle, Storyblok performs a full-page redirect to your plugin URL with an `init_oauth=true` query parameter. This is the OAuth initialization flow, and your plugin gets loaded outside the editor in a new page, not in an iframe.

When you enable App Bridge, Storyblok skips the OAuth redirect and loads your plugin directly in the iframe. For a plugin that does not need Management API access, this is the correct mode.

The plugin is now configured. Time to test it in the editor.

## Step 4: Test it

1. Start your development server (your app must be accessible via HTTPS).
2. Open a story in the Storyblok Visual Editor.
3. Click on the **"Tools"** tab in the sidebar.
4. Your plugin should appear, loaded inside the editor.

If the plugin loads correctly, you will see it display the current story name, slug, and ID.

Now that the plugin is running, it is useful to understand how the message exchange between your plugin and the editor works in detail.

## How postMessage communication works

All communication between your plugin and Storyblok happens through `window.postMessage`. Your plugin runs in an iframe, so `window.parent` refers to the Storyblok editor.

### Sending messages to Storyblok

Every message to Storyblok follows this structure:

```js
window.parent.postMessage({
    action: 'tool-changed',
    tool: 'your-plugin-slug',  // must match your slug
    event: 'eventName',
    // ... additional data depending on the event
}, '*');
```

### Key events you can send

| Event | Purpose | Additional data |
|---|---|---|
| `heightChange` | Resize the iframe | `{ height: 400 }` |
| `getContext` | Request the current story context | none |

### Receiving messages from Storyblok

Listen for `message` events on `window`. Storyblok sends messages with the story data, space ID, and current language.

```js
window.addEventListener('message', (event) => {
    const { action, story, spaceId, language } = event.data;
    // Use the data
});
```

Understanding the message flow also helps clarify when you need OAuth and when you can skip it.

## When you need OAuth (and when you don't)

**You don't need OAuth** if your plugin only:
- Reads the current story context from the editor
- Displays information or UI based on that context
- Communicates with your own backend using your own authentication

**You need OAuth** when your plugin needs to:
- Call the Storyblok Management API (create, update, delete stories)
- Access other spaces or resources on behalf of the user
- Perform actions that require a Storyblok access token

OAuth adds complexity: an authorization flow, token storage, and token refresh. For a first version or proof of concept, start without it. Add OAuth only when you need Management API access.

If something is not working as expected, the issues below cover the most common causes.

## Troubleshooting

### Plugin loads in a full page instead of the iframe

Make sure **"Use App Bridge"** is enabled in the plugin settings. Without it, Storyblok redirects to your URL with `init_oauth=true` and your app loads outside the editor.

### Iframe is blank or collapsed

Your plugin must send a `heightChange` event on load. Without it, the iframe has no height and appears invisible.

```js
postToStoryblok('heightChange', { height: 300 });
```

### "Waiting for story context" never resolves

Check that the `PLUGIN_SLUG` in your code matches the slug in Storyblok settings. If they don't match, Storyblok ignores the `getContext` request.

### Plugin blocked by X-Frame-Options

If your server sends `X-Frame-Options: SAMEORIGIN` (common in many frameworks), the browser blocks the iframe. Remove or override that header for your plugin route. Replace it with a `Content-Security-Policy: frame-ancestors https://app.storyblok.com` header so only Storyblok can embed your app.
