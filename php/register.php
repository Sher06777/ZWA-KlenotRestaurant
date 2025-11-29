<?php
// Suppress notices/warnings in production, still log errors in server logs
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', 0);

require_once 'session_init.php';
include 'security_headers.php';
include 'db.php';

header('Content-Type: application/json; charset=utf-8');

$login = trim($_POST['login'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');
$confirmPassword = trim($_POST['password_confirm'] ?? '');
$createdAt = getCzechTime();


// Required fields
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

// Basic validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'fields' => ['email'],
        'field' => 'email',
        'message' => 'Please enter a valid email'
    ]);
    exit;
}
if ($password !== $confirmPassword) {
    echo json_encode([
        'success' => false,
        'field' => 'password_confirm',
        'message' => 'Passwords do not match'
    ]);
    exit;
}

// Optional: enforce login constraints (length & allowed chars)
if (mb_strlen($login) < 3 || mb_strlen($login) > 80) {
    echo json_encode(['success' => false, 'field' => 'login', 'message' => 'Login must be 3..80 chars']);
    exit;
}
if (!preg_match('/^[\p{L}\p{N}_\.\-]+$/u', $login)) {
    echo json_encode(['success' => false, 'field' => 'login', 'message' => 'Login contains invalid characters']);
    exit;
}

try {
    // Check if email already exists
    $checkSql = "SELECT id FROM users WHERE email = ?";
    $checkStmt = $conn->prepare($checkSql);
    if (!$checkStmt) throw new Exception('DB prepare failed');
    $checkStmt->bind_param("s", $email);
    $checkStmt->execute();
    $checkStmt->store_result();

    if ($checkStmt->num_rows > 0) {
        $checkStmt->close();
        echo json_encode([
            'success' => false,
            'field' => 'email',
            'message' => 'Email is already registered'
        ]);
        exit;
    }
    $checkStmt->close();

    // Hash password and insert
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)");
    if (!$stmt) throw new Exception('DB prepare failed (insert)');
    $stmt->bind_param("ssss", $login, $email, $hashedPassword, $createdAt);
    $stmt->execute();
    $userId = $stmt->insert_id;
    $stmt->close();

    // Create session for new user
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$userId;
    $_SESSION['user_name'] = htmlspecialchars($login, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $_SESSION['user_email'] = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $_SESSION['isAdmin'] = 0;

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => (int)$userId,
            'name' => $login,
            'email' => $email
        ]
    ]);
    exit;

} catch (Throwable $e) {
    error_log('register.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error'
    ]);
    exit;
}