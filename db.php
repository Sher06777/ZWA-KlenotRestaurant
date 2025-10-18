<?php

// Параметры подключения — проверь их в панели хостинга или Adminer
$host   = 'localhost';
$dbname = 'achilkem';
$user   = 'achilkem';
$pass   = 'webove aplikace';
$port   = 3306; // при необходимости поменяй

// Включаем бросание исключений mysqli (удобно для отладки)
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$conn = null;

try {
    $conn = new mysqli($host, $user, $pass, $dbname, $port);
    $conn->set_charset('utf8mb4');
} catch (Throwable $e) {
    error_log('DB connection error: ' . $e->getMessage());
    http_response_code(500);
    echo 'DB connection failed.';
    exit;
}