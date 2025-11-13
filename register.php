<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', 0);
include 'session_init.php';
include 'security_headers.php';
include 'db.php';


header('Content-Type: application/json; charset=utf-8');

$login = trim($_POST['login'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');
$confirmPassword = trim($_POST['password_confirm'] ?? '');

// Проверка обязательных полей
$missing = [];
if ($login === '') $missing[] = 'login';
if ($email === '') $missing[] = 'email';
if ($password === '') $missing[] = 'password';
if ($confirmPassword === '') $missing[] = 'password_confirm';


if (!empty($missing)) {
    echo json_encode([
        'success' => false,
        'fields' => $missing,
        'field' => $missing[0]
    ]);
    exit;
}

// Валидация email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'fields' => ['email'],
        'field' => 'email'
    ]);
    exit;
}

// Проверка совпадения пароля
if ($password !== $confirmPassword) {
    echo json_encode([
        'success' => false,
        'field' => 'password_confirm',
        'message' => 'Пароли не совпадают'
    ]);
    exit;
}

// Проверка существующего пользователя
$checkSql = "SELECT id FROM users WHERE email = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$checkStmt->store_result();

if ($checkStmt->num_rows > 0) {
    echo json_encode([
        'success' => false,
        'field' => 'email',
        'message' => 'Такой email уже зарегистрирован'
    ]);
    $checkStmt->close();
    $conn->close();
    exit;
}
$checkStmt->close();

// Хэшируем пароль
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Вставка нового пользователя
$stmt = $conn->prepare("INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())");
$stmt->bind_param("sss", $login, $email, $hashedPassword);

try {
    $stmt->execute();
    $userId = $stmt->insert_id; // ID нового пользователя

    // ==== Добавляем сессию для нового пользователя ====
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_name'] = $login;

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $userId,
            'name' => $login,
            'email' => $email
        ]
    ]);
} catch (mysqli_sql_exception $e) {
    echo json_encode([
        'success' => false,
        'fields' => [],
        'field' => '',
        'error' => 'Ошибка сервера'
    ]);
}

$stmt->close();
$conn->close();
exit;