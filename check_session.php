<?php
include 'security_headers.php';
include 'db.php';
session_start();

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
