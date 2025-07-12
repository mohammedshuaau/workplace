# Dendrite Matrix Server Commands

## User Management

### Create Admin User
```bash
docker-compose exec dendrite /usr/bin/create-account -config /etc/dendrite/dendrite.yaml -username admin -admin
```

### Create Regular User
```bash
docker-compose exec dendrite /usr/bin/create-account -config /etc/dendrite/dendrite.yaml -username username -password password
```

### Create User with Custom Password
```bash
docker-compose exec dendrite /usr/bin/create-account -config /etc/dendrite/dendrite.yaml -username username
# You will be prompted to enter a password
```

## Server Management

### Restart Dendrite
```bash
docker-compose restart dendrite
```

### View Dendrite Logs
```bash
docker-compose logs -f dendrite
```

### Stop Dendrite
```bash
docker-compose stop dendrite
```

### Start Dendrite
```bash
docker-compose start dendrite
```

## Testing

### Test Matrix Server
```bash
curl http://matrix.pension.test/_matrix/client/versions
```

### Check User Profile
```bash
curl http://matrix.pension.test/_matrix/client/r0/profile/@admin:matrix.pension.test
```

## Configuration

- **Config File**: `dendrite_config/dendrite.yaml`
- **Server Name**: `matrix.pension.test`
- **Shared Secret**: `dendrite-secret-key-2025`
- **Registration**: Disabled (admin creation only)

## Matrix Client Connection

- **Server URL**: `http://matrix.pension.test`
- **Admin User**: `@admin:matrix.pension.test` 