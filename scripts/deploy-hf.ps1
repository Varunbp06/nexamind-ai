# One-command NexaMind AI backend deployment to Hugging Face Spaces.
# Usage:
#   .\scripts\deploy-hf.ps1 -HfUser <username> -HfToken hf_xxx [-SpaceName nexamind-backend]
# Creates the Docker Space, uploads build context, sets secrets, waits for build,
# prints the public backend URL. Requires E:\PAI-RAG-feature\.venv (huggingface_hub).
param(
    [Parameter(Mandatory=$true)][string]$HfUser,
    [Parameter(Mandatory=$true)][string]$HfToken,
    [string]$SpaceName = "nexamind-backend"
)
$ErrorActionPreference = "Stop"
$repoId = "$HfUser/$SpaceName"
$py = "E:\PAI-RAG-feature\.venv\Scripts\python.exe"
$root = "E:\PAI-RAG-feature"

$env:HUGGING_FACE_HUB_TOKEN = $HfToken

$inner = @"
from huggingface_hub import HfApi
api = HfApi(token='$HfToken')
url = api.create_repo(repo_id='$repoId', repo_type='space', space_sdk='docker', private=False, exist_ok=True)
print('SPACE_URL', url)
api.upload_folder(
    repo_id='$repoId',
    repo_type='space',
    folder_path=r'$root',
    allow_patterns=[
        'Dockerfile.hf', 'scripts/start-hf.sh', 'backend/**', 'integrations/**',
        'alembic/**', 'alembic.ini', 'resources/**', 'pyproject.toml', 'poetry.lock'
    ],
    ignore_patterns=['**/__pycache__/**', '**/*.pyc', '**/.pytest_cache/**'],
    commit_message='Deploy NexaMind AI backend (Dockerfile.hf)',
)
print('UPLOAD_DONE')
secrets = {
    'EMBEDDING_ENDPOINT': 'https://integrate.api.nvidia.com/v1',
    'EMBEDDING_MODEL_ID': 'nvidia/nv-embedqa-e5-v5',
    'EMBEDDING_DIM': '1024',
    'CHROMA_INPROCESS': 'true',
    'PAIRAG_TASK_MODE': 'inline',
}
import os
for k, v in secrets.items():
    api.add_space_secret(repo_id='$repoId', key=k, value=v)
print('SECRETS_DONE')
"@
$tmp = "$env:TEMP\hf_deploy_inner.py"
Set-Content -Path $tmp -Value $inner -Encoding utf8
& $py $tmp
if ($LASTEXITCODE -ne 0) { throw "huggingface_hub steps failed" }

$embKey = ""
foreach ($ln in (Get-Content "$root\frontend\.env")) {
    if ($ln -match "^LLM_API_KEY=(.+)$") { $embKey = $Matches[1].Trim() }
}
$itToken = (Get-Content "$env:TEMP\it.txt" -Raw).Trim()
$inner2 = @"
from huggingface_hub import HfApi
api = HfApi(token='$HfToken')
api.add_space_secret(repo_id='$repoId', key='EMBEDDING_API_KEY', value='$embKey')
api.add_space_secret(repo_id='$repoId', key='INTERNAL_API_TOKEN', value='$itToken')
api.add_space_secret(repo_id='$repoId', key='ALLOWED_ORIGINS', value='https://nexamindai.vercel.app')
print('SECRET_KEYS_DONE')
"@
$tmp2 = "$env:TEMP\hf_deploy_keys.py"
Set-Content -Path $tmp2 -Value $inner2 -Encoding utf8
& $py $tmp2
if ($LASTEXITCODE -ne 0) { throw "secret keys step failed" }

Write-Host "`nSpace created + context uploaded. Build runs on HF (~15-25 min first time)."
Write-Host "Monitor: https://huggingface.co/spaces/$repoId"
Write-Host "Backend will be live at: https://$($HfUser.ToLower()).-$($SpaceName.ToLower()).hf.space"
Write-Host "When Space shows Running, set on Vercel:"
Write-Host "  NEXT_PUBLIC_BACKEND_URL=https://$($HfUser.ToLower()).-$($SpaceName.ToLower()).hf.space"
