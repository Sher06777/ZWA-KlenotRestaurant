<?php
include 'auth.php'; // авторизация + защита CSRF

if (!isset($_SESSION['user_id']) || $_SESSION['isAdmin'] != 1) {
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

$limit = 5; // === 5 пользователей на страницу ===
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$offset = ($page - 1) * $limit;

try {
    // считаем общее количество пользователей
    $countResult = $conn->query("SELECT COUNT(*) AS total FROM users");
    $total = $countResult->fetch_assoc()['total'];
    $totalPages = ceil($total / $limit);

    // получаем текущую страницу
    $stmt = $conn->prepare("SELECT id, name, email, created_at FROM users ORDER BY id ASC LIMIT ? OFFSET ?");
    $stmt->bind_param("ii", $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();

    $users = [];
    while ($row = $result->fetch_assoc()) {
        $row['name'] = htmlspecialchars($row['name'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $row['email'] = htmlspecialchars($row['email'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $users[] = $row;
    }

    echo json_encode([
        'success' => true,
        'users' => $users,
        'totalPages' => $totalPages,
        'currentPage' => $page
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB Error']);
}