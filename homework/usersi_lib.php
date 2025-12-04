<?php

$avatar = trim($_POST['avatar'] ?? '');
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');

function list_users() {
    $data_str = file_get_contents('users.json');
    return json_decode($data_str, true);
}

function get_user($id) {
    $users = list_users();
    foreach ($users as $user) {
        if ($user["id"] == $id) return $user;
    }
    return null;
}

function add_user($name, $email, $avatar) {
    $user = [
        "id" => uniqid(),
        "name" => $name,
        "email" => $email,
        "avatar" => $avatar
    ];
    $users = list_users();
    $users[] = $user;
    $users_str = json_encode($users);

    file_put_contents('users.json', $users_str);
}

function write_users(&$users) {
    $users_str = json_encode($users);
    file_put_contents('users.json', $users_str);
}

function delete_user($id) {
    $users = list_users();
    $remaining = [];
    foreach ($users as $user) {
        if ($user["id"] != $id) $remaining[] = $user;
    }
    write_users($remaimning);
}

function edit_user($id, $name, $email, $avatar) {
    $users = list_users();
    foreach ($users as &$user) {
        if($user['id'] == $id) {
            $user['name'] = $name;
            $user['email'] = $email;
            $user['avatar'] = $avatar;
        }
    }
    write_users($users);
}

?>
