<?php
session_start();
require 'db.php'; // подключение к БД
header('Content-Type: application/json; charset=utf-8');

$data = json_decode(file_get_contents("php://input"), true);
$login = trim($data['login'] ?? '');
$email = trim($data['email'] ?? '');
$userId = $_SESSION['user_id'] ?? null;
$newPassword = trim($data['password'] ?? '');

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Пользователь не авторизован']);
    exit;
}

if ($newPassword) {
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?");
    $stmt->bind_param("sssi", $login, $email, $passwordHash, $userId);
} else {
    $stmt = $conn->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
    $stmt->bind_param("ssi", $login, $email, $userId);
}

if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Ошибка подготовки запроса: ' . $conn->error]);
    exit;
}

// Выполняем
if ($stmt->execute()) {
    $_SESSION['user_name'] = $login;
    $_SESSION['user_email'] = $email;
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Ошибка при обновлении: ' . $stmt->error]);
}
$stmt->close();
?>