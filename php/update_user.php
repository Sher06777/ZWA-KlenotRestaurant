<?php
/**
 * update_user.php
 *
 * Aktualizace údajů aktuálního uživatele (name a email), volitelně password.
 * Vyžaduje POST a autentizovaného uživatele.
 *
 * @package UserAPI
 */

require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (strtoupper($method) !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$currentUserId = $GLOBALS['currentUserId'] ?? ($_SESSION['user_id'] ?? 0);
if (!$currentUserId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$login = trim((string)($_POST['login'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$newPassword = isset($_POST['password']) ? trim((string)$_POST['password']) : '';

if ($login === '' || $email === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Required fields missing']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

if (mb_strlen($login) < 3 || mb_strlen($login) > 80) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Login must be 3..80 characters']);
    exit;
}
if (!preg_match('/^[\p{L}\p{N}_\.\-]+$/u', $login)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Login contains invalid characters']);
    exit;
}

try {
    $checkStmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id <> ?");
    if (!$checkStmt) {
        error_log('update_user: prepare (check email) failed: ' . $conn->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error']);
        exit;
    }
    $checkStmt->bind_param('si', $email, $currentUserId);
    $checkStmt->execute();
    $checkStmt->store_result();
    if ($checkStmt->num_rows > 0) {
        $checkStmt->close();
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email is already in use']);
        exit;
    }
    $checkStmt->close();
} catch (Throwable $e) {
    error_log('update_user: exception during email check: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit;
}

try {
    if ($newPassword !== '') {
        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?");
        if (!$stmt) {
            error_log('update_user: prepare (update with password) failed: ' . $conn->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
            exit;
        }
        $stmt->bind_param('sssi', $login, $email, $passwordHash, $currentUserId);
    } else {
        $stmt = $conn->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
        if (!$stmt) {
            error_log('update_user: prepare (update without password) failed: ' . $conn->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
            exit;
        }
        $stmt->bind_param('ssi', $login, $email, $currentUserId);
    }

    if (!$stmt->execute()) {
        error_log('update_user: execute failed: ' . $stmt->error);
        $stmt->close();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error']);
        exit;
    }

    $stmt->close();

    $_SESSION['user_name'] = $login;
    $_SESSION['user_email'] = $email;

    echo json_encode(['success' => true]);
    exit;

} catch (Throwable $e) {
    error_log('update_user: exception: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit;
}
