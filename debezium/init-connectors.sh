#!/bin/sh

curl -X POST http://kafka-connect:8083/connectors \
  -H "Content-Type: application/json" \
  -d @/product-connector-config.json

curl -X POST http://kafka-connect:8083/connectors \
  -H "Content-Type: application/json" \
  -d @/product-outbox-connector-config.json

curl -X POST http://kafka-connect:8083/connectors \
  -H "Content-Type: application/json" \
  -d @/user-action-connector-config.json