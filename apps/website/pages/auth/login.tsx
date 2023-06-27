"use client";

import AuthForm from "../../components/AuthForm";

export default function LoginPage() {
  return (
    <AuthForm
      title="Login to FieldZoo"
      view="sign_in"
      variables={{
        sign_in: {
          button_label: "Login",
          loading_button_label: "Logging in ...",
          social_provider_text: "Login with {{provider}}",
        },
      }}
      alternateUrl="/auth/signup"
      alternateText="Sign up for an account"
      redirectUrl="/"
    />
  );
}
