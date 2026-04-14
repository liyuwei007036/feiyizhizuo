
# 非遗智作-PC版

This is a code bundle for 非遗智作-PC版. The original project is available at https://www.figma.com/design/M11BNoNeDVlisLG2I8dz9A/%E9%9D%9E%E9%81%97%E6%99%BA%E4%BD%9C-PC%E7%89%88.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Production deployment

This project can be deployed as a static site with Docker + Nginx.

- Frontend public URL: `http://192.168.100.219:19081`
- Backend target: `http://192.168.100.219:19080`
- `/api/*` will be proxied to `/ump-client-user-service/*`
- `/ai/*` will be proxied to `/ump-client-ai-service/*`

### Deploy on the server

```bash
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

The deployment script will:

- run `npm ci`
- run `npm run build`
- build the Docker image
- start or recreate the Nginx container on port `19081`

### Manual compose command

```bash
npm ci
npm run build
docker compose -f docker-compose.prod.yml up -d --build
```
