# Sneakerness_G4

## Development

From the repository root, start the development server with:

```powershell
docker compose -f .\Sneakerness_G4\docker-compose.yml run --service-ports dev
```

`docker compose run` does not publish the service's configured ports by default.
The `--service-ports` option publishes port 3000 so the app is available at
http://localhost:3000. Alternatively, start the service with its configured
ports using:

```powershell
docker compose -f .\Sneakerness_G4\docker-compose.yml up dev
```