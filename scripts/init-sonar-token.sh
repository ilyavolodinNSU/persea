#!/bin/sh
echo 'Waiting for SonarQube...'
until curl -s -f http://sonarqube:9000/api/system/status | grep -q '"status":"UP"'; do sleep 5; done
echo 'SonarQube is up. Generating token...'

RESPONSE=$(curl -s -u admin:admin -X POST http://sonarqube:9000/api/user_tokens/generate -d 'name=gradle-build')

# Если токен уже существует, удаляем и создаём новый
if echo "$RESPONSE" | grep -q '"errors"'; then
    if echo "$RESPONSE" | grep -q 'already exists'; then
        echo 'Token already exists. Revoking old one...'
        curl -s -u admin:admin -X POST http://sonarqube:9000/api/user_tokens/revoke -d 'name=gradle-build' > /dev/null
        RESPONSE=$(curl -s -u admin:admin -X POST http://sonarqube:9000/api/user_tokens/generate -d 'name=gradle-build')
    else
        echo "Error: $RESPONSE"
        exit 1
    fi
fi

TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
    echo "SONAR_TOKEN=$TOKEN" > /output/sonar.token.env
    echo 'Token saved to /output/sonar.token.env'
else
    echo 'Failed to extract token. Response:'
    echo "$RESPONSE"
    exit 1
fi