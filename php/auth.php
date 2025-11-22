<?php
require_once 'session_init.php';
include 'security_headers.php';
include 'db.php';

// Разрешаем check_session.php работать без авторизации
if (basename($_SERVER['PHP_SELF']) === 'check_session.php') {
    return; // ⬅️ просто выходим, не делаем проверок
}

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

    // 3) если ещё пусто — попробуем заголовки (безопасный fallback)
    if (empty($csrf_token)) {
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
        } else {
            // fallback — собрать заголовки из $_SERVER
            $headers = [];
            foreach ($_SERVER as $k => $v) {
                if (strpos($k, 'HTTP_') === 0) {
                    $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($k, 5)))));
                    $headers[$name] = $v;
                }
            }
        }
        $csrf_token = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? $headers['X-Csrf-Token'] ?? $csrf_token;
    }

    if (!verify_csrf_token($csrf_token)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'CSRF токен неверен']);
        exit;
    }
}
