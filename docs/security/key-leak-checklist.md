# Secret-key leak checklist

Use a safe local checkout. These checks must not print or open `.env` contents. Do not paste secret values into reports, screenshots, or chat.

- [ ] No `.env` file is tracked by Git. Command: `git ls-files --cached -- .env .env.*` (no output means no matching files are tracked).
- [ ] `.gitignore` lists `.env*`. Command: `Select-String -LiteralPath .gitignore -SimpleMatch '.env*'` (a matching line confirms the ignore entry).
- [ ] Search the repository for `sk_test_`, `sk_live_`, `RESEND_API_KEY=` and `postgres://`, excluding `.env` files. Command: `rg -n --hidden -g '!**/.env*' -g '!.git/**' -g '!node_modules/**' 'sk_test_|sk_live_|RESEND_API_KEY=|postgres://' .`
- [ ] Search Git history for `sk_test_`. Command: `git log --all --oneline -S'sk_test_' -- .` (review matching commit metadata; do not dump secret-bearing file contents).
- [ ] No secret uses a `NEXT_PUBLIC_` prefix. Command: `rg -n --hidden -g '!**/.env*' -g '!.git/**' -g '!node_modules/**' 'NEXT_PUBLIC_[A-Za-z0-9_]*(KEY|SECRET|TOKEN|PASSWORD)' .`
- [ ] Search the live site's browser Sources for `sk_`. Command/action: open DevTools → Sources, press `Ctrl+Shift+F`, and search for `sk_`; inspect matches without copying values.
- [ ] All required secrets exist in Vercel environment variables. Command: `vercel env ls` (check variable names and environments only; never display or copy values).

## If a key leaks

Tell the team, delete the exposed key, create a new one, update Vercel, and redeploy.
