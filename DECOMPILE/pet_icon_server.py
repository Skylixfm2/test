from __future__ import annotations

import json
import os
import shutil
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


HOST = "127.0.0.1"
PORT = 8765
ROOT = Path(__file__).resolve().parent
USER_AGENT = "PetIconMaker/1.0"
SSL_CONTEXT = ssl.create_default_context()
PLUGIN_SOURCE = ROOT / "studio-pet-icon-plugin.lua"
PLUGIN_TARGET_NAME = "PetIconMaker.lua"


def json_response(handler: SimpleHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(body)


def fetch_url(url: str) -> tuple[bytes, str]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "*/*",
        },
    )
    with urllib.request.urlopen(request, timeout=12, context=SSL_CONTEXT) as response:
        content_type = response.headers.get_content_type() or "application/octet-stream"
        return response.read(), content_type


def resolve_roblox_thumbnail(asset_id: str, size: int) -> str | None:
    metadata_url = (
        f"https://thumbnails.roblox.com/v1/assets?assetIds={asset_id}"
        f"&returnPolicy=PlaceHolder&size={size}x{size}&format=Png&isCircular=false"
    )

    try:
        raw, _ = fetch_url(metadata_url)
        payload = json.loads(raw.decode("utf-8"))
        image_url = payload.get("data", [{}])[0].get("imageUrl")
        if image_url:
            return image_url
    except Exception:
        pass

    return (
        f"https://www.roblox.com/asset-thumbnail/image?assetId={asset_id}"
        f"&width={size}&height={size}&format=png"
    )


class PetIconHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/health":
            json_response(self, HTTPStatus.OK, {"ok": True, "root": str(ROOT)})
            return

        if parsed.path == "/api/thumbnail":
            self.handle_thumbnail(parsed.query)
            return

        if parsed.path == "/":
            self.path = "/pet-icon-maker.html"

        super().do_GET()

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/install-plugin":
            self.handle_install_plugin()
            return

        json_response(self, HTTPStatus.NOT_FOUND, {"ok": False, "error": "Unknown endpoint"})

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def handle_thumbnail(self, query_string: str) -> None:
        query = urllib.parse.parse_qs(query_string)
        asset_id = "".join(ch for ch in query.get("assetId", [""])[0] if ch.isdigit())
        size_raw = query.get("size", ["420"])[0]

        try:
            size = max(150, min(1024, int(size_raw)))
        except ValueError:
            size = 420

        if not asset_id:
            json_response(self, HTTPStatus.BAD_REQUEST, {"error": "Missing assetId"})
            return

        try:
            thumbnail_url = resolve_roblox_thumbnail(asset_id, size)
            if not thumbnail_url:
                raise RuntimeError("No thumbnail URL returned")

            image_bytes, content_type = fetch_url(thumbnail_url)
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(image_bytes)))
            self.send_header("Cache-Control", "public, max-age=300")
            self.end_headers()
            self.wfile.write(image_bytes)
        except urllib.error.HTTPError as error:
            json_response(
                self,
                error.code or HTTPStatus.BAD_GATEWAY,
                {"error": f"Roblox returned {error.code}", "assetId": asset_id},
            )
        except Exception as error:
            json_response(
                self,
                HTTPStatus.BAD_GATEWAY,
                {"error": "Could not load Roblox thumbnail", "assetId": asset_id, "detail": str(error)},
            )

    def handle_install_plugin(self) -> None:
        local_appdata = os.environ.get("LOCALAPPDATA")
        if not local_appdata:
            json_response(self, HTTPStatus.BAD_REQUEST, {"ok": False, "error": "LOCALAPPDATA is not available"})
            return

        plugins_dir = Path(local_appdata) / "Roblox" / "Plugins"
        plugins_dir.mkdir(parents=True, exist_ok=True)

        if not PLUGIN_SOURCE.exists():
            json_response(
                self,
                HTTPStatus.NOT_FOUND,
                {"ok": False, "error": f"Plugin source not found: {PLUGIN_SOURCE}"},
            )
            return

        target_path = plugins_dir / PLUGIN_TARGET_NAME

        try:
            shutil.copyfile(PLUGIN_SOURCE, target_path)
            json_response(
                self,
                HTTPStatus.OK,
                {"ok": True, "installPath": str(target_path), "pluginsDir": str(plugins_dir)},
            )
        except Exception as error:
            json_response(
                self,
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"ok": False, "error": f"Could not install plugin: {error}"},
            )

    def log_message(self, format: str, *args) -> None:
        sys.stdout.write("[pet-icon-server] " + format % args + "\n")


def main() -> None:
    os.chdir(ROOT)
    server = ThreadingHTTPServer((HOST, PORT), PetIconHandler)
    print(f"Pet icon server running on http://{HOST}:{PORT}/pet-icon-maker.html")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
