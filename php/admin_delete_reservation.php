<?php
// admin_delete_reservation.php — удаление резервации (admin only)
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
header('Content-Type: application/json; charset=utf-8');

// Проверка прав администратора
$currentIsAdmin = $GLOBALS['currentUserIsAdmin'] ?? ($_SESSION['isAdmin'] ?? 0);
if ((int)$currentIsAdmin !== 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

// Метод — POST
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// CSRF проверка выполняется централизованно (verify_csrf_token.php)

// Валидируем id
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
