PR Ready helper
================

Этот файл содержит готовые команды для создания ветки `apply-sql`, добавления изменений и создания PR.

1) Создать и переключиться на ветку:

```bash
git checkout -b apply-sql
```

2) Добавить файлы (если вы хотите включить все изменения, или укажите конкретные):

```bash
git add .github/workflows/apply-supabase-sql.yml \
        .github/workflows/apply-supabase-sql-on-push.yml \
        .github/PR_APPLY_INSTRUCTIONS.md \
        scripts/SQL_MANUAL_APPLY.md
```

3) Закоммитить и запушить:

```bash
git commit -m "chore(ci): add apply-supabase workflows and docs"
git push origin apply-sql
```

4) Создать Pull Request в GitHub (через веб-интерфейс или gh CLI):

```bash
# Пример с gh (GitHub CLI):
gh pr create --base main --head apply-sql --title "chore(ci): apply supabase sql" --body "Run SQL applier in CI (diagnostics + logs)"
```

После пуша workflow `apply-supabase-sql-on-push.yml` запустится автоматически. Не забудьте добавить секрет `SUPABASE_DATABASE_URL` в Settings → Secrets → Actions перед запуском.
