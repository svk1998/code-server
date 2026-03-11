# code-server minimal setup

This repo is meant to be safe to keep in Git and easy to bootstrap from scratch.

## Keep in Git

```text
coder-server/
|-- docker-compose.yml
|-- .env.example
|-- .gitignore
|-- README.md
|-- repos/
|   `-- .gitkeep
|-- vsix/
|   `-- .gitkeep
`-- config/
    |-- .config/
    |   `-- code-server/
    |       `-- config.yaml
    `-- data/
        `-- User/
            `-- settings.json
```

## Do not keep in Git

- `.env`
- installed extensions
- logs
- caches
- machine ids
- workspace state
- chat history
- generated files under `config/data`

## Files

### `docker-compose.yml`

```yaml
---
services:
  code-server:
    image: lscr.io/linuxserver/code-server:4.110.0
    container_name: code-server
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=${TZ:-Etc/UTC}
      - HTTP_PROXY=${HTTP_PROXY:-}
      - HTTPS_PROXY=${HTTPS_PROXY:-}
      - NO_PROXY=${NO_PROXY:-127.0.0.1,localhost}
      - http_proxy=${HTTP_PROXY:-}
      - https_proxy=${HTTPS_PROXY:-}
      - no_proxy=${NO_PROXY:-127.0.0.1,localhost}
      - HASHED_PASSWORD=${CODE_SERVER_HASHED_PASSWORD:?set CODE_SERVER_HASHED_PASSWORD in .env}
      - DEFAULT_WORKSPACE=/repos
      - PWA_APPNAME=code-server
    volumes:
      - ./config:/config
      - ./repos:/repos
      - ./vsix:/vsix:ro
    ports:
      - ${CODE_SERVER_BIND_IP:-127.0.0.1}:${CODE_SERVER_PORT:-8443}:8443
    restart: unless-stopped
```

### `.env.example`

```env
TZ=Etc/UTC
CODE_SERVER_BIND_IP=127.0.0.1
CODE_SERVER_PORT=8443
HTTP_PROXY=
HTTPS_PROXY=
NO_PROXY=127.0.0.1,localhost
CODE_SERVER_HASHED_PASSWORD=
```

### `config/.config/code-server/config.yaml`

```yaml
bind-addr: 0.0.0.0:8443
auth: password
cert: false
```

### `config/data/User/settings.json`

```json
{
  "chat.commandCenter.enabled": false,
  "extensions.autoCheckUpdates": false,
  "extensions.autoUpdate": false,
  "remote.autoForwardPorts": false,
  "workbench.secondarySideBar.defaultVisibility": "hidden",
  "security.workspace.trust.enabled": true,
  "security.workspace.trust.startupPrompt": "always",
  "security.workspace.trust.untrustedFiles": "prompt",
  "telemetry.telemetryLevel": "off",
  "telemetry.feedback.enabled": false,
  "update.mode": "none"
}
```

## Fresh setup

1. Clone the repo.
2. Copy `.env.example` to `.env`.
3. Put a real bcrypt hash into `CODE_SERVER_HASHED_PASSWORD`.
4. Start the container.

```bash
cp .env.example .env
docker compose up -d
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up -d
```

## Generate password hash

Use any trusted bcrypt generator.

The value in `.env` must look like:

```text
$2b$12$...
```

Do not use:

- base64
- plain text password
- quoted JSON values

## Common commands

### Start

```bash
docker compose up -d
```

### Stop

```bash
docker compose down
```

### Restart

```bash
docker compose restart
```

### Logs

```bash
docker compose logs -f code-server
```

### Install a local VSIX

```bash
docker exec -it code-server code-server --install-extension /vsix/your-extension.vsix
```

## Multi-user setup

Use [`docker-compose.multiuser.yml`](/f:/coder-server/docker-compose.multiuser.yml#L1) if each user needs an isolated editor, password, config, and repo mount.

Included sample users:

- `shiv` on port `8443`
- `dev` on port `8444`
- `qa` on port `8445`

Each user gets:

- `users/<name>/config` mounted to `/config`
- `users/<name>/repos` mounted to `/repos`
- shared read-only `vsix/` mounted to `/vsix`

Bootstrap:

```bash
cp .env.multiuser.example .env.multiuser
docker compose -f docker-compose.multiuser.yml --env-file .env.multiuser up -d
```

On Windows PowerShell:

```powershell
Copy-Item .env.multiuser.example .env.multiuser
docker compose -f docker-compose.multiuser.yml --env-file .env.multiuser up -d
```

## Notes

- Put your projects in `repos/`. They will be available in the container at `/repos`.
- Put downloaded `.vsix` files in `vsix/`. They will be available in the container at `/vsix`.
- Installed extensions are runtime data and should stay out of Git.
- If you want local-only access, keep `CODE_SERVER_BIND_IP=127.0.0.1`.
- For Portainer deployment, see [`portainer/README.md`](/f:/coder-server/portainer/README.md#L1).
