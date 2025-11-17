<?php
include 'auth.php';

header('Content-Type: application/json; charset=utf-8');

$login = trim($_POST['login'] ?? '');
$email = trim($_POST['email'] ?? '');
$newPassword = trim($_POST['password'] ?? '');
$user_id = $currentUserId;


if ($newPassword) {
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?");
    $stmt->bind_param("sssi", $login, $email, $passwordHash, $currentUserId);
} else {
    $stmt = $conn->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
    $stmt->bind_param("ssi", $login, $email, $currentUserId);
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