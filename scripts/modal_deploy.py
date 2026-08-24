"""Deploy NexaMind AI backend to Modal (free $30/mo credits, no card).

Usage:
    modal deploy scripts/modal_deploy.py

Requires: pip install modal  (in the repo venv or any env)
Auth:     modal token new    (or set MODAL_TOKEN_ID / MODAL_TOKEN_SECRET)

Design notes:
- Single-process mode: CHROMA_INPROCESS + PAIRAG_TASK_MODE=inline so the
  whole stack runs inside one container (proven necessary on small hosts,
  harmless on Modal's larger containers).
- Persistent state (SQLite/Chroma/uploads) lives on a Modal Volume mounted
  at /data; start-up symlinks /app/tmp and /app/localdata onto it.
- keep_warm=1 keeps one container always-on (~$20/mo of the free $30
  credit): no cold starts for end users.
- Migrations run at container start before serving.
"""

import os
import subprocess

import modal

app = modal.App("nexamind-ai-backend")

image = (
    modal.Image.from_dockerfile(
        path=os.path.join(os.path.dirname(__file__), "..", "Dockerfile.modal"),
        context_dir=os.path.join(os.path.dirname(__file__), ".."),
    )
)

volume = modal.Volume.from_name("nexamind-appdata", create_if_missing=True)

secrets = [
    modal.Secret.from_dict(
        {
            "ALLOWED_ORIGINS": "https://nexamindai.vercel.app",
            "CHROMA_INPROCESS": "true",
            "PAIRAG_TASK_MODE": "inline",
            # EMBEDDING_* and INTERNAL_API_TOKEN are attached as Modal
            # Secrets created out-of-band (see README / deploy notes):
            #   modal secret create nexamind-api \
            #       EMBEDDING_API_KEY=nvapi-... \
            #       EMBEDDING_ENDPOINT=https://integrate.api.nvidia.com/v1 \
            #       EMBEDDING_MODEL_ID=nvidia/nv-embedqa-e5-v5 \
            #       EMBEDDING_DIM=1024 \
            #       INTERNAL_API_TOKEN=<same value as Vercel>
        }
    ),
    modal.Secret.from_name("nexamind-api"),
]


@app.function(
    image=image,
    secrets=secrets,
    volumes={"/data": volume},
    memory=(512, 2048),
    cpu=0.25,
    keep_warm=1,
    timeout=3600,
    scaledown_window=3600,
)
@modal.asgi_app()
def api():
    import shutil

    # Redirect relative persistence paths onto the mounted volume.
    for link, target in (
        ("/app/tmp", "/data/appdata/tmp"),
        ("/app/localdata", "/data/appdata/localdata"),
    ):
        os.makedirs(target, exist_ok=True)
        if not os.path.islink(link):
            if os.path.isdir(link):
                try:
                    subprocess.run(["cp", "-a", link + "/.", target + "/"], check=False)
                except Exception:
                    pass
                shutil.rmtree(link, ignore_errors=True)
            elif os.path.exists(link):
                os.remove(link)
        os.makedirs(os.path.dirname(link), exist_ok=True)
        if not os.path.islink(link):
            os.symlink(target, link)
    os.makedirs("/app/tmp/sqlite/chroma", exist_ok=True)
    os.makedirs("/app/localdata/sqlite", exist_ok=True)

    # Database migrations before serving.
    subprocess.run(["alembic", "upgrade", "head"], check=False)

    from app.main import app as fastapi_app

    return fastapi_app
