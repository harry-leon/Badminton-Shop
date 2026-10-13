@echo off
echo ===================================================
echo  BADMINTON SHOP MONOREPO - DEV ENVIRONMENT STARTER
echo ===================================================

echo [1/3] Khoi dong ha tang Docker (Postgres, RabbitMQ, MinIO)...
cd infra
docker compose up -d
cd ..

echo [2/3] Kiem tra ket noi ha tang...
echo Docker containers:
docker compose -f infra/docker-compose.yml ps

echo [3/3] Chay master test suite...
node test/test-suite.js

echo.
echo He thong dev da san sang!
