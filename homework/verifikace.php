<?php
session_start();

// Fiktivní databáze uživatelů
$users = [
    ["name" => "Jan"]
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

// function verify($name, $pass)
// {
//     $user = get_user_by_name($name);
//     if (!$user) return false;

//     if (password_verify($pass, $user["pass"])) {
//         return $user["id"];
//     }
//     return false;
// }

// if (isset($_POST["name"], $_POST["pass"])) {
//     $name = $_POST["name"];
//     $pass = $_POST["pass"];
//     $user_id = verify($name, $pass);

//     if ($user_id) {
//         $_SESSION["logged"] = $user_id;
//         header("Location: /");
//         exit();
//     } else {
//         $error = "Nesprávné jméno nebo heslo.";
//     }
// }

if (isset($_GET["user"])) {
    $user = get_user_by_name($_GET["user"]);
    echo ($user ? "1" : "0");
    exit;
} else {
    echo "0";
}

?>
<!DOCTYPE html>
<html lang="cs">

<head>
    <meta charset="UTF-8">
    <title>Verifikace</title>
    <style>
        .available {
            border: 2px solid green;
        }
    </style>
</head>

<body>
    
    <h1>Verifikace uživatele</h1>

    <form>
        <input type="text" id="name" name="name" required>
        <br>

        
    </form>

    <script>
        let input = document.querySelector('[name="name"]');

        function odpoved(e) {
            let response = e.target.responseText.trim();
            input.classList.toggle("available", response == "1");
        }

        function kontrola(e) {
            let xhr = new XMLHttpRequest();
            let url = "/~abdimshe/homework/verifikace.php?user=" 
                    + encodeURIComponent(e.target.value);

            xhr.open("GET", url, true);
            xhr.addEventListener("load", odpoved);
            xhr.send();
        }

        input.addEventListener("blur", kontrola);
    </script>
</body>

</html>