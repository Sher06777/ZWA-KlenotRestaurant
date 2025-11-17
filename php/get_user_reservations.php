<?php
require 'auth.php';

$userId = $_SESSION['user_id'] ?? 0;
if (!$userId) {
  echo json_encode(['success' => false, 'reservations' => []]);
  exit;
}

// pagination
$limit = 2; // показываем 2 за раз
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$offset = ($page - 1) * $limit;

// считаем количество резерваций и страницы
$stmt = $conn->prepare("SELECT COUNT(*) AS total FROM reservations WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$total = $stmt->get_result()->fetch_assoc()['total'] ?? 0;
$totalPages = ceil($total / $limit);

// подгружаем только нужные резервации
$stmt = $conn->prepare("
  SELECT id, name, phone, email, date, time, people, message
  FROM reservations
  WHERE user_id = ?
  ORDER BY date DESC, time DESC
  LIMIT ? OFFSET ?
");
$stmt->bind_param("iii", $userId, $limit, $offset);
$stmt->execute();
$result = $stmt->get_result();
$reservations = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode([
  'success' => true,
  'reservations' => $reservations,
  'page' => $page,
  'totalPages' => $totalPages,
  'total' => $total
]);
exit;
