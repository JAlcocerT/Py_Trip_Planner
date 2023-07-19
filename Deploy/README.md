# Local Deployment

Deploy me with docker!

* [DockerHub - x86,ARM32/64](https://hub.docker.com/repository/docker/fossengineer/trip_planner/general)
* [Build Locally](https://fossengineer.com/building-docker-container-images/#building-images-locally-x86-arm32-arm64)

## Usage

Here are some example snippets to help you get started creating a container.

### docker-compose (recommended, [click here for more info](https://fossengineer.com/selfhosting-python-dash-apps-with-docker/#how-to-self-host-a-python-dash-apps-with-docker))

```yaml
---
version: "2"
services:
  tripplanner:
    image: fossengineer/trip_planner
    container_name: tripplanner
    ports:
      - 8051:8050
    restart: unless-stopped
```

### docker cli ([click here for more info](https://docs.docker.com/engine/reference/commandline/cli/))

```bash
docker run -p 8051:8050 --name trip-planner fossengineer/trip-planner:latest
```

## Supported Architectures

Simply pulling `fossengineer/trip-planner:latest` will retrieve the correct image for your arch, but you can also pull specific arch images via tags.

The architectures supported by this image are:

| Architecture | Available | Tag |
| :----: | :----: | ---- |
| x86-64 | ✅ | amd64-\<version tag\> |
| arm64 | ✅ | arm64v8-\<version tag\> |
| armhf | ✅ | arm32v7-\<version tag\> |