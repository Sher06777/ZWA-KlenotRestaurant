<?php
// check_session.php — публичный endpoint, возвращает краткую информацию о текущей сессии (без принудительной авторизации)
require 'session_init.php';
require 'db.php';
header('Content-Type: application/json; charset=utf-8');

$response = [
    'loggedIn' => false,
    'user' => null
];

if (isset($_SESSION['user_id']) && !empty($_SESSION['user_id'])) {
    $userId = intval($_SESSION['user_id']);

    // безопасно получаем поля (prepared)
    $stmt = $conn->prepare("SELECT email, name, password FROM users WHERE id = ?");
    if ($stmt) {
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc() ?: [];
        $stmt->close();

        $password = $row['password'] ?? '';
        $password_mask = '••••••••';

        // sanitize text fields before sending to client
        $name  = htmlspecialchars($row['name'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $email = htmlspecialchars($row['email'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        $response['loggedIn'] = true;
        $response['user'] = [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'password_mask' => $password_mask
        ];
    } else {
        // DB error (не раскрываем детали)
        error_log('check_session prepare failed: ' . $conn->error);
    }
}

echo json_encode($response);
exit;
