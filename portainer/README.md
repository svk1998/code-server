# Portainer deployment

This folder documents how to deploy this repo in Portainer using `Stacks`.

Official Portainer docs:

- Install Portainer CE: https://docs.portainer.io/start/install-ce/server/docker
- Add a stack: https://docs.portainer.io/2.27/user/docker/stacks/add
- Stacks overview: https://docs.portainer.io/user/docker/stacks

## Recommended stacks

- Single user: use [`docker-compose.yml`](/f:/coder-server/docker-compose.yml#L1)
- Multi-user: use [`docker-compose.multiuser.yml`](/f:/coder-server/docker-compose.multiuser.yml#L1)

## Single-user stack

1. Open Portainer.
2. Select your Docker environment.
3. Go to `Stacks`.
4. Click `Add stack`.
5. Name it `code-server-single`.
6. Paste the contents of [`docker-compose.yml`](/f:/coder-server/docker-compose.yml#L1).
7. Add environment variables from [`stack.single.env.example`](/f:/coder-server/portainer/stack.single.env.example#L1).
8. Replace `CODE_SERVER_HASHED_PASSWORD` with a real bcrypt hash.
9. Deploy the stack.

### Single-user env variables

Use [`stack.single.env.example`](/f:/coder-server/portainer/stack.single.env.example#L1):

```env
TZ=Etc/UTC
CODE_SERVER_BIND_IP=127.0.0.1
CODE_SERVER_PORT=8443
HTTP_PROXY=
HTTPS_PROXY=
NO_PROXY=127.0.0.1,localhost
CODE_SERVER_HASHED_PASSWORD=
```

## Multi-user stack

1. Open Portainer.
2. Select your Docker environment.
3. Go to `Stacks`.
4. Click `Add stack`.
5. Name it `code-server-multiuser`.
6. Paste the contents of [`docker-compose.multiuser.yml`](/f:/coder-server/docker-compose.multiuser.yml#L1).
7. Add environment variables from [`stack.multiuser.env.example`](/f:/coder-server/portainer/stack.multiuser.env.example#L1).
8. Replace each password variable with a real bcrypt hash.
9. Deploy the stack.

### Multi-user env variables

Use [`stack.multiuser.env.example`](/f:/coder-server/portainer/stack.multiuser.env.example#L1):

```env
TZ=Etc/UTC
CODE_SERVER_BIND_IP=127.0.0.1
HTTP_PROXY=
HTTPS_PROXY=
NO_PROXY=127.0.0.1,localhost
CODE_SERVER_PORT_SHIV=8443
CODE_SERVER_PORT_DEV=8444
CODE_SERVER_PORT_QA=8445
CODE_SERVER_HASHED_PASSWORD_SHIV=
CODE_SERVER_HASHED_PASSWORD_DEV=
CODE_SERVER_HASHED_PASSWORD_QA=
```

## Notes

- Keep this repo in Git as the source of truth.
- Use Portainer for deployment, restart, logs, and env management.
- For local-only access, keep `CODE_SERVER_BIND_IP=127.0.0.1`.
- For reverse proxy access, change bind IP or front it with your internal proxy.
- Password values must be bcrypt hashes, not plain text and not base64.
