# syntax=docker/dockerfile:1
FROM golang:1.27-bookworm AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/kadeangell-ssh .

FROM debian:bookworm-slim
# vim + bubblewrap: the sandboxed editor. util-linux provides prlimit.
# ca-certificates: the server calls https://www.kadeangell.com/api/fs.
RUN apt-get update \
 && apt-get install -y --no-install-recommends vim bubblewrap util-linux ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --create-home --home-dir /home/kssh --shell /usr/sbin/nologin kssh \
 && mkdir /data && chown kssh /data
COPY --from=build /out/kadeangell-ssh /usr/local/bin/kadeangell-ssh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
EXPOSE 2222 8080
# Starts as root only to fix ownership of the mounted volume, then drops to kssh.
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
