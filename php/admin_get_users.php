<?php
/**
 * admin_get_users.php
 *
 * Vrací seznam uživatelů (stránkování) — dostupné pouze administrátorovi.
 * GET parametr: page (volitelný).
 *
 * Odpověď: { success: true, users: [...], totalPages: n, currentPage: m }
 *
 * @package AdminAPI
 */

declare(strict_types=1);
require_once __DIR__ . '/auth.php';
header('Content-Type: application/json; charset=utf-8');

$currentIsAdmin = $GLOBALS['currentUserIsAdmin'] ?? ($_SESSION['isAdmin'] ?? 0);
// Deny if not admin.
if ((int)$currentIsAdmin !== 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

// Pagination: small default page size; can be increased but keep an upper bound.
$limit = 5;
$maxLimit = 100;
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
if ($page < 1) $page = 1;
$offset = ($page - 1) * $limit;

try {
    // Count total rows for pagination
    $countRes = $conn->query("SELECT COUNT(*) AS total FROM users");
    if (!$countRes) {
        throw new Exception('Count query failed: ' . $conn->error);
    }
    $countRow = $countRes->fetch_assoc();
    $total = intval($countRow['total'] ?? 0);
    $totalPages = $total > 0 ? (int)ceil($total / $limit) : 1;

    // Using sprintf here with integers is safe because $limit and $offset are ints.
    // If these could be user-controlled strings, we'd need parameterized queries.
    $sql = sprintf("SELECT id, name, email, created_at FROM users ORDER BY id ASC LIMIT %d OFFSET %d", $limit, $offset);
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('DB prepare failed: ' . $conn->error);
    }
    $stmt->execute();
    $res = $stmt->get_result();

    $users = [];
    while ($row = $res->fetch_assoc()) {
        $users[] = [
            'id' => (int)($row['id'] ?? 0),
            'name' => (string)($row['name'] ?? ''),
            'email' => (string)($row['email'] ?? ''),
            'created_at' => (string)($row['created_at'] ?? '')
        ];
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'users' => $users,
        'totalPages' => $totalPages,
        'currentPage' => $page
    ]);
    exit;

} catch (Throwable $e) {
    error_log('admin_get_users error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB Error']);
    exit;
}
