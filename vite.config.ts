// @ts-nocheck
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const keyPath = new URL('./.cert/localhost-key.pem', import.meta.url);
const certPath = new URL('./.cert/localhost-cert.pem', import.meta.url);
const hasLocalCertificate = existsSync(keyPath) && existsSync(certPath);

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	ssr: {
		noExternal: ['@storyblok/app-extension-auth']
	},
	server: hasLocalCertificate
		? {
				https: {
					key: readFileSync(keyPath),
					cert: readFileSync(certPath)
				}
			}
		: undefined
});
