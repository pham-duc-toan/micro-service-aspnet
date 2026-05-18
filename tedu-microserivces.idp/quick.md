cd src
docker compose down -v
docker compose build
docker compose up -d

docker compose stop identity.api
docker compose build identity.api
docker compose up -d identity.api

docker-compose -f src/docker-compose.yml up -d --build

alicesmith@example.com
alice123