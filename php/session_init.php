<?php
/**
 * session_init.php
 *
 * Inicializace session s bezpečnými parametry cookie.
 * Dále poskytuje funkci get_csrf_token() pro generování / získání CSRF tokenu.
 *
 * @package Session
 */

if (session_status() !== PHP_SESSION_ACTIVE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['SERVER_PORT'] ?? '') == 443;

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

if (!function_exists('get_csrf_token')) {
    /**
     * Vrací (a pokud je potřeba vytvoří) CSRF token uložený v session.
     *
     * @return string CSRF token (hex)
     */
    function get_csrf_token() {
        if (empty($_SESSION['csrf_token'])) {
            try {
                $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            } catch (Exception $e) {
                $_SESSION['csrf_token'] = bin2hex(openssl_random_pseudo_bytes(32));
            }
        }

        // выставляем cookie доступное JS (double-submit)
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['SERVER_PORT'] ?? '') == 443;
        setcookie('XSRF-TOKEN', $_SESSION['csrf_token'], [
            'expires' => 0,
            'path' => '/',
            'secure' => $isHttps,
            'httponly' => false, // JS должен уметь читать cookie
            'samesite' => 'Lax'
        ]);

        return $_SESSION['csrf_token'];
    }
}
