<?php
session_start();
include('db.php');
header('Content-Type: application/json; charset=utf-8');

$response = [];

$login = trim($_POST['login'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

if (!$login || !$email || !$password) {
    $response['success'] = false;
    $response['message'] = 'Все поля обязательны';
    echo json_encode($response);
    exit;
}

// Проверяем, есть ли пользователь с таким email
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

$user = $result->fetch_assoc();

// Проверяем пароль
if (!password_verify($password, $user['password'])) {
    $response['success'] = false;
    $response['message'] = 'Неверный пароль';
    echo json_encode($response);
    exit;
}

// Всё успешно — создаём сессию

$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];
$passLen = strlen($user['password']);
$password_mask = $passLen >= 2
    ? $user['password'][0] . str_repeat('•', $passLen - 2) . $user['password'][$passLen-1]
    : str_repeat('•', $passLen);

$response['password_mask'] = $password_mask;


$response['success'] = true;
$response['message'] = 'Вход выполнен';
$response['user_name'] = $user['name'];
$response['user_email'] = $user['email'];
$response['password_mask'] = $password_mask;

echo json_encode($response);
exit;
