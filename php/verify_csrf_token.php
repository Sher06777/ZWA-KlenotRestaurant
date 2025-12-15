<?php
/**
 * verify_csrf_token.php
 *
 * Middleware: ověřuje CSRF token pro metody: POST, PUT, PATCH, DELETE.
 * Pokud token chybí nebo je neplatný — vrátí 403 a nový token v poli new_csrf.
 *
 * Obvykle se includuje na začátku skriptu.
 *
 * @package Security
 */

require_once __DIR__ . '/session_init.php';
require_once __DIR__ . '/security_headers.php';

$METHODS_TO_PROTECT = ['POST', 'PUT', 'PATCH', 'DELETE'];

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array(strtoupper($method), $METHODS_TO_PROTECT, true)) {
    return;
}

/**
 * Pokusy získat CSRF token z různých zdrojů:
 *  - POST pole csrf_token
 *  - hlavičky HTTP_X_CSRF_TOKEN, HTTP_X_XSRF_TOKEN, HTTP_X_CSRF
 *  - serverový klíč X-CSRF-Token (bez HTTP_)
 *  - cookie XSRF-TOKEN (double submit)
 *  - JSON tělo (pokud Content-Type obsahuje application/json)
 *
 * @return string|null
 */
function get_request_csrf_token() {
    // POST field (form-data / x-www-form-urlencoded)
    if (!empty($_POST['csrf_token'])) {
        return (string)$_POST['csrf_token'];
    }

    // Заголовки — нормализуем имена в lower-case
    $hdrs = [];
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            $hdrs[strtolower($k)] = $v;
        }
    } else {
        // fallback — берем из $_SERVER
        foreach ($_SERVER as $k => $v) {
            if (strpos($k, 'HTTP_') === 0) {
                $name = strtolower(str_replace('_', '-', substr($k, 5)));
                $hdrs[$name] = $v;
            }
        }
    }

    $candidates = ['x-csrf-token','x-xsrf-token','x-csrf-token','x-xsrf-token'];
    foreach ($candidates as $h) {
        if (!empty($hdrs[$h])) return (string)$hdrs[$h];
    }

    // cookie (double submit)
    if (!empty($_COOKIE['XSRF-TOKEN'])) return (string)$_COOKIE['XSRF-TOKEN'];

    // JSON body — аккуратно: если мы читаем stream, запомним результат в глобале
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        if ($raw) {
            $json = json_decode($raw, true);
            if (is_array($json)) {
                // Сохранить распарсенное тело, чтобы основной скрипт мог его использовать
                $GLOBALS['REQUEST_JSON_BODY'] = $json;
                if (!empty($json['csrf_token'])) {
                    return (string)$json['csrf_token'];
                }
            }
        }
    }

    return null;
}

/**
 * Odpověď při neúspěšné CSRF kontrole:
 *  - vygeneruje nový token,
 *  - vloží ho do hlavičky X-CSRF-Token,
 *  - vrátí JSON { success: false, message, new_csrf }
 *
 * @param string $msg Chybová zpráva
 * @return void
 */
function respond_csrf_failure($msg) {
    $new = get_csrf_token(); // определена в session_init.php

    header('X-CSRF-Token: ' . $new);
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => $msg,
        'new_csrf' => $new
    ]);
    exit;
}

if (empty($_SESSION['csrf_token'])) {
    get_csrf_token();
}

$req = get_request_csrf_token();
$sess = $_SESSION['csrf_token'] ?? '';

if (!$req) {
    respond_csrf_failure('CSRF token not provided');
}

if (!is_string($req) || !is_string($sess) || !hash_equals($sess, $req)) {
    respond_csrf_failure('Invalid CSRF token');
}

return;
