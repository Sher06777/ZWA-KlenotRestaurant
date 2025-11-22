<?php

//def CSRF (Cross-Site Request Forgery) - attack
$host   = 'localhost';
$dbname = 'abdimshe';
$user   = 'abdimshe';
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

function get_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}
function verify_csrf_token($token) {
    return !empty($token) && hash_equals($_SESSION['csrf_token'] ?? '', $token);
}

function getCzechTime() {
    $dt = new DateTime("now", new DateTimeZone('Europe/Prague'));
    return $dt->format('Y-m-d H:i:s');
}