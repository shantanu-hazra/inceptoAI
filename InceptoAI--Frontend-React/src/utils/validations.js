const validateUsername = (username) => {
  if (!username) return "Name is required";
  if (username.length < 3) return "Name must be at least 3 characters";
  if (username.length > 50) return "Name must be less than 50 characters";
  return "";
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return "";
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter";

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password))
    return "Password must contain at least one lowercase letter";

  // Check for at least one number
  if (!/[0-9]/.test(password))
    return "Password must contain at least one number";

  return "";
};

const validateConfirmPassword = (confirmPassword, password) => {
  if (!confirmPassword) return "Please confirm your password";
  if (confirmPassword !== password) return "Passwords do not match";
  return "";
};

export {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
};
