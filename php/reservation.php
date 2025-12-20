<?php
/**
 * reservation.php
 *
 * Vytvoření rezervace uživatelem. Očekává POST pole:
 * name, phone, email, date (YYYY-MM-DD), time (HH:MM), people (int), message (volitelné).
 *
 * Vrací JSON { success: true } nebo { success: false, error: "..."}
 *
 * @package Reservations
 */
require_once __DIR__ . '/verify_csrf_token.php';
require_once __DIR__ . '/auth.php';

if (!isset($conn)) {
    echo json_encode(['success' => false, 'error' => 'Database connection error.']);
    exit;
}

if (!$currentUserId) {
    echo json_encode([
        'success' => false,
        'error' => 'Error: you are not authorized.'
    ]);
    exit;
}

$name = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$email = trim($_POST['email'] ?? '');
$date = trim($_POST['date'] ?? '');
$time = trim($_POST['time'] ?? '');
$people = intval($_POST['people'] ?? 0);
$message = trim($_POST['message'] ?? '');
$createdAt = getCzechTime();
$user_id = $currentUserId;

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Invalid email format.']); exit;
}

// Phone validation: simple pattern allowing +, digits, spaces, dashes and parentheses.
// Note: this is client/server-side convenience validation, not a guarantee of deliverability.
if (!preg_match('/^[0-9+\s\-()]{7,20}$/u', $phone)) {
    echo json_encode(['success' => false, 'error' => 'Invalid phone format.']); exit;
}

// Date validation expects YYYY-MM-DD; strtotime used as a secondary check.
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !strtotime($date)) {
    echo json_encode(['success' => false, 'error' => 'Invalid date.']); exit;
}

if (!preg_match('/^\d{2}:\d{2}$/', $time)) {
    echo json_encode(['success' => false, 'error' => 'Invalid time.']); exit;
}
if ($people < 1 || $people > 20) {
    echo json_encode(['success' => false, 'error' => 'Invalid number of guests.']); exit;
}

if (empty($name) || empty($phone) || empty($email) || empty($date) || empty($time) || $people < 1) {
    echo json_encode(['success' => false, 'error' => 'Please fill in all required fields.']);
    exit;
}

// Prepared statement to avoid SQL injection — types: i = int, s = string.
$stmt = $conn->prepare("
    INSERT INTO reservations (user_id, name, phone, email, date, time, people, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
    error_log('reservation insert failed: ' . $conn->error);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

$stmt->bind_param("isssssiss", $user_id, $name, $phone, $email, $date, $time, $people, $message, $createdAt);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $stmt->error]);
}

$stmt->close();
$conn->close();
