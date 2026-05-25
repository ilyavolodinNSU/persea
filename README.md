# Запуск проекта Persea

Инструкция по локальному развёртыванию для разработки.

## Предварительные требования

- Docker и Docker Compose
- JDK 21
- Postman
- Git

## 1. Клонирование репозитория

```
git clone <repo-url>
cd persea
git submodule update --init --recursive
```

## 2. Запуск инфраструктуры

Из корня проекта:

```
docker compose -f docker-compose-dev.yml up -d
```

Поднимаются: PostgreSQL для сервисов, PostgreSQL для Keycloak, Keycloak, Kafka, Kafka Connect, Debezium коннекторы, Redis, Elasticsearch, Logstash.

Дождаться, пока все контейнеры будут в статусе healthy. Проверить:

```
docker ps
```

Контейнер `connect-init` должен завершиться с кодом 0 после регистрации коннекторов.

## 3. Запуск сервисов

Каждый сервис запускается отдельно из своей директории:

```
cd <service-name>
./gradlew bootRun
```

Сервисы поднимаются на портах, указанных в их `application.yml`.

## 4. Настройка Postman

### 4.1. Импорт коллекций

В Postman выполнить File → Import и выбрать все файлы из папки `postman/` в корне репозитория.

### 4.2. Регистрация пользователя

Открыть в браузере страницу логина Keycloak:

```
http://localhost:8081/realms/persea/account
```

Нажать Register, заполнить форму, подтвердить email (для разработки письма ловятся через Mailpit, либо подтвердить вручную в админке Keycloak).

Альтернативно регистрацию можно выполнить через Postman, используя соответствующий запрос из импортированной коллекции.

### 4.3. Получение токена

В Postman открыть любую коллекцию, перейти в Authorization → OAuth 2.0 → Get New Access Token. Использовать настройки, заранее сохранённые в коллекции (Authorization Code with PKCE, client_id `android-app`).

После успешного логина в браузере токен сохранится в Postman.

## 5. Назначение роли администратора

По умолчанию новый пользователь получает роль `APP_USER`. Чтобы выдать роль `ADMIN`:

1. Открыть админку Keycloak: `http://localhost:8081`
2. Войти под `admin / admin`
3. Переключиться на realm `persea`
4. Users → найти своего пользователя → Role mapping → Assign role
5. Выбрать `ADMIN` и подтвердить

После изменения ролей в Postman нужно **получить новый токен** (старый содержит прежние роли). Снова выполнить Get New Access Token.

## 6. Работа с API

Использовать импортированные коллекции из папки `postman/`. Токен подставляется автоматически из настроек OAuth 2.0 коллекции.

При истечении токена или ошибке `invalid_grant` получить новый токен через Get New Access Token, а не через кнопку refresh (в realm включён Refresh Token Rotation, refresh токен одноразовый).

## 7. Остановка

Остановить контейнеры без удаления данных:

```
docker compose -f docker-compose-dev.yml down
```

Полная очистка с удалением volume (БД, сессии Keycloak, индексы Elasticsearch):

```
docker compose -f docker-compose-dev.yml down -v
```

После `down -v` при следующем запуске realm Keycloak импортируется заново из `keycloak/import/persea-realm.json`, всех зарегистрированных пользователей нужно создавать заново.

## Возможные проблемы

**Elasticsearch не стартует, статус unhealthy.** Проверить `docker logs es`. Чаще всего причина — низкий `vm.max_map_count` (см. предварительные требования) или права на папку `./esdata`:

```
sudo chown -R 1000:1000 ./esdata ./lsdata
```

**connect-init падает с 409 Conflict.** Коннекторы уже зарегистрированы в Kafka Connect от прошлого запуска. Если данные в БД актуальны — игнорировать. Для полной переинициализации сделать `down -v`.

**Postman возвращает Invalid refresh token.** Включён Refresh Token Rotation, токен одноразовый. Получить новый через Get New Access Token.

**Сервис не подключается к Keycloak / Postgres / Kafka.** Убедиться, что в `application.yml` сервиса хосты указаны как `localhost` (если сервис запускается через `./gradlew bootRun` на хосте), а не как имена контейнеров.