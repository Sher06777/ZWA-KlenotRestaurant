<?php
// update_user.php
// Обновление данных текущего пользователя (name/login, email и опционально password).
// Требует авторизации — подключает auth.php.
// Возвращает JSON. Внутренние ошибки логируются, клиент получает generic сообщения.

// declare(strict_types=1);

require_once __DIR__ . '/auth.php'; // это подключит session_init.php и db.php, и обеспечит $currentUserId
// После require auth.php, $currentUserId доступен либо как переменная, либо в $GLOBALS['currentUserId'].

header('Content-Type: application/json; charset=utf-8');

// Метод — только POST
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (strtoupper($method) !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Определяем текущего пользователя безопасно
$currentUserId = $GLOBALS['currentUserId'] ?? ($_SESSION['user_id'] ?? 0);
if (!$currentUserId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Читаем и тримим входящие поля
$login = trim((string)($_POST['login'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$newPassword = isset($_POST['password']) ? trim((string)$_POST['password']) : '';

// Базовая валидация
if ($login === '' || $email === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Required fields missing']);
    exit;
}

// Email валидность
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Login: длина и допустимые символы
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


// Проверка уникальности email (кроме текущего пользователя)
try {
    $checkStmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id <> ?");
    if (!$checkStmt) {
        // Логируем внутреннюю ошибку и возвращаем generic
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
        http_response_code(409); // Conflict
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

// Готовим обновление
try {
    if ($newPassword !== '') {
        // обновляем и пароль
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
        // обновляем без пароля
        $stmt = $conn->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
        if (!$stmt) {
            error_log('update_user: prepare (update without password) failed: ' . $conn->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Server error']);
            exit;
        }
        $stmt->bind_param('ssi', $login, $email, $currentUserId);
    }

    // Выполняем
    if (!$stmt->execute()) {
        // Логируем внутреннюю ошибку (не раскрываем клиенту)
        error_log('update_user: execute failed: ' . $stmt->error);
        $stmt->close();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error']);
        exit;
    }

    $stmt->close();

    // Обновляем сессию безопасно (храним "сырые" значения; клиент будет рендерить через textContent)
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
