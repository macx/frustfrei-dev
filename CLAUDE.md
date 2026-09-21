# Projektnotizen: frustfrei.dev (vormals HAWK GT1191)

## Releases (`pnpm release`)

`pnpm release` führt lokal lint, build, check-links und `release-it` aus.
`release-it` braucht `GITHUB_TOKEN` in der Umgebung, um den GitHub-Release
direkt per API anzulegen — sonst fällt es auf einen manuellen Web-Link
zurück und die Deploy-Pipeline (Trigger: `release: published` in
`.github/workflows/main.yml`) löst nicht automatisch aus.

Der `release`-Skript-Eintrag in `package.json` holt den Token deshalb live
aus der bereits authentifizierten `gh`-CLI-Session (`gh auth token`) statt
ihn irgendwo statisch abzulegen. Kein separater Personal Access Token
nötig — `gh` läuft nur lokal (nie in CI) und hat bereits ausreichend
`repo`-Scope. Falls das je bricht: `gh auth status` prüfen, ob der
`repo`-Scope noch vorhanden ist.

`release-it` erwartet ein sauberes Arbeitsverzeichnis (`git diff --quiet
HEAD`) — vor dem Release also erst alle Änderungen committen.

## Deploy-Pipeline

- Trigger: `release: published` (automatisch) oder `workflow_dispatch`
  (manueller Testdeploy, z. B. per `gh workflow run main.yml --ref <branch>`)
- Ziel: rsync nach `${{ secrets.REMOTE_TARGET }}` auf dem Plesk-vServer,
  Secrets `REMOTE_HOST`/`REMOTE_USER`/`SSH_PRIVATE_KEY`/`REMOTE_TARGET`
- Releases werden von `main` geschnitten; `develop` nach jedem Release
  per Fast-Forward-Merge synchron halten

## Bekannte MDX/Prettier-Falle

Prettier (`pnpm lint`) formatiert nummerierte Listen innerhalb eines
**top-level** `<Steps>` (nicht in `<TabItem>` verschachtelt) so um, dass
ab dem zweiten Listenpunkt die Einrückung verloren geht — dadurch fallen
verschachtelte Codeblöcke/JSX-Komponenten aus dem Listenelement heraus
und `astro build` bricht mit `Expected the closing tag </Steps>...` ab.
Betroffene Dateien sind in `.prettierignore` von Prettier ausgenommen.
Neue `<Steps>`-Blöcke außerhalb von `<TabItem>` vorsichtshalber nach
`pnpm lint` per `pnpm build` verifizieren, bevor committed wird.
