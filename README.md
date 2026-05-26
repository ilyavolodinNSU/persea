## Запуск проекта

В проекте предусмотрено два варианта запуска с помощью Docker Compose:

### Вариант 1: Полный запуск (Production/Test-like)
Запускает всю инфраструктуру и микросервисы (собираются из исходников).
`ЕСЛИ ПАДАЕТ С ОШИБКОЙ ТО ОТКЛЮЧИТЬ ВПН!`
```bash
docker compose up -d --build
```
*Примечание: Микросервисы маршрутизируются через единый контейнер `localhost`. Приложения будут доступны на портах 8084, 8085, 8086.*

### Вариант 2: Среда разработки (Infra only)
Запускает **только инфраструктуру** (Базы данных, Kafka, Keycloak, ELK). Микросервисы вы запускаете локально через вашу IDE.
```bash
docker compose -f docker-compose-dev.yml up -d
```
Запуск сервисов по отдельности в корне каждого:
```bash
./gradlew bootRun
```
*Примечание: В dev-режиме порты проброшены напрямую на хост (например, основная БД Postgres доступна на порту 5433).*

---

## Аутентификация и пользователи (Keycloak)

Keycloak автоматически импортирует настройки `realm` при старте. 

* **Admin Console:** http://localhost:8080
* **Admin Login/Password:** `admin` / `admin`

### Тестовые пользователи

В системе предустановлены следующие пользователи:

| Username | Email | Password | Роль |
| :--- | :--- | :--- | :--- |
| `test_user` | test_user@persea.local | `user1234` | `app_user` (default) |
| `test_moderator` | test_moderator@persea.local | `moder1234` | `moderator` |
| `test_admin` | test_admin@persea.local | `admin1234` | `admin` |

### Как получить Access Token (через Postman)

Так как для клиента `android-app` отключен Direct Access Grant (передача логина/пароля напрямую), необходимо использовать **Authorization Code Flow с PKCE**.

В Postman создайте новый Request, перейдите во вкладку **Authorization** и настройте её следующим образом:

1. **Type:** `OAuth 2.0`
2. **Add authorization data to:** `Request Headers`
3. В разделе **Configure New Token**:
   * **Token Name:** `Persea Token` (любое имя)
   * **Grant Type:** `Authorization Code`
   * **Callback URL:** `https://oauth.pstmn.io/v1/callback` *(убедитесь, что галочка "Authorize using browser" **снята**)*
   * **Auth URL:** `http://localhost:8080/realms/persea/protocol/openid-connect/auth`
   * **Access Token URL:** `http://localhost:8080/realms/persea/protocol/openid-connect/token`
   * **Client ID:** `android-app`
   * **Client Secret:** *(оставить пустым, так как publicClient: true)*
   * **Code Challenge Method:** `SHA-256`
   * **Scope:** `openid profile email`

4. Нажмите кнопку **Get New Access Token**.
5. Откроется встроенное окно браузера Postman. Введите логин и пароль одного из тестовых пользователей (например, `test_admin` / `admin1234`).
6. После успешного входа Postman получит токен. Нажмите **Use Token**.

---

## Инфраструктура и порты

### Микросервисы (только при полном запуске)
| Сервис | Порт (localhost) | Описание |
| :--- | :--- | :--- |
| `product-service` | `8084` | Управление каталогом продуктов |
| `user-service` | `8085` | Управление профилями пользователей |
| `recommendation-service`| `8086` | Выдача рекомендаций (использует Redis) |

### Инфраструктура
| Сервис | Порт (Dev-режим) | Описание |
| :--- | :--- | :--- |
| **Keycloak** | `8080` | IAM сервер |
| **Postgres (Services)** | `5433` (в dev) / `5432` | Основная БД для микросервисов (wal_level=logical) |
| **Postgres (Keycloak)** | `5432` (в dev) | БД для самого Keycloak |
| **Kafka** | `9094` | Брокер сообщений |
| **Kafka Connect** | `8083` | Debezium CDC |
| **Redis** | `6379` | Кэш / БД для рекомендаций |
| **Elasticsearch** | `9200` | Поисковый движок |
| **Logstash** | `5044` (только в dev) | Пайплайны для синхронизации Postgres -> ES |