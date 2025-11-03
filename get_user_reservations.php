<?php
include 'auth.php';

$userId = $_SESSION['user_id'] ?? 0;
if (!$userId) {
  echo json_encode(['success' => false, 'reservations' => []]);
  exit;
}

$stmt = $conn->prepare("
  SELECT id, name, phone, email, date, time, people, message 
  FROM reservations 
  WHERE user_id = ? 
  ORDER BY date DESC, time DESC
");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$reservations = [];
while ($row = $result->fetch_assoc()) {
  $reservations[] = $row;
}

echo json_encode(['success' => true, 'reservations' => $reservations]);

$stmt->close();
$conn->close();
