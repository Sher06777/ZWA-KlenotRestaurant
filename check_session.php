<?php
session_start();
include('db.php');
header('Content-Type: application/json; charset=utf-8');

$response = [
  'loggedIn' => isset($_SESSION['user_id']),
  'user' => null
];

if ($response['loggedIn']) {
    $userId = $_SESSION['user_id'];
    $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $password = $row['password'] ?? '';
    $passLen = strlen($password);
    $password_mask = $passLen >= 2 ? $password[0] . str_repeat('•', $passLen - 2) . $password[$passLen-1] : str_repeat('•', $passLen);

    $response['user'] = [
        'id' => $_SESSION['user_id'],
        'name' => $_SESSION['user_name'],
        'email' => $_SESSION['user_email'],
        'password_mask' => $password_mask
    ];
}

echo json_encode($response);
exit;
