<?php
// check_role.php — возвращает базовую информацию о сессии/правах (публичный endpoint)
require 'session_init.php';
header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'logged'  => isset($_SESSION['user_id']) && !empty($_SESSION['user_id']),
    'isAdmin' => (isset($_SESSION['isAdmin']) && (int)$_SESSION['isAdmin']) ? 1 : 0
]);
exit;
