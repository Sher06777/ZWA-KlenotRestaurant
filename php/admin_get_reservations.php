<?php
include 'auth.php'; // подключаем для проверки авторизации и CSRF

// Проверка — пользователь авторизован и является админом
if (!isset($_SESSION['user_id']) || empty($_SESSION['isAdmin'])) {
    echo json_encode(['success' => false, 'error' => 'Недостаточно прав']);
    exit;
}

$page = max(1, intval($_GET['page'] ?? 1));
$limit = 5;
$offset = ($page - 1) * $limit;

// количество всего резерваций
$totalQuery = $conn->query("SELECT COUNT(*) AS c FROM reservations");
$total = ($totalQuery && $row = $totalQuery->fetch_assoc()) ? intval($row['c']) : 0;
$pages = ceil($total / $limit);

$sql = "
    SELECT id, name, phone, email, date, time, people, message, user_id
    FROM reservations
    ORDER BY id DESC
    LIMIT $limit OFFSET $offset
";
$result = $conn->query($sql);

if (!$result) {
    echo json_encode(['success' => false, 'error' => 'Ошибка БД']);
    exit;
}

$data = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode([
    'success' => true,
    'reservations' => $data,
    'page' => $page,
    'pages' => $pages,
    'total' => $total
]);
exit;
