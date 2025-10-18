<?php
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
session_start();
$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];

$response['success'] = true;
$response['message'] = 'Вход выполнен';

echo json_encode($response);
exit;
