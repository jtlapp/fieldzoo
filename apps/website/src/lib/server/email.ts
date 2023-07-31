export const sendEmailVerificationLink = async (token: string) => {
  const url = `http://localhost:5173/auth/verify-email/${token}`;
  console.log(`Your email verification link: ${url}`);
};

export const sendPasswordResetLink = async (token: string) => {
  const url = `http://localhost:5173/auth/reset-password/${token}`;
  console.log(`Your password reset link: ${url}`);
};
