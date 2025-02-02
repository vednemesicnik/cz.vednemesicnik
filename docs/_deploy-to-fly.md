# Deploy to Fly.io

## How to deploy to Fly.io

1. Create a new app on Fly.io specified by the `fly.toml` file. Do not deploy the app yet.
```shell
fly launch --no-deploy
```
2. Create a new volume for the persistent data storage. (region: Frankfurt, size: 1GB)
```shell
fly volume create data --count 1 --region fra --size 1 --app cz-vednemesicnik
```
3. Set secrets for the app.
```shell
fly secrets set SESSION_SECRET=$(openssl rand -hex 32) HONEYPOT_SECRET=$(openssl rand -hex 32) --app cz-vednemesicnik
```
4. Deploy the app.
```shell
fly deploy
```
