# Контракты 

## Общие сведения

**Микросервисы:**
- `product-service` — `http://localhost:8084` — каталог продуктов, брендов, категорий, факторов
- `user-service` — `http://localhost:8085` — действия пользователя, избранное
- `recommendation-service` — `http://localhost:8086` — персональная лента

**Аутентификация:**
- OAuth2 Resource Server, JWT
- Issuer: `http://localhost:8081/realms/persea`
- Заголовок: `Authorization: Bearer <access_token>`
- Роли: `APP_USER` (чтение),`MODERATOR` (запись), `ADMIN` (удаление)

---

## 1. Product Service

### Модели

#### ProductSearchDto
```json
{
  "id": 101,
  "name": "Акваника Детская (Aquanika Kids)",
  "rating": 92,
  "imageURI": "https://rskrf.ru/goods/voda-pitevaya-prirodnaya-artezianskaya-akvanika-detskaya-aquanika-kids/"
}
```

#### ProductResponse
```json
{
  "id": 101,
  "name": "Акваника Детская (Aquanika Kids)",
  "brand": { 
    "id": 1, 
    "name": "Акваника" 
  },
  "category": { 
    "id": 1, 
    "name": "Бутилированная вода", 
    "code": "WATER" 
  },
  "rating": 92,
  "imageURI": "https://rskrf.ru/goods/voda-pitevaya-prirodnaya-artezianskaya-akvanika-detskaya-aquanika-kids/",
  "numericFactors": [
    {
      "id": 501,
      "factorId": 1,
      "factorName": "Запах",
      "unitName": "баллы",
      "amount": 0.0,
      "minValue": 0.0,
      "maxValue": 0.0
    },
    {
      "id": 502,
      "factorId": 3,
      "factorName": "Цветность",
      "unitName": "градусы",
      "amount": 0.5,
      "minValue": 0.0,
      "maxValue": 5.0
    },
    {
      "id": 503,
      "factorId": 5,
      "factorName": "Хлориды",
      "unitName": "мг/л",
      "amount": 7.8,
      "minValue": 0.0,
      "maxValue": 150.0
    },
    {
      "id": 504,
      "factorId": 10,
      "factorName": "Общая минерализация (сухой остаток)",
      "unitName": "мг/л",
      "amount": 340.0,
      "minValue": 200.0,
      "maxValue": 500.0
    }
  ],
  "booleanFactors": [
    {
      "id": 601,
      "factorId": 100,
      "factorName": "Наличие лабораторного отчёта",
      "value": true,
      "impact": -45
    },
    {
      "id": 602,
      "factorId": 101,
      "factorName": "Наличие декларации ТР ЕАЭС 044/2017",
      "value": true,
      "impact": -5
    }
  ],
  "enumFactors": [
    {
      "id": 701,
      "factorId": 120,
      "factorName": "Тип источника воды",
      "enumValue": "Артезианская",
      "impact": 0
    },
    {
      "id": 702,
      "factorId": 121,
      "factorName": "Тип упаковки",
      "enumValue": "ПЭТ",
      "impact": -20
    }
  ]
}
```

#### BrandDto
```json
{ 
  "id": 1, 
  "name": "Акваника", 
  "description": "ООО \"Акваника\", Нижегородская обл., Кулебакский район, с. Саваслейка" 
}
```

#### CategoryDto
```json
{ "id": 1, "name": "Бутилированная вода", "code": "WATER" }
```

#### FactorDto
```json
{
  "id": 5,
  "name": "Хлориды",
  "type": { "id": 1, "name": "numeric" },
  "description": "Cl⁻"
}
```

### Endpoints

#### GET /products
Поиск продуктов.

**Query:** `query`, `categoryId=1`, `brandIds=1&brandIds=2`, `minRating`, `maxRating`, `page=0`, `size=20`

**Ответ 200:**
```json
[
  { "id": 101, "name": "Акваника Детская (Aquanika Kids)", "rating": 92, "imageURI": "https://..." },
  { "id": 102, "name": "Черноголовская первой категории артезианская негазированная", "rating": 88, "imageURI": "https://..." }
]
```

#### GET /products/suggestions
**Query:** `query=аква`, `limit=10`

**Ответ 200:** `["Акваника", "Акваника Детская", "Акватонус"]`

#### GET /products/{id}
**Query:** `include=FACTORS`

**Ответ 200:** `ProductResponse` (см. выше)

#### POST /products (ADMIN)
```json
{
  "name": "BonAqua питьевая негазированная",
  "categoryId": 1,
  "brandId": 3,
  "imageURI": "https://rskrf.ru/goods/voda-pitevaya-negazirovannaya-bonaqua/",
  "numericFactors": [
    { "factorId": 1, "amount": 0.0 },
    { "factorId": 3, "amount": 0.5 },
    { "factorId": 5, "amount": 90.0 },
    { "factorId": 10, "amount": 220.0 }
  ],
  "booleanFactors": [
    { "factorId": 100, "value": true },
    { "factorId": 101, "value": true }
  ],
  "enumFactors": [
    { "factorId": 120, "enumValueId": 4 },
    { "factorId": 121, "enumValueId": 11 }
  ]
}
```
**Ответ 201:** ProductResponse

#### PUT /products/{id} (ADMIN)
Тело как в POST. **Ответ 200**

#### DELETE /products/{id} (ADMIN)
**Ответ 204**

#### Категории
- `GET /products/categories` → `[{ "id":1, "name":"Бутилированная вода", "code":"WATER" }]`
- `POST /products/categories` (ADMIN) body `{ "name":"Бутилированная вода", "code":"WATER" }`
- `GET /products/categories/1`
- `PUT /products/categories/1` (ADMIN)
- `DELETE /products/categories/1` (ADMIN) → 204

#### Бренды
- `GET /products/brands` → 
```json
[
  { "id":1, "name":"Акваника", "description":"ООО \"Акваника\"..." },
  { "id":2, "name":"Черноголовка", "description":"ООО «ПК «Аквалайф»..." },
  { "id":3, "name":"BonAqua", "description":"The Coca-Cola Company..." }
]
```
- `POST /products/brands` (ADMIN)
- `GET /products/brands/{id}`
- `PUT /products/brands/{id}` (ADMIN)
- `DELETE /products/brands/{id}` (ADMIN)

---

## 2. Factors API (/factors)

#### GET /factors
```json
[
  { "id":1, "name":"Запах", "type":{"id":1,"name":"numeric"}, "description":"Интенсивность запаха" },
  { "id":5, "name":"Хлориды", "type":{"id":1,"name":"numeric"}, "description":"Cl⁻" },
  { "id":100, "name":"Наличие лабораторного отчёта", "type":{"id":2,"name":"boolean"} },
  { "id":120, "name":"Тип источника воды", "type":{"id":3,"name":"enum"} }
]
```

#### POST /factors (ADMIN)
```json
{ "name": "Водородный показатель (pH)", "typeId": 1, "description": "Единицы pH" }
```

#### Units
- `GET /factors/units` → `[{ "id":1,"name":"мг/л" }, { "id":3,"name":"единицы pH" }, { "id":5,"name":"баллы" }]`
- `POST /factors/units` (ADMIN) `{ "name":"мг/л" }`
- `DELETE /factors/units/{id}` (ADMIN)

#### Types
- `GET /factors/types` → `[{ "id":1,"name":"numeric" }, { "id":2,"name":"boolean" }, { "id":3,"name":"enum" }]`

#### Numeric Rules (для WATER, categoryId=1)
- `POST /factors/5/numeric-rules` (ADMIN)
```json
{ "categoryId": 1, "unitId": 1, "minValue": 0.0, "maxValue": 150.0 }
```
- `GET /factors/numeric-rules/{ruleId}`
- `DELETE /factors/numeric-rules/{ruleId}` (ADMIN)

#### Boolean Rules
- `POST /factors/100/boolean-rules` (ADMIN)
```json
{ "categoryId": 1, "impact": -45 }
```

#### Enum Values & Rules
- `POST /factors/120/enum-values` (ADMIN) `{ "value":"Артезианская" }` → `{ "id":2, "factorId":120, "value":"Артезианская" }`
- `POST /factors/enum-values/2/enum-rules` (ADMIN) `{ "categoryId":1, "impact":0 }`
- `POST /factors/121/enum-values` `{ "value":"ПЭТ" }`
- `POST /factors/enum-values/11/enum-rules` `{ "categoryId":1, "impact":-20 }`

---

## 3. User Service (/users)

#### GET /users/me/scanned-products
```json
[
  {
    "id": 101,
    "name": "Акваника Детская (Aquanika Kids)",
    "brand": { "id":1, "name":"Акваника" },
    "category": { "id":1, "name":"Бутилированная вода", "code":"WATER" },
    "rating": 92,
    "imageURI": "https://..."
  }
]
```

#### GET /users/me/viewed-products
Аналогично

#### GET /users/me/favorites
```json
[
  { "id":102, "name":"Черноголовская...", "brand":{...}, "category":{...}, "rating":88, "imageURI":"..." }
]
```

#### POST /users/me/favorites/{productId}
**Ответ 204**

#### DELETE /users/me/favorites/{productId}
**Ответ 204**

---

## 4. Recommendation Service (/recommendation)

#### GET /recommendation/feed/me
**Query:** `limit=10`

```json
{
  "userId": "a3f1c2e0-...",
  "items": [
    {
      "product": { "id":101, "name":"Акваника Детская (Aquanika Kids)", "rating":92, "imageURI":"https://..." },
      "score": 0.934,
      "reason": "POPULAR_IN_CATEGORY"
    },
    {
      "product": { "id":103, "name":"BonAqua питьевая негазированная", "rating":85, "imageURI":"https://..." },
      "score": 0.891,
      "reason": "SIMILAR_TO_FAVORITES"
    }
  ],
  "generatedAt": "2025-12-01T10:00:00Z"
}
```

#### POST /recommendation/recalculate (ADMIN)
**Ответ 202:** `{ "status":"RECALCULATION_STARTED" }`

---

## 5. Полная последовательность для WATER

1. `POST /products/categories` → создать WATER (id=1)
2. `POST /factors/types` → numeric, boolean, enum
3. `POST /factors/units` → мг/л, баллы, единицы pH и т.д.
4. `POST /factors` → создать 89 факторов (Запах, Хлориды, pH...)
5. `POST /factors/{id}/numeric-rules` → задать нормы для WATER
6. `POST /products/brands` → Акваника, Черноголовка, BonAqua, Архыз, Акватонус, Ассоль, Моя Цена
7. `POST /products` → создать 8 продуктов воды с факторами
8. Фронтенд: `GET /products?categoryId=1&minRating=80`
9. Открыть карточку: `GET /products/101?include=FACTORS`
10. Лента: `GET /recommendation/feed/me`