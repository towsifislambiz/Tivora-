export function getFriendlyAuthErrorMessage(errorCode, defaultMessage = "An unexpected error occurred. Please try again.") {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'The email or password you entered is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/requires-recent-login':
      return 'Please log in again to perform this operation.';
    case 'auth/expired-action-code':
    case 'auth/invalid-action-code':
      return 'The action link has expired or is invalid. Please request a new link.';
    default:
      return defaultMessage;
  }
}
