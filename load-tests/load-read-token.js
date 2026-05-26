import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 0 },
    ],
    thresholds: {
        'http_req_duration{endpoint:products}': ['p(95)<500'],
        'http_req_duration{endpoint:feed}': ['p(95)<1000'],
        'http_req_failed': ['rate<0.01'],
    },
};

const BASE_PRODUCT = __ENV.PRODUCT_SERVICE_URL || 'http://localhost:8084';
const BASE_USER = __ENV.USER_SERVICE_URL || 'http://localhost:8085';
const BASE_RECO = __ENV.RECOMMENDATION_SERVICE_URL || 'http://localhost:8086';
const TOKEN = (__ENV.USER_TOKEN || '').trim().replace(/\r?\n|\r/g, '');

export function setup() {
    if (!TOKEN) throw new Error('USER_TOKEN is required');
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
    };

    // Проверяем, есть ли категория с id=1
    let res = http.get(`${BASE_PRODUCT}/products/categories`, { headers });
    let categories = res.status === 200 ? res.json() : [];
    if (!categories.some(c => c.id === 1)) {
        let createCat = http.post(`${BASE_PRODUCT}/products/categories`, JSON.stringify({ name: 'Test Category', code: 'TEST' }), { headers });
        console.log(`Created category: ${createCat.status}`);
    }

    // Проверяем, есть ли бренд с id=1
    res = http.get(`${BASE_PRODUCT}/products/brands`, { headers });
    let brands = res.status === 200 ? res.json() : [];
    if (!brands.some(b => b.id === 1)) {
        let createBrand = http.post(`${BASE_PRODUCT}/products/brands`, JSON.stringify({ name: 'Test Brand', description: 'desc' }), { headers });
        console.log(`Created brand: ${createBrand.status}`);
    }

    // Создаём 5 продуктов, если список продуктов пуст
    res = http.get(`${BASE_PRODUCT}/products?page=0&size=1`, { headers });
    let existing = res.status === 200 ? res.json() : [];
    if (existing.length === 0) {
        for (let i = 1; i <= 5; i++) {
            const body = {
                name: `Load Test Product ${i}`,
                categoryId: 1,
                brandId: 1,
                imageURI: 'http://example.com/img.png',
                numericFactors: [],
                booleanFactors: [],
                enumFactors: [],
            };
            let createRes = http.post(`${BASE_PRODUCT}/products`, JSON.stringify(body), { headers });
            console.log(`Create product ${i}: ${createRes.status} ${createRes.body}`);
        }
    }

    // Получаем ID созданных/существующих продуктов
    res = http.get(`${BASE_PRODUCT}/products?page=0&size=10`, { headers });
    const productIds = res.status === 200 ? res.json().map(p => p.id) : [];
    console.log(`Products available: ${productIds}`);
    return { productIds };
}

export default function(data) {
    const authHeader = { Authorization: `Bearer ${TOKEN}` };
    let res;

    // Поиск продуктов
    res = http.get(`${BASE_PRODUCT}/products?query=&categoryId=1&page=0&size=5`, {
        headers: authHeader,
        tags: { endpoint: 'products' },
    });
    check(res, { 'GET /products status 200': (r) => r.status === 200 });
    sleep(1);

    // Лента рекомендаций
    res = http.get(`${BASE_RECO}/recommendation/feed/me?limit=5`, {
        headers: authHeader,
        tags: { endpoint: 'feed' },
    });
    check(res, { 'GET /feed/me status 200': (r) => r.status === 200 });
    sleep(1);

    // Избранное – используем любой доступный productId
    const productId = data.productIds.length > 0 ? data.productIds[Math.floor(Math.random() * data.productIds.length)] : null;
    if (productId) {
        res = http.post(`${BASE_USER}/users/me/favorites/${productId}`, null, { headers: authHeader });
        check(res, { 'POST /favorites status 2xx': (r) => r.status >= 200 && r.status < 300 });
        if (res.status >= 200 && res.status < 300) {
            http.del(`${BASE_USER}/users/me/favorites/${productId}`, null, { headers: authHeader });
        }
    }
    sleep(0.5);

    // Просмотренные/сканированные
    http.get(`${BASE_USER}/users/me/viewed-products`, { headers: authHeader });
    http.get(`${BASE_USER}/users/me/scanned-products`, { headers: authHeader });
}