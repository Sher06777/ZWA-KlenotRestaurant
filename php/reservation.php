<?php
/**
 * reservation.php
 *
 * Vytvoření rezervace uživatelem. Očekává POST pole:
 * name, phone, email, date (YYYY-MM-DD), time (HH:MM), people (int), message (volitelné).
 *
 * Vrací JSON { success: true } nebo { success: false, error: "..."}
 *
 * @package Reservations
 */

include_once 'auth.php';

if (!isset($conn)) {
    echo json_encode(['success' => false, 'error' => 'Ошибка соединения с базой.']);
    exit;
}

if (!$currentUserId) {
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка: вы не авторизованы.'
    ]);
    exit;
}

$name = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$email = trim($_POST['email'] ?? '');
$date = trim($_POST['date'] ?? '');
$time = trim($_POST['time'] ?? '');
$people = intval($_POST['people'] ?? 0);
$message = trim($_POST['message'] ?? '');
$createdAt = getCzechTime();
$user_id = $currentUserId;

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Неверный формат email.']); exit;
}

if (!preg_match('/^[0-9+\s\-()]{7,20}$/u', $phone)) {
    echo json_encode(['success' => false, 'error' => 'Неверный формат телефона.']); exit;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !strtotime($date)) {
    echo json_encode(['success' => false, 'error' => 'Неверная дата.']); exit;
}

if (!preg_match('/^\d{2}:\d{2}$/', $time)) {
    echo json_encode(['success' => false, 'error' => 'Неверное время.']); exit;
}
if ($people < 1 || $people > 20) {
    echo json_encode(['success' => false, 'error' => 'Некорректное количество гостей.']); exit;
}

if (empty($name) || empty($phone) || empty($email) || empty($date) || empty($time) || $people < 1) {
    echo json_encode(['success' => false, 'error' => 'Пожалуйста, заполните все обязательные поля.']);
    exit;
}

$stmt = $conn->prepare("
    INSERT INTO reservations (user_id, name, phone, email, date, time, people, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
    error_log('reservation insert failed: ' . $conn->error);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

$stmt->bind_param("isssssiss", $user_id, $name, $phone, $email, $date, $time, $people, $message, $createdAt);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $stmt->error]);
}

$stmt->close();
$conn->close();
