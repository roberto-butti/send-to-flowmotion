# Send to Flowmotion

Storyblok Tool Plugin built with SvelteKit.

The plugin is designed to run inside the Storyblok Visual Editor Tools panel, read the current story context, and send that story payload to a configured Flowmotion webhook.

## Local HTTPS Development

Storyblok loads Tool Plugins inside an iframe from the Visual Editor, so the local development server must be available over HTTPS.

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
