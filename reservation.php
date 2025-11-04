<?php
include 'auth.php';

// Проверяем соединение
if (!isset($conn)) {
    echo json_encode(['success' => false, 'error' => 'Ошибка соединения с базой.']);
    exit;
}

// Получаем данные из POST
$name = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$email = trim($_POST['email'] ?? '');
$date = trim($_POST['date'] ?? '');
$time = trim($_POST['time'] ?? '');
$people = intval($_POST['people'] ?? 0);
$message = trim($_POST['message'] ?? '');
$user_id = $currentUserId;


if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Неверный формат email.']); exit;
}
// телефон: допускаем цифры, + и пробелы
if (!preg_match('/^[0-9+\s\-()]{7,20}$/u', $phone)) {
    echo json_encode(['success' => false, 'error' => 'Неверный формат телефона.']); exit;
}
// дата: простая проверка YYYY-MM-DD
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !strtotime($date)) {
    echo json_encode(['success' => false, 'error' => 'Неверная дата.']); exit;
}
// время: HH:MM
if (!preg_match('/^\d{2}:\d{2}$/', $time)) {
    echo json_encode(['success' => false, 'error' => 'Неверное время.']); exit;
}
if ($people < 1 || $people > 20) {
    echo json_encode(['success' => false, 'error' => 'Некорректное количество гостей.']); exit;
}

// Проверка обязательных полей
if (empty($name) || empty($phone) || empty($email) || empty($date) || empty($time) || $people < 1) {
    echo json_encode(['success' => false, 'error' => 'Пожалуйста, заполните все обязательные поля.']);
    exit;
}

// Подготавливаем SQL-запрос
$stmt = $conn->prepare("
    INSERT INTO reservations (user_id, name, phone, email, date, time, people, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => $conn->error]);
    exit;
}
//def SQL-injection - attack
$stmt->bind_param("isssssis", $user_id, $name, $phone, $email, $date, $time, $people, $message);

// Выполняем запрос
if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $stmt->error]);
}

$stmt->close();
$conn->close();
