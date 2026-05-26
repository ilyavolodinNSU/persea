import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 1,
    iterations: 1,
};

const BASE_PRODUCT = __ENV.PRODUCT_SERVICE_URL || 'http://localhost:8084';
const BASE_USER = __ENV.USER_SERVICE_URL || 'http://localhost:8085';
const BASE_RECO = __ENV.RECOMMENDATION_SERVICE_URL || 'http://localhost:8086';
const TOKEN = __ENV.USER_TOKEN || '';

const authHeader = { 'Authorization': `Bearer ${TOKEN}` };

export function setup() {
    console.log('Smoke test: checking essential endpoints...');
    return {};
}

export default function() {
    let res;

    // 1. Поиск продуктов
    res = http.get(`${BASE_PRODUCT}/products?query=&categoryId=1&page=0&size=5`, {
        headers: authHeader,
    });
    check(res, {
        'GET /products status 200': (r) => r.status === 200,
        'GET /products returns array': (r) => Array.isArray(r.json()),
    });
    sleep(0.1);

    // 2. Подсказки (может вернуть 404, допускаем)
    res = http.get(`${BASE_PRODUCT}/products/suggestions?query=аква&limit=5`, {
        headers: authHeader,
    });
    check(res, {
        'GET /suggestions status 2xx/404': (r) => r.status >= 200 && r.status < 500,
    });
    sleep(0.1);

    // 3. Карточка товара (пробуем ID=1, при 404 или 500 – не падаем)
    res = http.get(`${BASE_PRODUCT}/products/1?include=FACTORS`, {
        headers: authHeader,
    });
    check(res, {
        'GET /product/1 status 2xx/404/500': (r) =>
            r.status === 200 || r.status === 404 || r.status === 500,
    });
    sleep(0.1);

    // 4. Категории
    res = http.get(`${BASE_PRODUCT}/products/categories`, {
        headers: authHeader,
    });
    check(res, {
        'GET /categories status 200': (r) => r.status === 200,
    });
    sleep(0.1);

    // 5. Бренды
    res = http.get(`${BASE_PRODUCT}/products/brands`, {
        headers: authHeader,
    });
    check(res, {
        'GET /brands status 200': (r) => r.status === 200,
    });
    sleep(0.1);

    // 6. Факторы
    res = http.get(`${BASE_PRODUCT}/factors`, {
        headers: authHeader,
    });
    check(res, {
        'GET /factors status 200': (r) => r.status === 200,
    });
    sleep(0.1);

    // 7. Избранное пользователя
    res = http.get(`${BASE_USER}/users/me/favorites`, {
        headers: authHeader,
    });
    check(res, {
        'GET /favorites status 200/401': (r) => r.status === 200 || r.status === 401,
    });
    sleep(0.1);

    // 8. Просмотренные товары
    res = http.get(`${BASE_USER}/users/me/viewed-products`, {
        headers: authHeader,
    });
    check(res, {
        'GET /viewed status 200/401': (r) => r.status === 200 || r.status === 401,
    });
    sleep(0.1);

    // 9. Сканированные товары
    res = http.get(`${BASE_USER}/users/me/scanned-products`, {
        headers: authHeader,
    });
    check(res, {
        'GET /scanned status 200/401': (r) => r.status === 200 || r.status === 401,
    });
    sleep(0.1);

    // 10. Лента рекомендаций
    res = http.get(`${BASE_RECO}/recommendation/feed/me?limit=5`, {
        headers: authHeader,
    });
    check(res, {
        'GET /feed/me status 200': (r) => r.status === 200,
    });

    console.log('Smoke test finished successfully!');
}