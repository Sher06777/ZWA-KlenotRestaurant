<?php
/**
 * get_user_reservations.php
 *
 * Vrací seznam rezervací aktuálního uživatele (stránkování).
 * GET parametry: page (volitelně).
 *
 * Odpověď: { success: true, reservations: [...], page: n, totalPages: m, total: t }
 *
 * @package Reservations
 */

require_once __DIR__ . '/auth.php';

$userId = $_SESSION['user_id'] ?? 0;
if (!$userId) {
  echo json_encode(['success' => false, 'reservations' => []]);
  exit;
}

$limit = 2;
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$offset = ($page - 1) * $limit;

$stmt = $conn->prepare("SELECT COUNT(*) AS total FROM reservations WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$total = $stmt->get_result()->fetch_assoc()['total'] ?? 0;
$totalPages = ceil($total / $limit);

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
