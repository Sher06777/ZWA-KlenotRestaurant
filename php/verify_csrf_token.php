<?php
// verify_csrf_token.php — безопасная проверка CSRF
// Должен подключаться в начале любого POST/PUT/PATCH/DELETE эндпоинта

require_once __DIR__ . '/session_init.php';
require_once __DIR__ . '/security_headers.php';

// Методы, которые требуют защиту
$METHODS_TO_PROTECT = ['POST', 'PUT', 'PATCH', 'DELETE'];

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array(strtoupper($method), $METHODS_TO_PROTECT, true)) {
    // GET/HEAD/OPTIONS не требуют CSRF
    return;
}

/**
 * Извлекать токен из POST, заголовков, JSON body или cookie XSRF-TOKEN
 */
function get_request_csrf_token() {
    // 1) POST
    if (!empty($_POST['csrf_token'])) {
        return (string)$_POST['csrf_token'];
    }

    // 2) Common headers (Apache/Nginx)
    $headers = [
        'HTTP_X_CSRF_TOKEN',
        'HTTP_X_XSRF_TOKEN',
        'HTTP_X_CSRF',
    ];
    foreach ($headers as $h) {
        if (!empty($_SERVER[$h])) {
            return (string)$_SERVER[$h];
        }
    }

    // 3) Some servers use X-CSRF-Token without HTTP_
    if (!empty($_SERVER['X-CSRF-Token'])) {
        return (string)$_SERVER['X-CSRF-Token'];
    }

    // 4) Cookie (double-submit)
    if (!empty($_COOKIE['XSRF-TOKEN'])) {
        return (string)$_COOKIE['XSRF-TOKEN'];
    }

    // 5) JSON body
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        if ($raw) {
            $json = json_decode($raw, true);
            if (is_array($json) && !empty($json['csrf_token'])) {
                return (string)$json['csrf_token'];
            }
        }
    }

    return null;
}

/**
 * Ответ об ошибке
 */
function respond_csrf_failure($msg) {
    $new = get_csrf_token(); // всегда отдаём актуальный токен

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

// ---- Основная логика ----

// Гарантируем, что токен в сессии есть
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

// Если дошли сюда — всё в порядке, выполнение продолжается
return;
