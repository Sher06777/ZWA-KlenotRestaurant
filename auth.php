<?php
include 'security_headers.php';
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '.zwa.toad.cz',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();
include 'db.php';

// Проверка авторизации
$currentUserId = $_SESSION['user_id'] ?? 0;
if (!$currentUserId) {
    http_response_code(401);
    echo json_encode(['success'=>false, 'error'=>'Не авторизован']);
    exit;
}

//def CSRF (Cross-Site Request Forgery) - attack
// Проверка CSRF для POST-запросов
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1) сначала из стандартного $_POST
    $csrf_token = $_POST['csrf_token'] ?? '';

    // 2) если пусто и запрос пришёл как JSON — разберём тело
    if (empty($csrf_token)) {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
            $csrf_token = $json['csrf_token'] ?? $json['csrf'] ?? $csrf_token;
        }
    }

    // 3) если ещё пусто — попробуем заголовок X-CSRF-Token
    if (empty($csrf_token)) {
        $headers = getallheaders();
        $csrf_token = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? $csrf_token;
    }

    if (!verify_csrf_token($csrf_token)) {
        http_response_code(403);
        echo json_encode(['success'=>false, 'error'=>'CSRF токен неверен']);
        exit;
    }
}
