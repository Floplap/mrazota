# offline-ai-site — локальный offline AI для сайта

## Коротко
Проект запускает локальные компоненты: LLM (через llama.cpp или совместимый бинарник), ASR (whisper.cpp), TTS (Coqui TTS / espeak). Всё inference происходит на твоём сервере/ПК.

## Быстрый старт (Linux/Debian/Ubuntu):
1. Скопируй проект в папку offline-ai-site.
2. Отредактируй .env (при необходимости) и помести HUGGINGFACE_TOKEN в .env если хочешь автоматическое скачивание моделей (CONFIRM_LICENSE=true обязательно).
3. Выполни установку:
   ```bash
   cd offline-ai-site
   bash backend/run_setup.sh 

Скрипт установит зависимости, соберёт llama.cpp и whisper.cpp и предложит запустить скачивание моделей (если задан токен и подтверждены лицензии).
	4. 	Если модели и бинарники уже есть —	просто	запусти:

cd backend
node server.js
# или docker-compose	up	--build

Где что:
	•	bin/ — бинарники llama/whisper (создавай вручную или скрипт соберёт их).
	•	models/ — сюда клади ggml/квантованные модели.
	•	frontend/ — UI для тестирования.
	•	backend/ — сервер с API (chat, asr, tts).
