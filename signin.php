<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', 0);
include 'security_headers.php';
include 'db.php';
session_start();
$response = [];

$login = trim($_POST['login'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');
$maxAttempts = 8;
$lockTime = 10;

if (!$login || !$email || !$password) {
    $response['success'] = false;
    $response['message'] = 'Все поля обязательны';
    echo json_encode($response);
    exit;
}

// Проверяем, есть ли пользователь с таким email
//def SQL-injection - attack
$sql = "SELECT id, name, email, password FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $response['success'] = false;
    $response['message'] = 'Пользователь не найден';
    echo json_encode($response);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success'=>false,'message'=>'Неверный email']); exit;
}

if (!isset($_SESSION['failed_login_attempts'])) $_SESSION['failed_login_attempts'] = 0;
if (!isset($_SESSION['last_failed_login'])) $_SESSION['last_failed_login'] = 0;

if ($_SESSION['failed_login_attempts'] >= $maxAttempts && (time() - $_SESSION['last_failed_login']) < $lockTime) {
    echo json_encode(['success'=>false,'message'=>'Слишком много попыток. Попробуйте позже.']);
    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password'])) {
    $_SESSION['failed_login_attempts']++;
    $_SESSION['last_failed_login'] = time();

    echo json_encode(['success' => false, 'message' => 'Неверный пароль']);
    exit;
}

unset($_SESSION['failed_login_attempts']);
unset($_SESSION['last_failed_login']);

// Всё успешно — создаём сессию
session_regenerate_id(true);
$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];

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
