"use client";

import AuthForm from "../../components/AuthForm";

export default function SignUpPage() {
  return (
    <AuthForm
      title="Sign up with FieldZoo"
      view="sign_up"
      theme="dark"
      alternateUrl="/auth/login"
      alternateText="Login to an existing account"
      variables={{
        sign_in: {
          button_label: "Sign Up",
          loading_button_label: "Signing in ...",
          social_provider_text: "Sign in with {{provider}}",
        },
      }}
      redirectUrl="/"
    />
  );
}
