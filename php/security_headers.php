<?php
// security_headers.php — набор строгих заголовков безопасности.
// Не генерируем nonce автоматически, потому что nonce требует согласованной генерации в шаблонах.
// Если нужно использовать nonce — сделаем отдельную реализацию.


// Content Security Policy — аккуратно, без динамического "nonce-<random>"
$csp = "default-src 'self'; "
     . "script-src 'self'; "
     . "style-src 'self'; "
     . "img-src 'self' data:; "
     . "font-src 'self'; "
     . "connect-src 'self' https:; "
     . "object-src 'none'; "
     . "base-uri 'self';";

header("Content-Security-Policy: $csp");
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer-when-downgrade');
header('X-XSS-Protection: 1; mode=block');
header('Permissions-Policy: geolocation=(), microphone=()'); // пример — настраивай по необходимости
// Дополнительно: можно добавить HSTS в production (включать осторожно)
// header('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
