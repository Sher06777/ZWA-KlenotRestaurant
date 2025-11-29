<?php
// get_csrf_token.php — отдаёт токен CSRF, публичный endpoint
require 'session_init.php';
require 'security_headers.php';
header('Content-Type: application/json; charset=utf-8');
http_response_code(200);

// возвращаем токен в JSON
echo json_encode(['csrf_token' => get_csrf_token()]);
exit;
