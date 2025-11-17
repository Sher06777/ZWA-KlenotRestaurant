<?php
require_once 'session_init.php';
header('Content-Type: application/json');

echo json_encode([
    'logged' => isset($_SESSION['user_id']),
    'isAdmin' => $_SESSION['isAdmin'] ?? 0
]);
exit;