<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
        <!-- ===== FORM MAIN (signin) ===== -->


    <section class="form-main invisible" id="signin-section">
      <form id="signin-form" method="post" class="form" novalidate>
        <div class="form-inside">
          <fieldset class="form-fieldset">
            <legend class="form-legend" data-i18n="signing-form.legend">Evening
              login</legend>

            <label for="main-name" class="form-name">
              <span data-i18n="signing-form.login">Login</span>
              <input type="text" id="main-name" name="login" autocomplete="on"
                required>
              <p class="error-message"></p>
            </label>

            <label for="main-email" class="form-signin">
              <span data-i18n="signing-form.email">Email</span>
              <input type="email" placeholder="example@gmail.com"
                id="main-email" name="email" autocomplete="email" required>
              <p class="error-message"></p>
            </label>

            <label for="main-password" class="form-password">
              <span data-i18n="signing-form.password">Password</span>
              <input type="password" id="main-password" name="password"
                autocomplete="current-password" required>
              <p class="error-message"></p>
            </label>

            <div class="form-reg-wrap">
              <div class="form-regestration-div">
                <button class="form-regestration-btn" type="button"
                  data-i18n="signing-form.create-account">Don't have an
                  account?</button>
                <svg class="form-regestration-border" width="100%" height="100%"
                  viewBox="0 0 200 200"
                  preserveAspectRatio="none">
                  <path class="form-regestration-border-path" d stroke="#000"
                    stroke-width="2.5"
                    fill="transparent" />
                </svg>
              </div>
            </div>

            <div class="form-submit-wrap">
              <!-- кнопка "Войти" (signin) -->
              <button class="form-submit-button form-submit-button--signin"
                type="submit" name="action" value="account"
                data-i18n="signing-form.signin-button">Sign in</button>
            </div>

          </fieldset>
        </div>
      </form>
    </section>

    <!-- ===== LOGIN / REGISTER SECTION ===== -->
    <section class="login-form-section invisible" id="login-section">
      <div class="login-form-all">
        <form class="login-form" method="post" id="register-form" novalidate>
          <div class="login-form-inside">
            <fieldset class="login-form-fieldset">
              <legend class="login-form-legend"
                data-i18n="login-form.create-account">Create account</legend>

              <!-- USERNAME -->
              <label for="login-username" class="login-form-username">
                <span data-i18n="signin-form.login">Login</span>
                <input
                  type="text"
                  placeholder="username123"
                  id="login-username"
                  name="login"
                  autocomplete="username"
                  required>
              </label>

              <!-- EMAIL -->
              <label for="login-email" class="login-form-email">
                <span data-i18n="signin-form.email">Email</span>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  id="login-email"
                  name="email"
                  autocomplete="email"
                  required>
              </label>

              <!-- PASSWORD -->
              <label for="login-password" class="login-form-password">
                <span data-i18n="signin-form.password">Password</span>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  autocomplete="new-password"
                  required>
              </label>

              <!-- CONFIRM PASSWORD -->
              <label for="login-password-confirm" class="login-form-password">
                <span data-i18n="signin-form.confirm-password">Confirm
                  password</span>
                <input
                  type="password"
                  id="login-password-confirm"
                  name="password_confirm"
                  autocomplete="new-password"
                  required>
              </label>

              <!-- SUBMIT -->
              <div class="login-form-submit-wrap">
                <button
                  class="form-submit-button--register"
                  type="submit"
                  name="action"
                  value="create-account"
                  data-i18n="login-form.create-account">
                  Create account
                </button>
              </div>

            </fieldset>
          </div>
        </form>
      </div>
    </section>
</body>
</html>