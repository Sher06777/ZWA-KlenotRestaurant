<?php
session_start();
require 'db.php';
include 'security_headers.php';

echo json_encode(['csrf_token' => get_csrf_token()]);
exit;