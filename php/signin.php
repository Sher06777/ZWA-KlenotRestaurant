<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once 'session_init.php';
include 'security_headers.php';
include 'db.php';

header('Content-Type: application/json; charset=utf-8');

// Получаем данные
$login = trim($_POST['login'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

// CSRF
if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid CSRF token', 'error_code' => 'CSRF']);
    exit;
}

// Проверка наличия полей
$missing = [];
if ($login === '') $missing[] = 'login';
if ($email === '') $missing[] = 'email';
if ($password === '') $missing[] = 'password';
if (!empty($missing)) {
    echo json_encode([
        'success' => false,
        'message' => 'Required fields missing',
        'fields' => $missing,
        'field' => $missing[0]
    ]);
    exit;
}

// Простая валидация email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email.', 'field' => 'email']);
    exit;
}

// rate-limit / lockout
$maxAttempts = 8;
$lockTime = 300; // seconds

if (!isset($_SESSION['failed_login_attempts'])) $_SESSION['failed_login_attempts'] = 0;
if (!isset($_SESSION['last_failed_login'])) $_SESSION['last_failed_login'] = 0;

// Если было превышение — проверим, истёк ли lockTime; если истёк — сбрасываем счётчик
if ($_SESSION['failed_login_attempts'] >= $maxAttempts) {
    $since = time() - (int)$_SESSION['last_failed_login'];
    if ($since >= $lockTime) {
        // сбрасываем — можно снова пытаться
        $_SESSION['failed_login_attempts'] = 0;
        $_SESSION['last_failed_login'] = 0;
    } else {
        // ещё в блокировке — возвращаем 429
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'message' => 'Too many attempts. Try again later.',
            'error_code' => 'LOCKED',
            'retry_after' => $lockTime - $since
        ]);
        exit;
    }
}

// Prepared statement — проверяем пользователя с совпадающим email и login
$sql = "SELECT id, name, email, password, isAdmin FROM users WHERE email = ? AND name = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error (DB).']);
    exit;
}
$stmt->bind_param("ss", $email, $login);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // Не даём подсказок — общий текст
    $_SESSION['failed_login_attempts']++;
    $_SESSION['last_failed_login'] = time();
    echo json_encode(['success' => false, 'message' => 'Invalid login, email or password', 'field' => 'password']);
    exit;
}

$user = $result->fetch_assoc();

// Проверка пароля
if (!password_verify($password, $user['password'])) {
    $_SESSION['failed_login_attempts']++;
    $_SESSION['last_failed_login'] = time();
    echo json_encode(['success' => false, 'message' => 'Invalid login, email or password', 'field' => 'password']);
    exit;
}

// Успешный вход — сбрасываем счётчики
unset($_SESSION['failed_login_attempts']);
unset($_SESSION['last_failed_login']);

session_regenerate_id(true);
$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['isAdmin'] = (int)$user['isAdmin'];

// обновляем время последнего входа
$czechTime = getCzechTime();
$update = $conn->prepare("UPDATE users SET last_login = ? WHERE id = ?");
if ($update) {
    $update->bind_param("si", $czechTime, $user['id']);
    $update->execute();
}

// формируем безопасную маску пароля (для frontend)
$passLen = strlen($user['password'] ?? '');
$password_mask = $passLen >= 2
    ? $user['password'][0] . str_repeat('•', $passLen - 2) . $user['password'][$passLen-1]
    : str_repeat('•', $passLen);

$response = [
    'success' => true,
    'message' => 'Logged in',
    'user_id' => (int)$user['id'],
    'user_name' => $user['name'],
    'user_email' => $user['email'],
    'password_mask' => $password_mask
];

echo json_encode($response);
exit;