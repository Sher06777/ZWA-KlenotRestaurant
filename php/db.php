<?php
// db.php — безопасное подключение к БД и CSRF-утилиты.
// В production лучше получать креды из окружения (getenv) — здесь использованы значения, которые ты отдавал.

$host   = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'achilkem';
$user   = getenv('DB_USER') ?: 'achilkem';
$pass   = getenv('DB_PASS') ?: 'webove aplikace';
$port   = getenv('DB_PORT') ? (int)getenv('DB_PORT') : 3306;

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$conn = null;

try {
    $conn = new mysqli($host, $user, $pass, $dbname, $port);
    $conn->set_charset('utf8mb4');
} catch (Throwable $e) {
    // логируем детальную ошибку, но пользователю даём нейтральный ответ
    error_log('DB connection error: ' . $e->getMessage());
    http_response_code(500);
    // не выводим детали пароля/хоста на клиент
    echo json_encode(['success' => false, 'message' => 'DB connection failed.']);
    exit;
}

/**
 * Utility: Czech time
 */
function getCzechTime() {
    $dt = new DateTime("now", new DateTimeZone('Europe/Prague'));
    return $dt->format('Y-m-d H:i:s');
}
