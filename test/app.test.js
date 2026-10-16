import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.js';

describe('HTTP application smoke tests', () => {
    const app = createApp('test');
    let server;
    let baseUrl;

    before(async () => {
        await new Promise(resolve => {
            server = app.listen(0, '127.0.0.1', resolve);
        });
        baseUrl = `http://127.0.0.1:${server.address().port}`;
    });

    after(async () => {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    });

    it('renders the home page', async () => {
        const response = await fetch(baseUrl);
        const html = await response.text();

        assert.equal(response.status, 200);
        assert.match(html, /Welcome to the CSE 340 Service Network/);
    });

    it('serves the site stylesheet and logo', async () => {
        for (const asset of ['/css/main.css', '/images/cse340-service-network.png']) {
            const response = await fetch(`${baseUrl}${asset}`);
            assert.equal(response.status, 200, `${asset} should be served`);
        }
    });

    it('exposes a health check', async () => {
        const response = await fetch(`${baseUrl}/healthz`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { status: 'ok' });
    });

    it('renders a not-found page for unknown paths', async () => {
        const response = await fetch(`${baseUrl}/not-a-real-page`);
        assert.equal(response.status, 404);
        assert.match(await response.text(), /Page Not Found/);
    });
});
