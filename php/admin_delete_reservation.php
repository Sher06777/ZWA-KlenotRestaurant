<?php
include 'auth.php'; // подключаем для проверки авторизации и CSRF


// Доступ только для авторизованного администратора
if (!isset($_SESSION['user_id']) || empty($_SESSION['isAdmin'])) {
    echo json_encode(['success' => false, 'error' => 'Недостаточно прав']);
    exit;
}

// CSRF проверка
// auth.php уже проверяет CSRF для POST, но если хочешь двойную проверку через verify_csrf_token, можно оставить
$csrf = $_POST['csrf_token'] ?? '';
if (!verify_csrf_token($csrf)) {
    echo json_encode(['success' => false, 'error' => 'Неверный CSRF token']);
    exit;
}

// Получаем ID резервации
$reservationId = intval($_POST['id'] ?? 0);
if ($reservationId < 1) {
    echo json_encode(['success' => false, 'error' => 'Некорректный ID']);
    exit;
}

// Удаляем резервацию
$stmt = $conn->prepare("DELETE FROM reservations WHERE id = ?");
$stmt->bind_param("i", $reservationId);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $stmt->error]);
}

$stmt->close();
$conn->close();
exit;
