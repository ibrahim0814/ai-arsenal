import { supabase } from "./supabase-client";

export async function signIn(email: string, password: string) {
  console.log("Attempting to sign in:", email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error);
    return { error };
  }

  console.log("User signed in:", data.user.id);

  // Check if the user is an admin
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return {
      error: { message: "Error verifying user status. Please try again." },
    };
  }

  if (!profileData || !profileData.is_admin) {
    console.log("User is not an admin:", profileData);
    await supabase.auth.signOut();
    return { error: { message: "Access denied. Admin rights required." } };
  }

  console.log("Admin user successfully logged in");
  return { data };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin(user: any) {
  if (!user) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  return data?.is_admin || false;
}
