#!/usr/bin/env bash
set -e
BASE_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
BIN_DIR="$BASE_DIR/bin"
MODELS_DIR="$BASE_DIR/models"
SCRIPTS_DIR="$BASE_DIR/scripts"

mkdir -p "$BIN_DIR" "$MODELS_DIR" "$BASE_DIR/tmp_uploads" "$SCRIPTS_DIR"

echo "1) Установка системных пакетов (Debian/Ubuntu style). Подтверди пароль sudo если нужно."
sudo apt update || true
sudo apt install -y build-essential git cmake python3 python3-pip wget sox pkg-config

echo "2) Установка node deps"
cd "$BASE_DIR/backend"
npm install

echo "3) Сборка llama.cpp и whisper.cpp -> bin/"
cd "$BASE_DIR"
if [ ! -d "repos/llama.cpp" ]; then
  git clone --depth 1 https://github.com/ggerganov/llama.cpp.git repos/llama.cpp
fi
cd repos/llama.cpp
make clean || true
# build CPU default
make -j$(nproc)
cp ./main "$BIN_DIR/llama" || true

if [ ! -d "$BASE_DIR/repos/whisper.cpp" ]; then
  git clone --depth 1 https://github.com/ggerganov/whisper.cpp.git repos/whisper.cpp
fi
cd repos/whisper.cpp
make clean || true
make -j$(nproc)
cp ./main "$BIN_DIR/whisper" || true

echo "4) Установка python deps (Coqui TTS optional)"
python3 -m pip install --user TTS || true

echo "5) Скачать модели (если указан HUGGINGFACE_TOKEN и CONFIRM_LICENSE=true в .env)."
if [ -f "$BASE_DIR/.env" ]; then
  export $(grep -v '^#' "$BASE_DIR/.env" | xargs)
fi
if [ -n "$HUGGINGFACE_TOKEN" ] && [ "$CONFIRM_LICENSE" = "true" ]; then
  echo "HuggingFace token detected. Использую huggingface-cli для скачивания."
  python3 -m pip install --user huggingface_hub || true
  export HF_HOME="$MODELS_DIR/hf"
  mkdir -p "$HF_HOME"
  # NOTE: конкретная модель выбирается позже через model_manager; здесь скачиваем примеры
  echo "Скачиваю примерные веса (пользователь должен иметь права на выбранные модели)."
  # user must edit which model to download: placeholder
  echo "PLACEHOLDER: скачивание моделей выполняется скриптом scripts/download_and_convert.sh"
  bash "$SCRIPTS_DIR/download_and_convert.sh" || true
else
  echo "HUGGINGFACE_TOKEN отсутствует или CONFIRM_LICENSE != true. Пропускаю автоматическое скачивание моделей."
  echo "Используй scripts/download_and_convert.sh с HUGGINGFACE_TOKEN и подтверждением лицензий."
fi

echo "6) Готово. Проверь bin/ и models/. Для запуска: node backend/server.js"
