<?php
include 'auth.php'; // подключаем для проверки авторизации и CSRF

// === Проверка авторизации ===
$currentUserId = $_SESSION['user_id'] ?? 0;
$currentUserIsAdmin = $_SESSION['isAdmin'] ?? 0;

if (!$currentUserId || $currentUserIsAdmin != 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

// === Проверка CSRF (как в auth.php) ===
$csrf_token = $_POST['csrf_token'] ?? '';

if (empty($csrf_token)) {
    $raw = file_get_contents('php://input');
    $json = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
        $csrf_token = $json['csrf_token'] ?? $json['csrf'] ?? '';
    }
}

if (empty($csrf_token) && function_exists('getallheaders')) {
    $headers = getallheaders();
    $csrf_token = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? $headers['X-Csrf-Token'] ?? '';
}

if (!verify_csrf_token($csrf_token)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid CSRF token']);
    exit;
}

// === ID пользователя для удаления ===
$userIdToDelete = intval($_POST['id'] ?? 0);
if ($userIdToDelete <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid user ID']);
    exit;
}

// Нельзя удалить самого себя
if ($userIdToDelete == $currentUserId) {
    echo json_encode(['success' => false, 'error' => 'Нельзя удалить свой аккаунт']);
    exit;
}

// === Проверка существования пользователя ===
$stmtCheck = $conn->prepare("SELECT id FROM users WHERE id = ?");
$stmtCheck->bind_param("i", $userIdToDelete);
$stmtCheck->execute();
$resultCheck = $stmtCheck->get_result();
if ($resultCheck->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
}

// === Удаление ===
try {
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param("i", $userIdToDelete);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'User not found']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
exit;