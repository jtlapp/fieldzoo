"use client";

import AuthForm from "../../components/AuthForm";

export default function SignUpPage() {
  return (
    <AuthForm
      title="Sign up with FieldZoo"
      view="sign_in"
      theme="dark"
      alternateUrl="/auth/login"
      alternateText="Login to an existing account"
      redirectUrl="/"
    />
  );
}
