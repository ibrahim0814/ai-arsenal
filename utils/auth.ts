import { supabase } from "./supabase-client";

// Session storage key for caching auth state
const AUTH_CACHE_KEY = 'arsenal_auth_cache';
const AUTH_ADMIN_KEY = 'arsenal_admin_status';
const AUTH_CACHE_EXPIRY = 'arsenal_auth_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper to store auth data in session storage
const cacheAuthData = (user: any, isAdmin: boolean) => {
  try {
    sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
    sessionStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(isAdmin));
    sessionStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
  } catch (e) {
    console.warn('Failed to cache auth data', e);
  }
};

// Helper to clear auth cache
const clearAuthCache = () => {
  try {
    sessionStorage.removeItem(AUTH_CACHE_KEY);
    sessionStorage.removeItem(AUTH_ADMIN_KEY);
    sessionStorage.removeItem(AUTH_CACHE_EXPIRY);
  } catch (e) {
    console.warn('Failed to clear auth cache', e);
  }
};

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
    clearAuthCache();
    return { error: { message: "Access denied. Admin rights required." } };
  }

  // Cache auth data after successful sign in
  cacheAuthData(data.user, true);
  console.log("Admin user successfully logged in");
  return { data };
}

export async function signOut() {
  clearAuthCache();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  // Try to get user from session storage first
  try {
    const cachedUser = sessionStorage.getItem(AUTH_CACHE_KEY);
    const expiry = sessionStorage.getItem(AUTH_CACHE_EXPIRY);

    // If we have valid cached data that hasn't expired
    if (cachedUser && expiry && Date.now() < parseInt(expiry)) {
      return JSON.parse(cachedUser);
    }
  } catch (e) {
    console.warn('Error reading from session storage', e);
  }

  // If not cached or expired, fetch from Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // If we got a user, cache it
  if (user) {
    const adminStatus = await isAdmin(user);
    cacheAuthData(user, adminStatus);
  } else {
    clearAuthCache();
  }
  
  return user;
}

export async function isAdmin(user: any) {
  if (!user) return false;
  
  // Try to get admin status from session storage first
  try {
    const cachedAdminStatus = sessionStorage.getItem(AUTH_ADMIN_KEY);
    const expiry = sessionStorage.getItem(AUTH_CACHE_EXPIRY);

    // If we have valid cached data that hasn't expired
    if (cachedAdminStatus && expiry && Date.now() < parseInt(expiry)) {
      return JSON.parse(cachedAdminStatus);
    }
  } catch (e) {
    console.warn('Error reading from session storage', e);
  }

  // If not cached or expired, fetch from Supabase
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  const isAdminStatus = data?.is_admin || false;
  
  // Cache the result
  try {
    sessionStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(isAdminStatus));
  } catch (e) {
    console.warn('Failed to cache admin status', e);
  }

  return isAdminStatus;
}
