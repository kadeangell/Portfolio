#!/bin/sh
# A freshly mounted Fly volume is owned by root; the server runs as kssh.
set -e
chown kssh:kssh /data
exec setpriv --reuid=kssh --regid=kssh --init-groups \
  kadeangell-ssh -addr :2222 -host-key /data/host_key -http-addr :8080 "$@"
