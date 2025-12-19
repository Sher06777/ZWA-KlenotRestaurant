<?php
session_start();
// $pass = 0;
// if (isset($_POST['name']) && isset($_POST['pass'])) {
//     $name = $_POST['name'];

//     $pass = $_POST['pass'];

//     $user_id = verify($name, $pass);
//     if ($user_id) {
//         $_SESSION['logged'] = $user_id;
//         header('Lokation: /');
//     }
// }

// $password = password_hash($pass, PASSWORD_DEFAULT);

// $users = [
//     ['id'=>15, 'name'=>'ondra', "salt"=>'123', 'pass'=>password_hash($pass, PASSWORD_DEFAULT)],
//     ['id'=>16, 'name'=>'tonda', "salt"=>'456', 'pass'=>password_hash($pass, PASSWORD_DEFAULT)]
// ];



// function verify($name, $pass) {
//     $user = get_user_by_name($name);
//     if ($user['pass'] == password_verify($pass, $user['pass'])) return $user['id'];
// }

// echo $pass

// bezkolizni, jednosmerna, determisticka, pomala - какие качества должны быть у функции шифрования

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <form action="_index.php" method="POST">
        <input type="hidden" name="action" value="add">
        <label>Name: <input name="login"></label>
        <button type="submit">Add User</button>
    </form>
</body>
</html>
