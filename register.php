<?php
include('db.php');

header('Content-Type: application/json; charset=utf-8');

$response = [];

$login = trim($_POST['login'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

if (!$login || !$email || !$password) {
    $response['success'] = false;
    $response['message'] = 'Пожалуйста, заполните все поля!';
    echo json_encode($response);
    exit;
}

// Проверка, есть ли такой email
$checkSql = "SELECT id FROM users WHERE email = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$checkStmt->store_result();

if ($checkStmt->num_rows > 0) {
    $response['success'] = false;
    $response['message'] = "Пользователь с таким email уже существует!";
    echo json_encode($response);
    $checkStmt->close();
    $conn->close();
    exit;
}
$checkStmt->close();

// Хэшируем пароль
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Вставка нового пользователя
$sql = "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $login, $email, $hashedPassword);

try {
    $stmt->execute();
    $response['success'] = true;
    $response['message'] = "Регистрация прошла успешно!";
} catch (mysqli_sql_exception $e) {
    $response['success'] = false;
    $response['message'] = "Ошибка сервера: " . $e->getMessage();
}

$stmt->close();
$conn->close();

echo json_encode($response);
exit;
