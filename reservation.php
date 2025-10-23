<?php
include __DIR__ . '/db.php';

if (!isset($conn)) {
    die('Ошибка соединения с базой.');
}

$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$date = $_POST['date'] ?? '';
$time = $_POST['time'] ?? '';
$guests = $_POST['guests'] ?? '';

if (!$name || !$email || !$date || !$time || !$guests) {
    die('Все поля обязательны.');
}

$stmt = $conn->prepare("INSERT INTO reservations (name, email, date, time, guests) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("ssssi", $name, $email, $date, $time, $guests);
$stmt->execute();

echo "Бронирование успешно добавлено!";
