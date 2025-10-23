<?php
include __DIR__ . '/db.php';

// Проверяем соединение
if (!isset($conn)) {
    die('Ошибка соединения с базой.');
}

// Получаем данные из формы (с защитой)
$name = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$email = trim($_POST['email'] ?? '');
$date = trim($_POST['date'] ?? '');
$time = trim($_POST['time'] ?? '');
$people = intval($_POST['people'] ?? 0);
$message = trim($_POST['message'] ?? '');

// Проверка обязательных полей
if (empty($name) || empty($phone) || empty($email) || empty($date) || empty($time) || $people < 1) {
    die('Пожалуйста, заполните все обязательные поля.');
}

// Подготавливаем SQL-запрос
$stmt = $conn->prepare("
    INSERT INTO reservations (name, phone, email, date, time, people, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
    die('Ошибка запроса: ' . htmlspecialchars($conn->error));
}

$stmt->bind_param("sssssis", $name, $phone, $email, $date, $time, $people, $message);

// Выполняем запрос
if ($stmt->execute()) {
    echo "<h2>✅ Бронирование успешно добавлено!</h2>";
    echo "<p><strong>Имя:</strong> " . htmlspecialchars($name) . "</p>";
    echo "<p><strong>Телефон:</strong> " . htmlspecialchars($phone) . "</p>";
    echo "<p><strong>Email:</strong> " . htmlspecialchars($email) . "</p>";
    echo "<p><strong>Дата:</strong> " . htmlspecialchars($date) . "</p>";
    echo "<p><strong>Время:</strong> " . htmlspecialchars($time) . "</p>";
    echo "<p><strong>Количество человек:</strong> " . htmlspecialchars($people) . "</p>";
    if (!empty($message)) {
        echo "<p><strong>Комментарий:</strong> " . htmlspecialchars($message) . "</p>";
    }
} else {
    echo "Ошибка при добавлении бронирования: " . htmlspecialchars($stmt->error);
}

$stmt->close();
$conn->close();

