.PHONY: up down seed test dev build

up:
	docker compose -f infra/docker-compose.yml up -d

down:
	docker compose -f infra/docker-compose.yml down

seed:
	psql -U postgres -f infra/postgres/init-databases.sql
	psql -U postgres -f infra/postgres/schema-all-services.sql
	psql -U postgres -f infra/postgres/seed-data.sql
	psql -U postgres -f infra/postgres/seed-inventory-secondhand-warranty.sql
	psql -U postgres -f infra/postgres/seed-orders-and-claims.sql
	psql -U postgres -f infra/postgres/seed-secondhand-cases.sql
	psql -U postgres -f infra/postgres/seed-transfers.sql

test:
	node test/test-suite.js

test-e2e:
	node test/run-e2e.js

dev:
	cd frontend && npm run dev

build:
	cd frontend && npm run build
