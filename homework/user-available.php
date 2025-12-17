<?php
$users = [
    [
        "id" => 1,
        "name" => "Jan",
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

if (isset($_GET["user"])) {
    $user = get_user_by_name($_GET["user"]);
    echo ($user ? "0" : "1");
} else {
    echo "0";
}

?>