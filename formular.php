<?php
    $email = '';
    if (isset($_POST['email'])) {
        $email = $_POST["email"];
        echo "Odeslaný e-mail: " . $email;
        if (strlen($email) < 2) {
            echo "kratky email";
        }
    }
?>
<form method="post" action="formular.php">
    <fieldset>
        <legend>Table Reservation</legend>
            <span>Full Name</span>
            <input type="text" name="email" value="<?php echo $email; ?>">
            <input type="text" name="password">
            <input type="submit" name="name">
    </fieldset>
</form>

<input type="submit" name="send">