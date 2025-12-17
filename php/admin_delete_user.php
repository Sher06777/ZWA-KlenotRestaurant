<?php
/**
 * admin_delete_user.php
 *
 * Administrátorský endpoint pro smazání uživatele dle id.
 * Vyžaduje POST a práva administrátora.
 *
 * @package AdminAPI
 */

declare(strict_types=1);

require_once __DIR__ . '/auth.php';
header('Content-Type: application/json; charset=utf-8');

$currentUserId = $GLOBALS['currentUserId'] ?? ($_SESSION['user_id'] ?? 0);
$currentIsAdmin = $GLOBALS['currentUserIsAdmin'] ?? ($_SESSION['isAdmin'] ?? 0);
if (!$currentUserId || (int)$currentIsAdmin !== 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$userIdToDelete = intval($_POST['id'] ?? 0);
if ($userIdToDelete <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid user ID']);
    exit;
}

if ($userIdToDelete === (int)$currentUserId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Cannot delete your own account']);
    exit;
}

try {
    $stmtCheck = $conn->prepare("SELECT id FROM users WHERE id = ?");
    if (!$stmtCheck) throw new Exception('DB prepare failed: ' . $conn->error);
    $stmtCheck->bind_param("i", $userIdToDelete);
    $stmtCheck->execute();
    $res = $stmtCheck->get_result();
    if ($res->num_rows === 0) {
        $stmtCheck->close();
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }
    $stmtCheck->close();

    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    if (!$stmt) throw new Exception('DB prepare failed: ' . $conn->error);
    $stmt->bind_param("i", $userIdToDelete);
    $stmt->execute();
    $affected = $stmt->affected_rows;
    $stmt->close();

    if ($affected > 0) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
    }
    exit;

} catch (Throwable $e) {
    error_log('admin_delete_user error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
    exit;
}
