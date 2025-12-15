<?php
/**
 * admin_delete_reservation.php
 *
 * Odstranění rezervace administrátorem.
 * Očekává POST s polem id (integer).
 *
 * Vrací JSON { success: true } při úspěšném smazání,
 * nebo HTTP chybový kód + { success: false, error: "..."}.
 *
 * @package AdminAPI
 */

declare(strict_types=1);
require_once __DIR__ . '/verify_csrf_token.php';
require_once __DIR__ . '/auth.php';
header('Content-Type: application/json; charset=utf-8');

$currentIsAdmin = $GLOBALS['currentUserIsAdmin'] ?? ($_SESSION['isAdmin'] ?? 0);
if ((int)$currentIsAdmin !== 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid ID']);
    exit;
}

try {
    $stmt = $conn->prepare("DELETE FROM reservations WHERE id = ?");
    if (!$stmt) throw new Exception('DB prepare failed: ' . $conn->error);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $affected = $stmt->affected_rows;
    $stmt->close();

    if ($affected > 0) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Reservation not found']);
    }
    exit;

} catch (Throwable $e) {
    error_log('admin_delete_reservation error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
    exit;
}
