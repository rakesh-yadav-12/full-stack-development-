<?php
// auth.php
session_start();

// Redirect if already logged in
if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$error = '';
$success = '';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require_once 'config/database.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    if (isset($_POST['login'])) {
        // Login
        $email = trim($_POST['email']);
        $password = $_POST['password'];
        
        $query = "SELECT id, username, email, password FROM users WHERE email = :email OR username = :email";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        if ($user = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['email'] = $user['email'];
                
                // Update last login
                $update = "UPDATE users SET last_login = NOW() WHERE id = :id";
                $stmt = $db->prepare($update);
                $stmt->bindParam(':id', $user['id']);
                $stmt->execute();
                
                header("Location: index.php");
                exit();
            } else {
                $error = "Invalid password!";
            }
        } else {
            $error = "User not found!";
        }
    } elseif (isset($_POST['signup'])) {
        // Signup
        $username = trim($_POST['username']);
        $email = trim($_POST['email']);
        $password = $_POST['password'];
        $confirm_password = $_POST['confirm_password'];
        
        // Validation
        if (strlen($username) < 3) {
            $error = "Username must be at least 3 characters long!";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = "Invalid email format!";
        } elseif (strlen($password) < 6) {
            $error = "Password must be at least 6 characters long!";
        } elseif ($password !== $confirm_password) {
            $error = "Passwords do not match!";
        } else {
            // Check if user exists
            $check = "SELECT id FROM users WHERE email = :email OR username = :username";
            $stmt = $db->prepare($check);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $error = "Username or email already exists!";
            } else {
                // Create new user
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                
                $insert = "INSERT INTO users (username, email, password) VALUES (:username, :email, :password)";
                $stmt = $db->prepare($insert);
                $stmt->bindParam(':username', $username);
                $stmt->bindParam(':email', $email);
                $stmt->bindParam(':password', $hashed_password);
                
                if ($stmt->execute()) {
                    $success = "Account created successfully! You can now login.";
                } else {
                    $error = "Something went wrong. Please try again.";
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spotify Clone - Authentication</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/utility.css">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
        }
        
        .auth-container {
            width: 100%;
            max-width: 450px;
            background: rgba(0, 0, 0, 0.85);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .auth-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .auth-header img {
            width: 60px;
            height: 60px;
            margin-bottom: 15px;
        }
        
        .auth-header h1 {
            color: #1db954;
            font-size: 32px;
            margin: 0;
        }
        
        .auth-header p {
            color: #b3b3b3;
            margin: 10px 0 0;
        }
        
        .auth-tabs {
            display: flex;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
        }
        
        .auth-tab {
            flex: 1;
            text-align: center;
            padding: 10px;
            cursor: pointer;
            color: #b3b3b3;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .auth-tab.active {
            color: #1db954;
            border-bottom: 2px solid #1db954;
        }
        
        .auth-form {
            display: none;
        }
        
        .auth-form.active {
            display: block;
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            color: #fff;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px 15px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid transparent;
            border-radius: 10px;
            color: #fff;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #1db954;
            background: rgba(255, 255, 255, 0.15);
        }
        
        .form-group input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }
        
        .btn-auth {
            width: 100%;
            padding: 14px;
            background: #1db954;
            border: none;
            border-radius: 30px;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }
        
        .btn-auth:hover {
            background: #1ed760;
            transform: scale(1.02);
        }
        
        .btn-auth:active {
            transform: scale(0.98);
        }
        
        .error-message {
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid #ff4444;
            color: #ff4444;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .success-message {
            background: rgba(29, 185, 84, 0.2);
            border: 1px solid #1db954;
            color: #1db954;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .auth-footer {
            text-align: center;
            margin-top: 20px;
            color: #b3b3b3;
            font-size: 14px;
        }
        
        .auth-footer a {
            color: #1db954;
            text-decoration: none;
            font-weight: 600;
        }
        
        .auth-footer a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 480px) {
            .auth-container {
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-header">
            <img src="logo.svg" alt="Spotify Clone" class="invert">
            <h1>Spotify Clone</h1>
            <p>Listen to music, your way</p>
        </div>
        
        <?php if ($error): ?>
            <div class="error-message"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="success-message"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>
        
        <div class="auth-tabs">
            <div class="auth-tab active" onclick="switchTab('login')">LOGIN</div>
            <div class="auth-tab" onclick="switchTab('signup')">SIGN UP</div>
        </div>
        
        <!-- Login Form -->
        <form method="POST" action="" class="auth-form active" id="login-form">
            <div class="form-group">
                <label>Email or Username</label>
                <input type="text" name="email" placeholder="Enter your email or username" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" placeholder="Enter your password" required>
            </div>
            <button type="submit" name="login" class="btn-auth">LOGIN</button>
        </form>
        
        <!-- Signup Form -->
        <form method="POST" action="" class="auth-form" id="signup-form">
            <div class="form-group">
                <label>Username</label>
                <input type="text" name="username" placeholder="Choose a username" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" placeholder="Enter your email" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" placeholder="Create a password (min. 6 characters)" required>
            </div>
            <div class="form-group">
                <label>Confirm Password</label>
                <input type="password" name="confirm_password" placeholder="Confirm your password" required>
            </div>
            <button type="submit" name="signup" class="btn-auth">SIGN UP</button>
        </form>
        
        <div class="auth-footer">
            By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </div>
    </div>
    
    <script>
        function switchTab(tab) {
            const tabs = document.querySelectorAll('.auth-tab');
            const forms = document.querySelectorAll('.auth-form');
            
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            if (tab === 'login') {
                tabs[0].classList.add('active');
                document.getElementById('login-form').classList.add('active');
            } else {
                tabs[1].classList.add('active');
                document.getElementById('signup-form').classList.add('active');
            }
        }
        
        // Show signup tab if there's an error in signup
        <?php if (isset($_POST['signup']) && $error): ?>
        switchTab('signup');
        <?php endif; ?>
    </script>
</body>
</html>