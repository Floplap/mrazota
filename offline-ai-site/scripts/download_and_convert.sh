#!/usr/bin/env bash
set -e
# Скрипт пытается скачать модели с HuggingFace (требуется HUGGINGFACE_TOKEN)
BASE_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
MODELS_DIR="$BASE_DIR/models"
mkdir -p "$MODELS_DIR"

if [ -z "$HUGGINGFACE_TOKEN" ]; then
  echo "HUGGINGFACE_TOKEN не задан. Экспортируй в окружение или .env и повтори."
  exit 1
fi

# Пример: скачиваем small/medium модели; пользователь должен настроить именно ту модель, которую он хочет
# НИЧЕГО НЕ СКАЧИВАЕМ без подтверждения лицензии — проверяй переменную CONFIRM_LICENSE
if [ "$CONFIRM_LICENSE" != "true" ]; then
  echo "CONFIRM_LICENSE != true — не скачиваем защищённые веса."
  exit 1
fi

# пример скачивания (потребуются права доступа к приватным/ограниченным моделям)
echo "Пример: скачиваем модель 'TheBloke/Llama-2-13B-GGML' (если доступна)."
python3 - <<PY
from huggingface_hub import snapshot_download
import os,sys
token=os.environ.get('HUGGINGFACE_TOKEN')
if not token:
    print('no token'); sys.exit(1)
# замените repo_id на нужный
repo_id = "TheBloke/Llama-2-13B-GGML" 
out = snapshot_download(repo_id=repo_id, cache_dir=os.path.join(os.getcwd(),'models'), use_auth_token=token)
print("Downloaded to", out)
PY

echo "После скачивания — используйте scripts/quantize.sh для преобразования в ggml,\u00A0если\u00A0нужно."
