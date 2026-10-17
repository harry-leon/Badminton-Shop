/**
 * HTTP Client Helper for E2E Tests
 * Supports GET, POST, PATCH, PUT, DELETE with cookie management
 */

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function request(method, path, body = null, headers = {}, timeout = 10000) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const reqHeaders = { ...headers };
    if (payload && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: reqHeaders,
      timeout,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}

        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
          text: data,
          cookies: res.headers['set-cookie'] || [],
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 408,
        error: 'Request timed out after ' + timeout + 'ms',
        headers: {},
        data: null,
        text: '',
        cookies: [],
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        error: err.message,
        headers: {},
        data: null,
        text: '',
        cookies: [],
      });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

module.exports = {
  get: (path, headers) => request('GET', path, null, headers),
  post: (path, body, headers) => request('POST', path, body, headers),
  patch: (path, body, headers) => request('PATCH', path, body, headers),
  put: (path, body, headers) => request('PUT', path, body, headers),
  del: (path, body, headers) => request('DELETE', path, body, headers),
  BASE_URL,
};
