#!/usr/bin/env python3
import json
import os
import sys
import urllib.error
import urllib.request


def main():
    rest_url = os.environ.get("SUPABASE_REST_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not rest_url or not service_key:
        sys.stderr.write("Missing SUPABASE_REST_URL or SUPABASE_SERVICE_ROLE_KEY\n")
        sys.exit(2)

    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except json.JSONDecodeError:
        sys.stderr.write("Invalid JSON payload\n")
        sys.exit(2)

    path = payload.get("path")
    if not path:
        sys.stderr.write("Missing request path\n")
        sys.exit(2)

    method = payload.get("method", "GET").upper()
    body = payload.get("body")
    extra_headers = payload.get("headers") or {}

    url = rest_url.rstrip("/") + "/" + path.lstrip("/")

    data_bytes = body.encode("utf-8") if isinstance(body, str) else None
    request = urllib.request.Request(url, data=data_bytes, method=method)
    request.add_header("apikey", service_key)
    request.add_header("Authorization", f"Bearer {service_key}")
    if data_bytes is not None:
        request.add_header("Content-Type", "application/json")

    for key, value in extra_headers.items():
        request.add_header(key, value)

    try:
        with urllib.request.urlopen(request) as response:
            content = response.read().decode("utf-8")
            sys.stdout.write(
                json.dumps(
                    {
                        "ok": True,
                        "status": response.status,
                        "body": content,
                    }
                )
            )
    except urllib.error.HTTPError as exc:
        content = exc.read().decode("utf-8")
        sys.stdout.write(
            json.dumps(
                {
                    "ok": False,
                    "status": exc.code,
                    "body": content,
                }
            )
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
