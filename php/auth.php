<?php
/**
 * auth.php
 *
 * Inicializace autorizace / kontrola session.
 * Připojuje session_init.php a db.php, poté zkontroluje, 
 * zda je aktuální skript veřejný (seznam $publicScripts).
 *
 * Pokud uživatel není autentizovaný — vrátí 401 JSON a ukončí skript.
 * Pokud je autentizován, uloží do $GLOBALS:
 *  - currentUserId
 *  - currentUserName
 *  - currentUserIsAdmin
 *
 * @package Auth
 */

require_once __DIR__ . '/session_init.php';
require_once __DIR__ . '/db.php';

$publicScripts = [
    'check_session.php',
    'get_csrf_token.php',
    'signin.php',
    'register.php',
    'check_role.php'
];

$self = basename($_SERVER['SCRIPT_NAME'] ?? ($_SERVER['PHP_SELF'] ?? ''));

// If this script is in the public list, don't enforce auth.
if (in_array($self, $publicScripts, true)) {
    return;
}

$currentUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;
$currentUserName = $_SESSION['user_name'] ?? null;
$currentUserIsAdmin = 0;
if ($currentUserId > 0) {
    // Fetch isAdmin flag from DB — small query to ensure permission source of truth.
    $stmtRole = $conn->prepare('SELECT `isAdmin` FROM `users` WHERE `id` = ? LIMIT 1');
    if ($stmtRole) {
        $stmtRole->bind_param('i', $currentUserId);
        $stmtRole->execute();
        $resRole = $stmtRole->get_result();
        if ($rowRole = $resRole->fetch_assoc()) {
            $currentUserIsAdmin = ((int)($rowRole['isAdmin'] ?? 0) === 1) ? 1 : 0;
            $_SESSION['isAdmin'] = $currentUserIsAdmin; // persist to session for later quick checks
        }
        $stmtRole->close();
    } else {
        // Log and fall back to non-admin; better to deny than to allow.
        error_log('auth.php: role query prepare failed: ' . $conn->error);
        $currentUserIsAdmin = 0;
    }
}

// If not authenticated — return JSON 401 and stop further script execution.
// Note: many endpoints include auth.php; this makes a centralized guard.
if ($currentUserId <= 0) {
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Not authenticated'
    ]);
    exit;
}

// Export useful globals for downstream scripts.
$GLOBALS['currentUserId'] = $currentUserId;
$GLOBALS['currentUserName'] = $currentUserName;
$GLOBALS['currentUserIsAdmin'] = $currentUserIsAdmin;

return;
