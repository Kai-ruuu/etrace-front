import { PUBLIC_API_URL } from '$env/static/public';

export function apiUrl(path) {
    return PUBLIC_API_URL + path;
}

async function handle(res, data, onSuccess, onFail) {
    if (res.ok) {
        if (onSuccess) await onSuccess(data, res.status);
    } else {
        if (onFail) await onFail(data, res.status);
    }
}

async function call(path, {
    data = null,
    query = null,
    method = 'GET',
    json = true,
    to = 'json',
    credentials = true,
    onStart,
    onFinish,
    onSuccess,
    onFail
} = {}) {
    try {
        if (onStart) onStart();

        let options = {
            method,
            credentials: credentials ? 'include' : 'omit',
            headers: json ? { 'Content-Type': 'application/json' } : {},
        };

        if (method !== 'GET' && data) {
            options.body = json ? JSON.stringify(data) : data;
        }

        let finalQuery = '';
        if (method === 'GET' && query !== null) {
            finalQuery = '?' + new URLSearchParams(query).toString();
        }

        const res = await fetch(apiUrl(path) + finalQuery, options);
        let parsed = null;

        switch (to) {
            case 'json':
                parsed = await res.json();
                break;
            case 'text':
                parsed = await res.text();
                break;
        }
        
        await handle(res, parsed, onSuccess, onFail);
    } catch (error) {
        console.error(error);
    } finally {
        if (onFinish) onFinish();
    }
}

export async function get(path, { query = null, onStart, onFinish, onSuccess, onFail, to, credentials = true } = {}) {
    await call(path, { query, data: null, credentials, json: false, onStart, onFinish, onSuccess, onFail});
}

export async function postJson(path, data = null, { onStart, onFinish, onSuccess, onFail, to, credentials = true } = {}) {
    await call(path, { method: 'POST', data: data, credentials, onStart, onFinish, onSuccess, onFail});
}

export async function patchJson(path, data = null, { onStart, onFinish, onSuccess, onFail, to, credentials = true } = {}) {
    await call(path, { method: 'PATCH', data: data, credentials, onStart, onFinish, onSuccess, onFail});
}

export async function deleteJson(path, data = null, { onStart, onFinish, onSuccess, onFail, to, credentials = true } = {}) {
    await call(path, { method: 'DELETE', data: data, credentials, onStart, onFinish, onSuccess, onFail});
}

export async function postForm(path, data = null, { onStart, onFinish, onSuccess, onFail, to, credentials = true } = {}) {
    await call(path, { method: 'POST', data: data, credentials, json: false, onStart, onFinish, onSuccess, onFail});
}

export async function patchForm(path, data = null, { onStart, onFinish, onSuccess, onFail, to, credentials = true } = {}) {
    await call(path, { method: 'PATCH', data: data, credentials, json: false, onStart, onFinish, onSuccess, onFail});
}

export async function deleteForm(path, data = null, { onStart, onFinish, onSuccess, onFail, to, credentials = true } = {}) {
    await call(path, { method: 'DELETE', data: data, credentials, json: false, onStart, onFinish, onSuccess, onFail});
}

export function queryToString(queryObject) {
    return new URLSearchParams(queryObject).toString();
}

export async function geocode(address) {
    try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', address);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '1');

        const res = await fetch(url, {
            headers: { 'User-Agent': 'E-trace+' },
        });

        const results = await res.json();

        if (results.length) {
            const { lat, lon, display_name } = results[0];
            return [parseFloat(lat), parseFloat(lon), display_name];
        }
    } catch (_) {}

    // Fallback to Photon
    try {
        const url = new URL('https://photon.komoot.io/api/');
        url.searchParams.set('q', address);
        url.searchParams.set('limit', '1');

        const res = await fetch(url);
        const data = await res.json();

        if (!data.features?.length) {
            return 'Address not found. Try being more specific.';
        }

        const [lon, lat] = data.features[0].geometry.coordinates;
        const { name, city, country } = data.features[0].properties;
        const display_name = [name, city, country].filter(Boolean).join(', ');

        return [lat, lon, display_name];
    } catch (_) {
        return "Unable to search address.";
    }
}