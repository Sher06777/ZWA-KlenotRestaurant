<?php
// session_init.php — безопасный и корректный старт сессии.
// ВАЖНО: никакого echo, var_dump, пробелов и BOM до этого файла!

// 1) Если сессия ещё НЕ запущена — задаём параметры
if (session_status() !== PHP_SESSION_ACTIVE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['SERVER_PORT'] ?? '') == 443;

    // НЕ указываем 'domain' — делаем host-only cookie (это предотвратит дублировние)
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    ini_set('session.use_strict_mode', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_secure', $isHttps ? '1' : '0');
    ini_set('session.use_cookies', '1');
    ini_set('session.use_only_cookies', '1');

    session_start();
}

// 4) Функция выдачи токена (если используешь её здесь)
if (!function_exists('get_csrf_token')) {
    function get_csrf_token() {
        if (empty($_SESSION['csrf_token'])) {
            try {
                $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            } catch (Exception $e) {
                $_SESSION['csrf_token'] = bin2hex(openssl_random_pseudo_bytes(32));
            }
        }
        return $_SESSION['csrf_token'];
    }
}