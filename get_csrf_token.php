<?php
require_once 'session_init.php';
include 'security_headers.php';
require 'db.php';
header('Content-Type: application/json; charset=utf-8');

echo json_encode(['csrf_token' => get_csrf_token()]);
exit;