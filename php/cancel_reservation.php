<?php
/**
 * cancel_reservation.php
 *
 * Odstraní rezervaci patřící aktuálnímu uživateli.
 * Očekává JSON tělo s { id: integer }.
 * Vrací { success: bool }.
 *
 * @package Reservations
 */
require_once __DIR__ . '/verify_csrf_token.php';
require_once __DIR__ . '/auth.php';

$data = $GLOBALS['REQUEST_JSON_BODY'] ?? json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
$user_id = $currentUserId;

$stmt = $conn->prepare("DELETE FROM reservations WHERE id = ? AND user_id = ?");
if (!$stmt) { error_log('cancel_res prepare failed: ' . $conn->error); echo json_encode(['success'=>false]); exit; }
$stmt->bind_param("ii", $id, $user_id);
$success = $stmt->execute();

echo json_encode(['success' => $success]);
$stmt->close();
$conn->close();
