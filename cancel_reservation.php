<?php
include 'auth.php';

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
$user_id = $currentUserId;

$stmt = $conn->prepare("DELETE FROM reservations WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $id, $user_id);
$success = $stmt->execute();

echo json_encode(['success' => $success]);
$stmt->close();
$conn->close();
