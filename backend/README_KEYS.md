Куда и какие ключи положить (инструкция)

1) Файл `.env` в папке `backend` (НЕ коммитить в репозиторий).
   - Скопируйте `backend/.env.example` → `backend/.env` и заполните реальные значения.

Пример `backend/.env`:

SUPABASE_URL=https://ndlmuwwznqodderoieoh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (ВАШ service role key)
JWT_SECRET=replace_with_random_string
PAYSERA_PROJECT_ID=ваш_paysera_project_id
PAYSERA_SECRET=ваш_paysera_secret
PAYSERA_RETURN_URL=https://your-site.example/paysera/return
PORT=5000

2) Как запустить backend локально

# установить зависимости (в папке backend)
npm install
# запустить сервер
npm run start
# или в dev режиме с nodemon
npm run dev

По умолчанию сервер слушает PORT из .env или 5000.

Дополнительно: helper-скрипт для безопасного локального запуска

Если вы не хотите класть реальные секреты в `backend/.env` (рекомендуется),
скопируйте `backend/.env.local.example` → `backend/.env.local` и заполните реальные значения.

Затем используйте PowerShell-скрипт, который загрузит переменные окружения из
`backend/.env.local` и запустит сервер в той же сессии:

PowerShell (однократно):

pwsh -File ./backend/scripts/start-with-env.ps1

Этот подход устанавливает переменные окружения только в вашей сессии и не
сохраняет секреты в Git.

3) Как протестировать webhook в PowerShell

В PowerShell не используйте просто `curl -H ...`, потому что `curl` там — alias для Invoke-WebRequest и принимает Headers как словарь.

Правильный пример с Invoke-RestMethod:

$headers = @{ 'Content-Type' = 'application/json' }
$body = '{"order_id":"your-order-uuid","status":"paid"}'
Invoke-RestMethod -Uri 'http://localhost:5000/paysera/webhook' -Method Post -Headers $headers -Body $body

Или вызов реального curl.exe (если установлен) — обратите внимание на экранирование:

& curl.exe -X POST "http://localhost:5000/paysera/webhook" -H "Content-Type: application/json" -d "{\"order_id\":\"your-order-uuid\",\"status\":\"paid\"}"

4) Где посмотреть результаты


Если нужно — я могу добавить автоматический endpoint, который вернёт текущее значение env (без ключей) для отладки, но это небезопасно на продакшене.
Helper script
----------------
Я добавил `backend/scripts/create-env.ps1` — безопасный помощник для подготовки `backend/.env` с заполнителями или в интерактивном режиме.

Примеры использования:

Interactive (вставляете значения секретов в безопасном режиме — они не выводятся в лог):

```powershell
pwsh -File .\backend\scripts\create-env.ps1 -Interactive
```

Non-interactive (создаёт файл с заполнителями, которые вы замените вручную):

```powershell
pwsh -File .\backend\scripts\create-env.ps1
```

После создания `backend/.env` замените заполнители на реальные ключи и перезапустите сервер.
