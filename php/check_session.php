<?php
include 'auth.php'; // подключаем для проверки авторизации и CSRF

$response = [
  'loggedIn' => isset($_SESSION['user_id']),
  'user' => null
];

if (isset($_SESSION['user_id'])) {
    $userId = intval($_SESSION['user_id']);

    $stmt = $conn->prepare("SELECT email, name, password FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc() ?: [];

    $password = $row['password'] ?? '';
    $passLen = strlen($password);
    $password_mask = $passLen >= 2 ? $password[0] . str_repeat('•', $passLen - 2) . $password[$passLen-1] : str_repeat('•', $passLen);

    $row['name']  = htmlspecialchars($row['name'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $row['email'] = htmlspecialchars($row['email'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    $response['loggedIn'] = true;
    $response['user'] = [
        'id' => $userId,
        'name' => $row['name'] ?? '',
        'email' => $row['email'] ?? '',
        'password_mask' => $password_mask
    ];
}


echo json_encode($response);
exit;
