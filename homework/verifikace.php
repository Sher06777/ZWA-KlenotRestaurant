<?php
session_start();

// Fiktivní databáze uživatelů
$users = [
    [
        "id" => 1,
        "name" => "Jan Novak",
        // heslo je "1234"
        "pass" => password_hash("1234", PASSWORD_DEFAULT)
    ]
];

function get_user_by_name($name)
{
    global $users;
    foreach ($users as $u) {
        if ($u["name"] === $name) {
            return $u;
        }
    }
    return null;
}

function verify($name, $pass)
{
    $user = get_user_by_name($name);
    if (!$user) return false;

    if (password_verify($pass, $user["pass"])) {
        return $user["id"];
    }
    return false;
}

if (isset($_POST["name"], $_POST["pass"])) {
    $name = $_POST["name"];
    $pass = $_POST["pass"];
    $user_id = verify($name, $pass);

    if ($user_id) {
        $_SESSION["logged"] = $user_id;
        header("Location: /");
        exit();
    } else {
        $error = "Nesprávné jméno nebo heslo.";
    }
}
?>
<!DOCTYPE html>
<html lang="cs">

<head>
    <meta charset="UTF-8">
    <title>Verifikace</title>
</head>

<body>
    <h1>Verifikace uživatele</h1>

    <?php if (!empty($error)): ?>
        <p style="color:red;"><?= $error ?></p>
    <?php endif; ?>

    <form method="post">
        <label for="name">Jméno:</label>
        <input type="text" id="name" name="name" required>
        <br>

        <label for="pass">Heslo:</label>
        <input type="password" id="pass" name="pass" required>
        <br>

        <button type="submit">Přihlásit se</button>
    </form>
</body>

</html>