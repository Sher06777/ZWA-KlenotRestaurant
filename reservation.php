<?php
header('Content-Type: application/json; charset=utf-8');
include __DIR__ . '/db.php';

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

// Проверка обязательных полей
if (empty($name) || empty($phone) || empty($email) || empty($date) || empty($time) || $people < 1) {
    echo json_encode(['success' => false, 'error' => 'Пожалуйста, заполните все обязательные поля.']);
    exit;
}

// Подготавливаем SQL-запрос
$stmt = $conn->prepare("
    INSERT INTO reservations (name, phone, email, date, time, people, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => $conn->error]);
    exit;
}

$stmt->bind_param("sssssis", $name, $phone, $email, $date, $time, $people, $message);

// Выполняем запрос
if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $stmt->error]);
}

$stmt->close();
$conn->close();
