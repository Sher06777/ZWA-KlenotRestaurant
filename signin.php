<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once 'session_init.php';
include 'security_headers.php';
include 'db.php';

header('Content-Type: application/json; charset=utf-8');

$response = [];

$login = trim($_POST['login'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

$missing = [];
if ($login === '') $missing[] = 'login';
if ($email === '') $missing[] = 'email';
if ($password === '') $missing[] = 'password';
if (!empty($missing)) {
    // вернём массив пропущенных полей и первый как field
    echo json_encode([
        'success' => false,
        'message' => 'Все поля обязательны',
        'fields' => $missing,
        'field' => $missing[0]
    ]);
    exit;
}

// параметры защиты от перебора
$maxAttempts = 8;
$lockTime = 300; // seconds (по твоему коду)

if (!$login || !$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Все поля обязательны']);
    exit;
}

// Сначала простая клиентская/серверная валидация email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Неверный формат email.', 'field' => 'email']);
    exit;
}

// Инициализация сессии атак/неудачных попыток
if (!isset($_SESSION['failed_login_attempts'])) $_SESSION['failed_login_attempts'] = 0;
if (!isset($_SESSION['last_failed_login'])) $_SESSION['last_failed_login'] = 0;

if ($_SESSION['failed_login_attempts'] >= $maxAttempts && (time() - $_SESSION['last_failed_login']) < $lockTime) {
    echo json_encode(['success' => false, 'message' => 'Слишком много попыток. Попробуйте чуть позже.']);
    exit;
}

// Проверяем, есть ли пользователь с таким email
$sql = "SELECT id, name, email, password FROM users WHERE email = ? AND name = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Ошибка сервера (prepare).']);
    exit;
}
$stmt->bind_param("ss", $email, $login);
$stmt->execute();
$result = $stmt->get_result();


if ($result->num_rows === 0) {
    // не показываем деталей безопасности — но даём внятный ответ
    echo json_encode(['success' => false, 'message' => 'Неверный логин, email или пароль', 'field' => 'password']);
    exit;
}

$user = $result->fetch_assoc();

// проверка пароля
if (!password_verify($password, $user['password'])) {
    $_SESSION['failed_login_attempts']++;
    $_SESSION['last_failed_login'] = time();

    echo json_encode(['success' => false, 'message' => 'Неверный логин, email или пароль', 'field' => 'password']);
    exit;
}

// успешный вход — сбрасываем счётчики
unset($_SESSION['failed_login_attempts']);
unset($_SESSION['last_failed_login']);

session_regenerate_id(true);
$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];

// маска пароля (оставлю как у тебя)
$passLen = strlen($user['password']);
$password_mask = $passLen >= 2
    ? $user['password'][0] . str_repeat('•', $passLen - 2) . $user['password'][$passLen-1]
    : str_repeat('•', $passLen);

$response = [
    'success' => true,
    'message' => 'Вход выполнен',
    'user_id' => $user['id'],
    'user_name' => $user['name'],
    'user_email' => $user['email'],
    'password_mask' => $password_mask
];

echo json_encode($response);
exit;