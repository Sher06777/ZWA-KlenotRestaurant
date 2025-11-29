<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'session_init.php';
include 'security_headers.php';
include 'db.php';

header('Content-Type: application/json; charset=utf-8');

// Read & trim inputs
$login = trim($_POST['login'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

// Required fields
$missing = [];
if ($login === '') $missing[] = 'login';
if ($email === '') $missing[] = 'email';
if ($password === '') $missing[] = 'password';
if (!empty($missing)) {
    echo json_encode([
        'success' => false,
        'message' => 'Required fields missing',
        'fields' => $missing,
        'field' => $missing[0]
    ]);
    exit;
}

// Basic email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email.', 'field' => 'email']);
    exit;
}

// Rate-limit parameters
$maxAttempts = 8;
$lockTime = 300; // seconds

if (!isset($_SESSION['failed_login_attempts'])) $_SESSION['failed_login_attempts'] = 0;
if (!isset($_SESSION['last_failed_login'])) $_SESSION['last_failed_login'] = 0;

// If attempts reached — check whether lock expired; if expired, reset counters
if ($_SESSION['failed_login_attempts'] >= $maxAttempts) {
    $since = time() - (int)$_SESSION['last_failed_login'];
    if ($since >= $lockTime) {
        // reset counters after lock expires
        $_SESSION['failed_login_attempts'] = 0;
        $_SESSION['last_failed_login'] = 0;
    } else {
        // still locked
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'message' => 'Too many attempts. Try again later.',
            'error_code' => 'LOCKED',
            'retry_after' => $lockTime - $since,
            'field' => null
        ]);
        exit;
    }
}

// Lookup user by email + login (prepared)
try {
    $sql = "SELECT id, name, email, password, isAdmin FROM users WHERE email = ? AND name = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('DB prepare failed');
    }
    $stmt->bind_param('ss', $email, $login);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        // increment failed attempts
        $_SESSION['failed_login_attempts']++;
        $_SESSION['last_failed_login'] = time();
        $stmt->close();
        echo json_encode([
            'success' => false,
            'message' => 'Invalid login, email or password',
            'field' => 'password'
        ]);
        exit;
    }

    $user = $result->fetch_assoc();
    $stmt->close();

    // Verify password
    if (!password_verify($password, $user['password'])) {
        $_SESSION['failed_login_attempts']++;
        $_SESSION['last_failed_login'] = time();
        echo json_encode([
            'success' => false,
            'message' => 'Invalid login, email or password',
            'field' => 'password'
        ]);
        exit;
    }

    // Successful login: reset counters and create session
    unset($_SESSION['failed_login_attempts']);
    unset($_SESSION['last_failed_login']);

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['isAdmin'] = (int)($user['isAdmin'] ?? 0);

    // Update last_login
    $czechTime = getCzechTime();
    $update = $conn->prepare("UPDATE users SET last_login = ? WHERE id = ?");
    if ($update) {
        $update->bind_param("si", $czechTime, $user['id']);
        $update->execute();
        $update->close();
    }

    // Provide a harmless password mask for frontend display (do NOT leak hash)
    $password_mask = str_repeat('•', 8);

    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Logged in',
        'user_id' => (int)$user['id'],
        'user_name' => $user['name'],
        'user_email' => $user['email'],
        'password_mask' => $password_mask
    ]);
    exit;

} catch (Throwable $e) {
    // Log internal error, but return a generic message to client
    error_log('signin.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error', 'field' => null]);
    exit;
}
