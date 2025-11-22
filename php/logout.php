<?php
require_once 'session_init.php'; 
include 'security_headers.php'; 
include 'db.php';
session_unset();
session_destroy();
setcookie(session_name(), '', time() - 3600, '/');

session_start();
get_csrf_token();
echo json_encode(['success' => true]);
?>