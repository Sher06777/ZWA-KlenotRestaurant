<?php
/**
 * signin.php
 *
 * Autentizace uživatele. Očekává POST: login, email, password.
 * Provádí jednoduchou ochranu proti brute-force pomocí session (failed_login_attempts).
 *
 * V případě úspěchu nastaví hodnoty v $_SESSION a vrátí data uživatele.
 *
 * @package Auth
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/session_init.php';
require_once __DIR__ . '/security_headers.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$login = trim($_POST['login'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

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

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email.', 'field' => 'email']);
    exit;
}

$maxAttempts = 8;
$lockTime = 300;

// Brute-force protection: counting failed attempts in session.
// Note: this is a simple protection; in production store limits per IP/user in DB/cache.
if (!isset($_SESSION['failed_login_attempts'])) $_SESSION['failed_login_attempts'] = 0;
if (!isset($_SESSION['last_failed_login'])) $_SESSION['last_failed_login'] = 0;

if ($_SESSION['failed_login_attempts'] >= $maxAttempts) {
    $since = time() - (int)$_SESSION['last_failed_login'];
    if ($since >= $lockTime) {
        $_SESSION['failed_login_attempts'] = 0;
        $_SESSION['last_failed_login'] = 0;
    } else {
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
        // Do not reveal which part is wrong — return a generic error.
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

    // Successful authentication — reset counters and regenerate session id.
    unset($_SESSION['failed_login_attempts']);
    unset($_SESSION['last_failed_login']);

    session_regenerate_id(true); // protection against session fixation
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['isAdmin'] = (int)($user['isAdmin'] ?? 0);

    $czechTime = getCzechTime();
    $update = $conn->prepare("UPDATE users SET last_login = ? WHERE id = ?");
    if ($update) {
        $update->bind_param("si", $czechTime, $user['id']);
        $update->execute();
        $update->close();
    }

    $password_mask = str_repeat('•', 8);

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
    error_log('signin.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error', 'field' => null]);
    exit;
}
