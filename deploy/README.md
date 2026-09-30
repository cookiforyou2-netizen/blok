# Выкладка на свой сервер

Это отдельный контур. Сборка платформы (`npm run build`, preset `vercel`) не меняется.

## Сборка

```sh
npm ci --omit=dev
npm run build:server
```

Результат: `.output/server/index.mjs`. База данных и миграции не нужны.

Перед сборкой можно явно оставить вход выключенным: `VITE_AUTH_ENABLED=false`.

## Каталоги

От пользователя службы, не от root:

```sh
sudo useradd --system --home /opt/ychy --shell /usr/sbin/nologin ychy
sudo mkdir -p /opt/ychy /var/lib/ychy/profiles /var/lib/ychy/files /var/lib/ychy/logs
sudo chown -R ychy:ychy /opt/ychy /var/lib/ychy
```

Скопировать проект в `/opt/ychy` после `npm run build:server`.

## Служба и nginx

```sh
sudo cp deploy/ychy.service /etc/systemd/system/ychy.service
sudo systemctl daemon-reload
sudo systemctl enable --now ychy
sudo cp deploy/nginx.conf /etc/nginx/sites-available/ychy
sudo ln -s /etc/nginx/sites-available/ychy /etc/nginx/sites-enabled/ychy
sudo nginx -t && sudo systemctl reload nginx
```

Приложение слушает `127.0.0.1:3000`. Снаружи открыт только nginx.

## Перезапуск

```sh
sudo systemctl restart ychy
curl -fsS http://127.0.0.1:3000/api/profile
```

Без `YCHY_DATA_DIR` ответ `{"mode":"browser"}`: профиль остаётся в браузере.

С каталогом данных первый запрос ставит cookie `ychy_uid`. Повтор после restart читает тот же `profiles/<id>/profile.json`. Чужой cookie — другой каталог.

Журнал ошибок: `/var/lib/ychy/logs/app.log` и `journalctl -u ychy`.

Файлы экспорта: `/var/lib/ychy/files/<id>/`.
