<?php
/**
 * db.php
 *
 * Připojení k MySQL databázi (mysqli) a pomocné utility.
 * Konfigurace je čtena z environment proměnných DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_PORT.
 *
 * Dále exportuje pomocnou funkci getCzechTime().
 *
 * @package Database
 */

$host   = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'abdimshe';
$user   = getenv('DB_USER') ?: 'abdimshe';
$pass   = getenv('DB_PASS') ?: 'webove aplikace';
$port   = getenv('DB_PORT') ? (int)getenv('DB_PORT') : 3306;

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$conn = null;

try {
    $conn = new mysqli($host, $user, $pass, $dbname, $port);
    $conn->set_charset('utf8mb4');
} catch (Throwable $e) {
    error_log('DB connection error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed.']);
    exit;
}

/**
 * Utility: český čas
 *
 * Vrací aktuální datum/čas v časové zóně Europe/Prague ve formátu 'Y-m-d H:i:s'.
 *
 * @return string Aktuální čas v české časové zóně.
 */
function getCzechTime() {
    $dt = new DateTime("now", new DateTimeZone('Europe/Prague'));
    return $dt->format('Y-m-d H:i:s');
}
