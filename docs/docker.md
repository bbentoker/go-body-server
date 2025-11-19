# Dockerizing Go Body Server

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.24+ (or Docker Engine/Compose Plugin 2.21+)
- Access to an environment file that contains the application secrets

## Preparing environment variables
1. Copy the sample file and edit as needed:
   ```bash
   cp .env.docker.example .env.docker
   ```
2. Update `.env.docker` with the values you want to use in containers.  
   - `DB_*` values feed both the Node service and the Postgres container.
   - `PORT` is the host port that the API will be exposed on (`containerPort` stays 3000).

> The regular `.env` file that is used during local development is intentionally ignored by Docker so that credentials are not baked into the image.

## Building & running everything
```bash
docker compose --env-file .env.docker up --build
```
This command:
- Builds the API image defined in `Dockerfile`.
- Starts the `api` service and a Postgres 15 instance (`db`) defined in `docker-compose.yml`.
- Waits for Postgres to pass its healthcheck before booting the API.

When the containers are up, the API becomes available at `http://localhost:${PORT:-3000}`.

## Common tasks
- Stop the stack (preserve volumes): `docker compose down`
- Stop and wipe Postgres data: `docker compose down -v`
- View logs: `docker compose logs -f api`

## Notes
- Source changes require rebuilding the image (`docker compose up --build`) unless you add bind mounts.
- The `postgres_data` named volume keeps database state between runs. Remove it if you want a clean slate.
- For production you can push the built `gobody-api` image to a registry and deploy it with environment variables supplied by your orchestrator.
