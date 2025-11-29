<?php
// admin_get_reservations.php — пагинация резерваций (admin only)
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
header('Content-Type: application/json; charset=utf-8');

// Права
$currentIsAdmin = $GLOBALS['currentUserIsAdmin'] ?? ($_SESSION['isAdmin'] ?? 0);
if ((int)$currentIsAdmin !== 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

// Пагинация (безопасные целые)
$page = max(1, intval($_GET['page'] ?? 1));
$limit = 5;
$offset = ($page - 1) * $limit;

try {
    // total count
    $countRes = $conn->query("SELECT COUNT(*) AS c FROM reservations");
    if (!$countRes) {
        throw new Exception('Count query failed: ' . $conn->error);
    }
    $countRow = $countRes->fetch_assoc();
    $total = intval($countRow['c'] ?? 0);
    $pages = $total > 0 ? (int)ceil($total / $limit) : 1;

    // SELECT with validated integers injected
    $sql = sprintf(
        "SELECT id, name, phone, email, date, time, people, message, user_id
         FROM reservations
         ORDER BY id DESC
         LIMIT %d OFFSET %d",
        $limit,
        $offset
    );

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('DB prepare failed: ' . $conn->error);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = [
            'id' => (int)($row['id'] ?? 0),
            'name' => (string)($row['name'] ?? ''),
            'phone' => (string)($row['phone'] ?? ''),
            'email' => (string)($row['email'] ?? ''),
            'date' => (string)($row['date'] ?? ''),
            'time' => (string)($row['time'] ?? ''),
            'people' => (int)($row['people'] ?? 0),
            'message' => (string)($row['message'] ?? ''),
            'user_id' => (int)($row['user_id'] ?? 0)
        ];
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'reservations' => $data,
        'page' => $page,
        'pages' => $pages,
        'total' => $total
    ]);
    exit;

} catch (Throwable $e) {
    error_log('admin_get_reservations error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB Error']);
    exit;
}
